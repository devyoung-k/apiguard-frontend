"use client"

import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import * as endpointsApi from "@/lib/api/endpoints";
import type { HttpMethod, EndpointResponse } from "@/types/api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { useTranslations } from "next-intl";

interface EndpointFormPageProps {
  isEdit?: boolean;
}

export function EndpointFormPage({ isEdit = false }: EndpointFormPageProps) {
  const router = useRouter();
  const params = useParams();
  const isDarkMode = useDarkMode();
  const t = useTranslations("endpointForm");

  // Form state
  const [url, setUrl] = useState("");
  const [httpMethod, setHttpMethod] = useState<HttpMethod>("GET");
  const [expectedStatusCode, setExpectedStatusCode] = useState("200");
  const [checkInterval, setCheckInterval] = useState("60");
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEndpoint, setIsLoadingEndpoint] = useState(false);

  const projectId = Number(params.id);
  const endpointId = params.endpointId ? Number(params.endpointId) : undefined;

  // Load existing endpoint data in edit mode
  const loadEndpoint = useCallback(async () => {
    if (!isEdit || !endpointId) return;
    setIsLoadingEndpoint(true);
    try {
      const ep: EndpointResponse = await endpointsApi.getEndpoint(endpointId);
      setUrl(ep.url);
      setHttpMethod(ep.httpMethod);
      setExpectedStatusCode(String(ep.expectedStatusCode));
      setCheckInterval(String(ep.checkInterval));
      setBody(ep.body || "");

      // Parse headers object
      if (ep.headers) {
        try {
          const parsed = typeof ep.headers === 'string' ? JSON.parse(ep.headers) : ep.headers;
          const headerEntries = Object.entries(parsed).map(([k, v]) => ({ key: k, value: String(v) }));
          setHeaders(headerEntries.length > 0 ? headerEntries : [{ key: '', value: '' }]);
        } catch {
          setHeaders([{ key: '', value: '' }]);
        }
      }
    } catch {
      toast.error(t('errors.loadEndpoint'));
    } finally {
      setIsLoadingEndpoint(false);
    }
  }, [endpointId, isEdit, t]);

  useEffect(() => {
    loadEndpoint();
  }, [loadEndpoint]);

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...headers];
    updated[index][field] = val;
    setHeaders(updated);
  };

  const handleBack = () => {
    if (isEdit && endpointId) {
      router.push(`/projects/${projectId}/endpoints/${endpointId}`);
    } else {
      router.push(`/projects/${projectId}`);
    }
  };

  const handleSubmit = async () => {
    if (!url.trim()) {
      toast.error(t('errors.enterUrl'));
      return;
    }

    // headers is now expected to be stringified JSON by backend
    const validHeaders = headers.filter((h) => h.key.trim());
    const headersStr = validHeaders.length > 0
      ? JSON.stringify(Object.fromEntries(validHeaders.map((h) => [h.key, h.value])))
      : null;

    const payload = {
      url,
      httpMethod,
      headers: headersStr,
      body: body.trim() || null,
      expectedStatusCode: Number(expectedStatusCode) || 200,
      checkInterval: Number(checkInterval) || 60,
    };

    setIsSubmitting(true);
    try {
      if (isEdit && endpointId) {
        await endpointsApi.updateEndpoint(endpointId, payload);
        toast.success(t('toasts.updated'));
        router.push(`/projects/${projectId}/endpoints/${endpointId}`);
      } else {
        const created = await endpointsApi.createEndpoint(projectId, payload);
        toast.success(t('toasts.created'));
        router.push(`/projects/${projectId}/endpoints/${created.id}`);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, isEdit ? t('errors.updateFailed') : t('errors.createFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingEndpoint) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const inputStyles = isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : '';
  const labelStyles = isDarkMode ? 'text-gray-300' : '';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className={isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900'}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('actions.back')}
        </Button>
      </div>

      <div>
        <h1 className={`text-3xl mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{isEdit ? t('titles.edit') : t('titles.new')}</h1>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('subtitle')}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>{t('sections.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url" className={labelStyles}>{t('fields.url')}</Label>
              <Input
                id="url"
                placeholder={t('placeholders.url')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={inputStyles}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method" className={labelStyles}>{t('fields.httpMethod')}</Label>
                <Select value={httpMethod} onValueChange={(v) => setHttpMethod(v as HttpMethod)}>
                  <SelectTrigger id="method" className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}>
                    <SelectValue placeholder={t('placeholders.selectMethod')} />
                  </SelectTrigger>
                  <SelectContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                    {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
                      <SelectItem key={m} value={m} className={isDarkMode ? 'text-white hover:bg-gray-700' : ''}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected-status" className={labelStyles}>{t('fields.expectedStatusCode')}</Label>
                <Input
                  id="expected-status"
                  placeholder={t('placeholders.expectedStatusCode')}
                  value={expectedStatusCode}
                  onChange={(e) => setExpectedStatusCode(e.target.value)}
                  className={inputStyles}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>{t('sections.headers')}</CardTitle>
              <Button variant="outline" size="sm" onClick={addHeader} className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : ''}>
                <Plus className="h-4 w-4 mr-2" />
                {t('actions.addHeader')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {headers.map((header, index) => (
              <div key={index} className="flex gap-3">
                <Input
                  placeholder={t('placeholders.headerName')}
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  className={`flex-1 ${inputStyles}`}
                />
                <Input
                  placeholder={t('placeholders.headerValue')}
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  className={`flex-1 ${inputStyles}`}
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeHeader(index)}
                  disabled={headers.length === 1}
                  className={isDarkMode ? 'hover:bg-gray-800' : ''}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>{t('sections.requestBody')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder='{"key": "value"}' 
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={`font-mono text-sm ${inputStyles}`}
            />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className={isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300 shadow-sm'}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>{t('sections.monitoringSettings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interval" className={labelStyles}>{t('fields.checkIntervalSeconds')}</Label>
              <Input
                id="interval"
                type="number"
                placeholder={t('placeholders.checkInterval')}
                value={checkInterval}
                onChange={(e) => setCheckInterval(e.target.value)}
                className={inputStyles}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? t('actions.updateEndpoint') : t('actions.createEndpoint')}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleBack}
          className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : ''}
        >
          {t('actions.cancel')}
        </Button>
      </div>
    </div>
  );
}
