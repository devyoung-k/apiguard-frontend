"use client"

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Mail, MessageSquare, Trash2, X, Loader2, AlertCircle, Send, Webhook, Edit } from "lucide-react";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import * as alertsApi from "@/lib/api/alerts";
import * as projectsApi from "@/lib/api/projects";
import * as endpointsApi from "@/lib/api/endpoints";
import type {
  AlertDeliveryResponse,
  AlertResponse,
  AlertType,
  EndpointResponse,
  ProjectResponse,
} from "@/types/api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { useTranslations } from "next-intl";
import { useWorkspace } from "@/contexts/workspace-context";
import { canEdit } from "@/lib/permissions";

type AlertWithEndpoint = AlertResponse & {
  endpointUrl: string;
};

export function AlertsPage() {
  const [showNewAlertForm, setShowNewAlertForm] = useState(false);
  const isDarkMode = useDarkMode();
  const t = useTranslations("alerts");
  const { currentWorkspace, isLoading: isWorkspaceLoading, myRole } = useWorkspace();
  const [alerts, setAlerts] = useState<AlertWithEndpoint[]>([]);
  const [deliveriesByAlertId, setDeliveriesByAlertId] = useState<Record<number, AlertDeliveryResponse[]>>({});
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [endpoints, setEndpoints] = useState<EndpointResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New alert form state
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>("");
  const [newAlertType, setNewAlertType] = useState<AlertType>("EMAIL");
  const [newTarget, setNewTarget] = useState("");
  const [newThreshold, setNewThreshold] = useState("3");
  const [isCreating, setIsCreating] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<number | null>(null);
  const [editAlertType, setEditAlertType] = useState<AlertType>("EMAIL");
  const [editTarget, setEditTarget] = useState("");
  const [editThreshold, setEditThreshold] = useState("3");
  const [isUpdating, setIsUpdating] = useState(false);
  const [testingAlertId, setTestingAlertId] = useState<number | null>(null);
  const canManageAlerts = canEdit(myRole);

  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      setIsLoading(true);
      const projectList = await projectsApi.getProjects(currentWorkspace.id);
      setProjects(projectList);

      const endpointResults = await Promise.allSettled(
        projectList.map((project) => endpointsApi.getEndpoints(project.id)),
      );

      const allEndpoints = endpointResults
        .filter(
          (result): result is PromiseFulfilledResult<EndpointResponse[]> =>
            result.status === "fulfilled",
        )
        .flatMap((result) => result.value);

      const alertResults = await Promise.allSettled(
        allEndpoints.map(async (endpoint) => {
          const endpointAlerts = await alertsApi.getAlerts(endpoint.id);
          return endpointAlerts.map((alert) => ({
            ...alert,
            endpointUrl: endpoint.url,
          }));
        }),
      );

      const allAlerts = alertResults
        .filter(
          (result): result is PromiseFulfilledResult<AlertWithEndpoint[]> =>
            result.status === "fulfilled",
        )
        .flatMap((result) => result.value);

      const deliveryResults = await Promise.allSettled(
        allAlerts.map(async (alert) => ({
          alertId: alert.id,
          deliveries: await alertsApi.getAlertDeliveries(alert.id, 3),
        })),
      );

      const deliveries = deliveryResults
        .filter(
          (result): result is PromiseFulfilledResult<{ alertId: number; deliveries: AlertDeliveryResponse[] }> =>
            result.status === "fulfilled",
        )
        .reduce<Record<number, AlertDeliveryResponse[]>>((acc, result) => {
          acc[result.value.alertId] = result.value.deliveries;
          return acc;
        }, {});

      setEndpoints(allEndpoints);
      setAlerts(allAlerts);
      setDeliveriesByAlertId(deliveries);
      setError(null);
    } catch {
      setError(t('errors.loadSettings'));
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, t]);

  useEffect(() => {
    if (isWorkspaceLoading) {
      return;
    }

    if (!currentWorkspace) {
      setAlerts([]);
      setProjects([]);
      setEndpoints([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    void fetchData();
  }, [currentWorkspace, fetchData, isWorkspaceLoading]);

  // Filter endpoints by selected project
  const filteredEndpoints = selectedProjectId
    ? endpoints.filter((ep) => ep.projectId === Number(selectedProjectId))
    : [];

  const handleCreate = async () => {
    if (!selectedEndpointId) {
      toast.error(t('errors.selectEndpoint'));
      return;
    }
    if (!newTarget.trim()) {
      toast.error(t('errors.enterTarget'));
      return;
    }

    setIsCreating(true);
    try {
      await alertsApi.createAlert(Number(selectedEndpointId), {
        alertType: newAlertType,
        target: newTarget,
        threshold: Number(newThreshold) || 3,
      });
      toast.success(t('toasts.created'));
      setShowNewAlertForm(false);
      setNewTarget("");
      setNewThreshold("3");
      setSelectedProjectId("");
      setSelectedEndpointId("");
      await fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.createFailed')));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (alertId: number) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await alertsApi.deleteAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success(t('toasts.deleted'));
    } catch {
      toast.error(t('errors.deleteFailed'));
    }
  };

  const handleToggle = async (alertId: number) => {
    try {
      const updated = await alertsApi.toggleAlert(alertId);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, ...updated } : a)));
      toast.success(updated.isActive ? t('toasts.enabled') : t('toasts.disabled'));
    } catch {
      toast.error(t('errors.toggleFailed'));
    }
  };

  const handleStartEdit = (alert: AlertWithEndpoint) => {
    setEditingAlertId(alert.id);
    setEditAlertType(alert.alertType);
    setEditTarget(alert.target);
    setEditThreshold(String(alert.threshold));
  };

  const handleUpdate = async () => {
    if (!editingAlertId) return;
    if (!editTarget.trim()) {
      toast.error(t('errors.enterTarget'));
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await alertsApi.updateAlert(editingAlertId, {
        alertType: editAlertType,
        target: editTarget.trim(),
        threshold: Number(editThreshold) || 3,
      });
      setAlerts((prev) => prev.map((alert) => (alert.id === updated.id ? { ...alert, ...updated } : alert)));
      setEditingAlertId(null);
      toast.success(t('toasts.updated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.updateFailed')));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestAlert = async (alertId: number) => {
    setTestingAlertId(alertId);
    try {
      const delivery = await alertsApi.sendTestAlert(alertId);
      setDeliveriesByAlertId((prev) => ({
        ...prev,
        [alertId]: [delivery, ...(prev[alertId] ?? [])].slice(0, 3),
      }));
      if (delivery.status === 'SUCCESS') {
        toast.success(t('toasts.testSent'));
      } else {
        toast.error(delivery.errorMessage || t('errors.testFailed'));
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.testFailed')));
    } finally {
      setTestingAlertId(null);
    }
  };

  const alertTypeLabel = (type: AlertType) => {
    if (type === 'EMAIL') return t('form.typeEmail');
    if (type === 'SLACK') return t('form.typeSlack');
    return t('form.typeWebhook');
  };

  const AlertIcon = ({ type }: { type: AlertType }) => {
    if (type === 'EMAIL') return <Mail className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />;
    if (type === 'WEBHOOK') return <Webhook className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />;
    return <MessageSquare className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{error}</p>
          <Button onClick={fetchData} variant="outline">{t('retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('title')}</h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('subtitle')}</p>
        </div>
        {canManageAlerts && (
          <Button className="gap-2" onClick={() => setShowNewAlertForm(!showNewAlertForm)}>
            {showNewAlertForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showNewAlertForm ? t('cancel') : t('newAlert')}
          </Button>
        )}
      </div>

      {/* New Alert Form */}
      <AnimatePresence mode="wait">
        {showNewAlertForm && canManageAlerts && (
          <motion.div
            key="alert-form"
            initial={{ opacity: 0, y: -20, scale: 0.95, height: 0 }}
            animate={{ opacity: 1, y: 0, scale: 1, height: "auto" }}
            exit={{ opacity: 0, y: -20, scale: 0.95, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
              <CardHeader>
                <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>{t('form.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={isDarkMode ? 'text-gray-300' : ''}>{t('form.project')}</Label>
                    <Select value={selectedProjectId} onValueChange={(v) => { setSelectedProjectId(v); setSelectedEndpointId(""); }}>
                      <SelectTrigger
                        aria-label={t('form.project')}
                        className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
                      >
                        <SelectValue placeholder={t('form.selectProject')} />
                      </SelectTrigger>
                      <SelectContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)} className={isDarkMode ? 'text-white hover:bg-gray-700' : ''}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className={isDarkMode ? 'text-gray-300' : ''}>{t('form.endpoint')}</Label>
                    <Select value={selectedEndpointId} onValueChange={setSelectedEndpointId} disabled={!selectedProjectId}>
                      <SelectTrigger
                        aria-label={t('form.endpoint')}
                        className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
                      >
                        <SelectValue placeholder={t('form.selectEndpoint')} />
                      </SelectTrigger>
                      <SelectContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                        {filteredEndpoints.map((ep) => (
                          <SelectItem key={ep.id} value={String(ep.id)} className={isDarkMode ? 'text-white hover:bg-gray-700' : ''}>
                            {ep.httpMethod} {ep.url}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={isDarkMode ? 'text-gray-300' : ''}>{t('form.alertType')}</Label>
                    <Select value={newAlertType} onValueChange={(v) => setNewAlertType(v as AlertType)}>
                      <SelectTrigger
                        aria-label={t('form.alertType')}
                        className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
                      >
                        <SelectValue placeholder={t('form.selectType')} />
                      </SelectTrigger>
                      <SelectContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                        <SelectItem value="EMAIL" className={isDarkMode ? 'text-white hover:bg-gray-700' : ''}>{t('form.typeEmail')}</SelectItem>
                        <SelectItem value="SLACK" className={isDarkMode ? 'text-white hover:bg-gray-700' : ''}>{t('form.typeSlack')}</SelectItem>
                        <SelectItem value="WEBHOOK" className={isDarkMode ? 'text-white hover:bg-gray-700' : ''}>{t('form.typeWebhook')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className={isDarkMode ? 'text-gray-300' : ''}>{t('form.failureThreshold')}</Label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={newThreshold}
                      onChange={(e) => setNewThreshold(e.target.value)}
                      className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : ''}
                    />
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t('form.failureHelp')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={isDarkMode ? 'text-gray-300' : ''}>{t('form.target')}</Label>
                  <Input
                    placeholder={t('form.targetPlaceholder')}
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : ''}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('form.create')}
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewAlertForm(false)} className={
                    isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : ''
                  }>
                    {t('cancel')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Configs List */}
      <motion.div 
        className="space-y-4"
        layout
        transition={{ layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
      >
        {alerts.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('empty')}</p>
          </div>
        ) : (
          alerts.map((config, index) => (
            <motion.div
              key={config.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.3, delay: index * 0.05 },
                y: { duration: 0.3, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }
              }}
            >
              <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100'
                      }`}>
                        <AlertIcon type={config.alertType} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            {t('alertTitle', {type: alertTypeLabel(config.alertType)})}
                          </h3>
                          <Badge variant={config.isActive ? 'default' : 'secondary'} className={
                            config.isActive 
                              ? 'bg-black text-white'
                              : isDarkMode ? 'bg-gray-800 text-gray-300' : ''
                          }>
                            {config.isActive ? t('enabled') : t('disabled')}
                          </Badge>
                        </div>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {t('failureAfter', {count: config.threshold})}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-xs ${
                            isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : ''
                          }`}>
                            {config.alertType}
                          </Badge>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{config.target}</span>
                          {config.endpointUrl && (
                            <Badge variant="outline" className={`text-xs ${isDarkMode ? 'border-gray-700 text-gray-400' : ''}`}>
                              {config.endpointUrl}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {canManageAlerts && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={t('testAlert')}
                          onClick={() => handleTestAlert(config.id)}
                          disabled={testingAlertId === config.id}
                          className={isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : ''}
                        >
                          {testingAlertId === config.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={t('editAlert')}
                          onClick={() => handleStartEdit(config)}
                          className={isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : ''}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={config.isActive}
                          onCheckedChange={() => handleToggle(config.id)}
                        />
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(config.id)} className={
                          isDarkMode ? 'hover:bg-gray-800' : ''
                        }>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingAlertId === config.id && (
                    <div className={`mt-4 rounded-lg border p-4 ${isDarkMode ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[160px_1fr_120px_auto]">
                        <Select value={editAlertType} onValueChange={(value) => setEditAlertType(value as AlertType)}>
                          <SelectTrigger
                            aria-label={t('form.alertType')}
                            className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                            <SelectItem value="EMAIL">{t('form.typeEmail')}</SelectItem>
                            <SelectItem value="SLACK">{t('form.typeSlack')}</SelectItem>
                            <SelectItem value="WEBHOOK">{t('form.typeWebhook')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={editTarget}
                          onChange={(event) => setEditTarget(event.target.value)}
                          placeholder={t('form.targetPlaceholder')}
                          className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : ''}
                        />
                        <Input
                          type="number"
                          min={1}
                          value={editThreshold}
                          onChange={(event) => setEditThreshold(event.target.value)}
                          className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : ''}
                        />
                        <div className="flex gap-2">
                          <Button type="button" onClick={handleUpdate} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('save')}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setEditingAlertId(null)}>
                            {t('cancel')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {(deliveriesByAlertId[config.id]?.length ?? 0) > 0 && (
                    <div className={`mt-4 rounded-lg border p-3 ${isDarkMode ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'}`}>
                      <p className={`mb-2 text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('deliveries.title')}
                      </p>
                      <div className="space-y-2">
                        {deliveriesByAlertId[config.id].map((delivery) => (
                          <div key={delivery.id} className="flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={delivery.status === 'SUCCESS' ? 'outline' : 'destructive'}
                                className={delivery.status === 'SUCCESS' ? 'border-green-500 text-green-600' : ''}
                              >
                                {t(`deliveries.status.${delivery.status}`)}
                              </Badge>
                              {delivery.testDelivery && (
                                <Badge variant="secondary">{t('deliveries.test')}</Badge>
                              )}
                              {delivery.errorMessage && (
                                <span className="max-w-[260px] truncate text-red-500" title={delivery.errorMessage}>
                                  {delivery.errorMessage}
                                </span>
                              )}
                            </div>
                            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                              {new Date(delivery.triggeredAt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
