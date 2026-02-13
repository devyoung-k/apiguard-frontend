"use client"

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Mail, MessageSquare, Trash2, X, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import * as alertsApi from "@/lib/api/alerts";
import * as projectsApi from "@/lib/api/projects";
import * as endpointsApi from "@/lib/api/endpoints";
import type { AlertResponse, AlertType, EndpointResponse, ProjectResponse } from "@/types/api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import { useDarkMode } from "@/hooks/use-dark-mode";

interface AlertWithEndpoint extends AlertResponse {
  endpointUrl?: string;
}

export function AlertsPage() {
  const [showNewAlertForm, setShowNewAlertForm] = useState(false);
  const isDarkMode = useDarkMode();
  const [alerts, setAlerts] = useState<AlertWithEndpoint[]>([]);
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

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const projectList = await projectsApi.getProjects();
      setProjects(projectList);

      // 모든 프로젝트의 엔드포인트 가져오기
      const allEndpoints: EndpointResponse[] = [];
      const allAlerts: AlertWithEndpoint[] = [];

      for (const project of projectList) {
        const eps = await endpointsApi.getEndpoints(project.id);
        allEndpoints.push(...eps);
        for (const ep of eps) {
          const epAlerts = await alertsApi.getAlerts(ep.id);
          allAlerts.push(...epAlerts.map(a => ({ ...a, endpointUrl: ep.url })));
        }
      }

      setEndpoints(allEndpoints);
      setAlerts(allAlerts);
      setError(null);
    } catch {
      setError('알림 설정을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 프로젝트 선택 시 해당 엔드포인트 필터링
  const filteredEndpoints = selectedProjectId
    ? endpoints.filter((ep) => ep.projectId === Number(selectedProjectId))
    : [];

  const handleCreate = async () => {
    if (!selectedEndpointId) {
      toast.error('엔드포인트를 선택해 주세요.');
      return;
    }
    if (!newTarget.trim()) {
      toast.error('대상을 입력해 주세요.');
      return;
    }

    setIsCreating(true);
    try {
      await alertsApi.createAlert(Number(selectedEndpointId), {
        alertType: newAlertType,
        target: newTarget,
        threshold: Number(newThreshold) || 3,
      });
      toast.success('알림이 생성되었습니다.');
      setShowNewAlertForm(false);
      setNewTarget("");
      setNewThreshold("3");
      setSelectedProjectId("");
      setSelectedEndpointId("");
      await fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, '알림 생성에 실패했습니다.'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (alertId: number) => {
    if (!confirm('이 알림을 삭제하시겠습니까?')) return;
    try {
      await alertsApi.deleteAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success('알림이 삭제되었습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleToggle = async (alertId: number) => {
    try {
      const updated = await alertsApi.toggleAlert(alertId);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, ...updated } : a)));
      toast.success(`알림이 ${updated.isActive ? '활성화' : '비활성화'}되었습니다.`);
    } catch {
      toast.error('상태 변경에 실패했습니다.');
    }
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
          <Button onClick={fetchData} variant="outline">다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Alert Configuration</h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Manage notification settings for your endpoints</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewAlertForm(!showNewAlertForm)}>
          {showNewAlertForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showNewAlertForm ? 'Cancel' : 'New Alert'}
        </Button>
      </div>

      {/* New Alert Form */}
      <AnimatePresence mode="wait">
        {showNewAlertForm && (
          <motion.div
            key="alert-form"
            initial={{ opacity: 0, y: -20, scale: 0.95, height: 0 }}
            animate={{ opacity: 1, y: 0, scale: 1, height: "auto" }}
            exit={{ opacity: 0, y: -20, scale: 0.95, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
              <CardHeader>
                <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>Create New Alert</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={isDarkMode ? 'text-gray-300' : ''}>프로젝트</Label>
                    <Select value={selectedProjectId} onValueChange={(v) => { setSelectedProjectId(v); setSelectedEndpointId(""); }}>
                      <SelectTrigger className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}>
                        <SelectValue placeholder="프로젝트 선택" />
                      </SelectTrigger>
                      <SelectContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)} className={isDarkMode ? 'text-white hover:bg-gray-700' : ''}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className={isDarkMode ? 'text-gray-300' : ''}>엔드포인트</Label>
                    <Select value={selectedEndpointId} onValueChange={setSelectedEndpointId} disabled={!selectedProjectId}>
                      <SelectTrigger className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}>
                        <SelectValue placeholder="엔드포인트 선택" />
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
                    <Label className={isDarkMode ? 'text-gray-300' : ''}>Alert Type</Label>
                    <Select value={newAlertType} onValueChange={(v) => setNewAlertType(v as AlertType)}>
                      <SelectTrigger className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                        <SelectItem value="EMAIL" className={isDarkMode ? 'text-white hover:bg-gray-700' : ''}>Email</SelectItem>
                        <SelectItem value="SLACK" className={isDarkMode ? 'text-white hover:bg-gray-700' : ''}>Slack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className={isDarkMode ? 'text-gray-300' : ''}>Failure Threshold</Label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={newThreshold}
                      onChange={(e) => setNewThreshold(e.target.value)}
                      className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : ''}
                    />
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Alert after N consecutive failures</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={isDarkMode ? 'text-gray-300' : ''}>Target (Email or Slack Channel)</Label>
                  <Input
                    placeholder="admin@example.com or #channel-name"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : ''}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Alert
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewAlertForm(false)} className={
                    isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : ''
                  }>
                    Cancel
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
            <p>알림 설정이 없습니다. 새 알림을 추가해 보세요.</p>
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
                        {config.alertType === 'EMAIL' ? (
                          <Mail className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        ) : (
                          <MessageSquare className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            {config.alertType} Alert
                          </h3>
                          <Badge variant={config.isActive ? 'default' : 'secondary'} className={
                            config.isActive 
                              ? 'bg-black text-white'
                              : isDarkMode ? 'bg-gray-800 text-gray-300' : ''
                          }>
                            {config.isActive ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Alert after {config.threshold} consecutive failures
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
                    <div className="flex items-center gap-2">
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
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}