"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  FileJson,
  GitCompareArrows,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { useWorkspace } from "@/contexts/workspace-context";
import { canEdit } from "@/lib/permissions";
import { getApiErrorMessage } from "@/lib/utils";
import * as projectsApi from "@/lib/api/projects";
import * as specsApi from "@/lib/api/specs";
import type {
  ApiSpecDiffDetailResponse,
  ApiSpecDiffResponse,
  ApiSpecSourceResponse,
  BreakingChangeRule,
  ProjectResponse,
} from "@/types/api";

export function ApiSpecChangesPage() {
  const t = useTranslations("specChanges");
  const isDarkMode = useDarkMode();
  const { currentWorkspace, isLoading: isWorkspaceLoading, myRole } = useWorkspace();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [sources, setSources] = useState<ApiSpecSourceResponse[]>([]);
  const [diffs, setDiffs] = useState<ApiSpecDiffResponse[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [selectedDiff, setSelectedDiff] =
    useState<ApiSpecDiffDetailResponse | null>(null);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canManageSpecs = canEdit(myRole);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === selectedProjectId),
    [projects, selectedProjectId],
  );

  const selectedSource = useMemo(
    () => sources.find((source) => String(source.id) === selectedSourceId),
    [sources, selectedSourceId],
  );

  const fetchProjects = useCallback(async () => {
    if (!currentWorkspace) {
      setProjects([]);
      setSelectedProjectId("");
      return;
    }

    const projectList = await projectsApi.getProjects(currentWorkspace.id);
    setProjects(projectList);
    setSelectedProjectId((prev) => {
      if (prev && projectList.some((project) => String(project.id) === prev)) {
        return prev;
      }
      return projectList[0] ? String(projectList[0].id) : "";
    });
  }, [currentWorkspace]);

  const fetchSources = useCallback(async (projectId: string) => {
    if (!projectId) {
      setSources([]);
      setSelectedSourceId("");
      return;
    }

    const sourceList = await specsApi.getSpecSources(Number(projectId));
    setSources(sourceList);
    setSelectedSourceId((prev) => {
      if (prev && sourceList.some((source) => String(source.id) === prev)) {
        return prev;
      }
      return sourceList[0] ? String(sourceList[0].id) : "";
    });
  }, []);

  const fetchDiffs = useCallback(async (sourceId: string) => {
    if (!sourceId) {
      setDiffs([]);
      setSelectedDiff(null);
      return;
    }

    const diffList = await specsApi.getSpecDiffs(Number(sourceId));
    setDiffs(diffList);

    if (diffList[0]) {
      const detail = await specsApi.getSpecDiff(diffList[0].id);
      setSelectedDiff(detail);
    } else {
      setSelectedDiff(null);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      await fetchProjects();
      setError(null);
    } catch {
      setError(t("errors.load"));
    } finally {
      setIsLoading(false);
    }
  }, [fetchProjects, t]);

  useEffect(() => {
    if (isWorkspaceLoading) {
      return;
    }

    if (!currentWorkspace) {
      setProjects([]);
      setSources([]);
      setDiffs([]);
      setSelectedDiff(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    void fetchData();
  }, [currentWorkspace, fetchData, isWorkspaceLoading]);

  useEffect(() => {
    if (!selectedProjectId) {
      setSources([]);
      setSelectedSourceId("");
      return;
    }

    void fetchSources(selectedProjectId).catch(() => {
      setError(t("errors.load"));
    });
  }, [fetchSources, selectedProjectId, t]);

  useEffect(() => {
    if (!selectedSourceId) {
      setDiffs([]);
      setSelectedDiff(null);
      return;
    }

    void fetchDiffs(selectedSourceId).catch(() => {
      setError(t("errors.load"));
    });
  }, [fetchDiffs, selectedSourceId, t]);

  const handleCreateSource = async () => {
    if (!selectedProjectId) {
      toast.error(t("errors.selectProject"));
      return;
    }
    if (!newSourceName.trim() || !newSourceUrl.trim()) {
      toast.error(t("errors.fillSource"));
      return;
    }

    setIsCreating(true);
    try {
      const created = await specsApi.createSpecSource(Number(selectedProjectId), {
        name: newSourceName.trim(),
        specUrl: newSourceUrl.trim(),
      });
      setNewSourceName("");
      setNewSourceUrl("");
      await fetchSources(selectedProjectId);
      setSelectedSourceId(String(created.id));
      toast.success(t("toasts.created"));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("errors.create")));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCheckSource = async () => {
    if (!selectedSourceId) {
      toast.error(t("errors.selectSource"));
      return;
    }

    setIsChecking(true);
    try {
      const detail = await specsApi.checkSpecSource(Number(selectedSourceId));
      setSelectedDiff(detail);
      await fetchDiffs(selectedSourceId);
      toast.success(t("toasts.checked"));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("errors.check")));
    } finally {
      setIsChecking(false);
    }
  };

  const handleSelectDiff = async (diffId: number) => {
    const detail = await specsApi.getSpecDiff(diffId);
    setSelectedDiff(detail);
  };

  const formatDate = (value: string | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  const ruleLabel = (rule: BreakingChangeRule) => t(`rules.${rule}`);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{error}</p>
          <Button onClick={fetchData} variant="outline">
            {t("retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className={`mb-2 text-3xl ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {t("title")}
          </h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            {t("subtitle")}
          </p>
        </div>
        <Button
          className="w-full gap-2 lg:w-auto"
          disabled={!selectedSourceId || isChecking}
          onClick={handleCheckSource}
        >
          {isChecking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {t("runCheck")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card className={isDarkMode ? "border-gray-800 bg-gray-900" : "border-gray-300 bg-white shadow-sm"}>
            <CardHeader>
              <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                {t("source.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className={isDarkMode ? "text-gray-300" : ""}>
                  {t("source.project")}
                </Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className={isDarkMode ? "border-gray-700 bg-gray-800 text-white" : ""}>
                    <SelectValue placeholder={t("source.selectProject")} />
                  </SelectTrigger>
                  <SelectContent className={isDarkMode ? "border-gray-700 bg-gray-800" : ""}>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={isDarkMode ? "text-gray-300" : ""}>
                  {t("source.specSource")}
                </Label>
                <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                  <SelectTrigger className={isDarkMode ? "border-gray-700 bg-gray-800 text-white" : ""}>
                    <SelectValue placeholder={t("source.selectSource")} />
                  </SelectTrigger>
                  <SelectContent className={isDarkMode ? "border-gray-700 bg-gray-800" : ""}>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={String(source.id)}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSource && (
                <div className={`rounded-lg border p-3 text-sm ${isDarkMode ? "border-gray-800 bg-gray-950 text-gray-300" : "border-gray-200 bg-gray-50 text-gray-700"}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{selectedSource.name}</span>
                  </div>
                  <p className="break-all text-xs">{selectedSource.specUrl}</p>
                  <p className="mt-2 text-xs">
                    {t("source.lastChecked")}: {formatDate(selectedSource.lastCheckedAt)}
                  </p>
                </div>
              )}

              {projects.length === 0 && (
                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                  {t("empty.noProjects")}
                </p>
              )}
              {projects.length > 0 && sources.length === 0 && (
                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                  {t("empty.noSources")}
                </p>
              )}
            </CardContent>
          </Card>

          {canManageSpecs && (
            <Card className={isDarkMode ? "border-gray-800 bg-gray-900" : "border-gray-300 bg-white shadow-sm"}>
              <CardHeader>
                <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                  {t("create.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className={isDarkMode ? "text-gray-300" : ""}>
                    {t("create.name")}
                  </Label>
                  <Input
                    value={newSourceName}
                    onChange={(event) => setNewSourceName(event.target.value)}
                    placeholder={t("create.namePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={isDarkMode ? "text-gray-300" : ""}>
                    {t("create.url")}
                  </Label>
                  <Input
                    value={newSourceUrl}
                    onChange={(event) => setNewSourceUrl(event.target.value)}
                    placeholder="https://api.example.com/openapi.json"
                  />
                </div>
                <Button
                  className="w-full gap-2"
                  disabled={isCreating || !selectedProjectId}
                  onClick={handleCreateSource}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {t("create.submit")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[360px_1fr]">
          <Card className={isDarkMode ? "border-gray-800 bg-gray-900" : "border-gray-300 bg-white shadow-sm"}>
            <CardHeader>
              <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                {t("diffs.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {diffs.length === 0 ? (
                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                  {t("empty.noDiffs")}
                </p>
              ) : (
                <div className="space-y-2">
                  {diffs.map((diff) => (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => void handleSelectDiff(diff.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedDiff?.id === diff.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                          : isDarkMode
                            ? "border-gray-800 bg-gray-950 hover:bg-gray-800"
                            : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <Badge variant={diff.breaking ? "destructive" : "outline"}>
                          {diff.breaking ? t("breaking") : t("compatible")}
                        </Badge>
                        <span className={isDarkMode ? "text-xs text-gray-400" : "text-xs text-gray-600"}>
                          {formatDate(diff.checkedAt)}
                        </span>
                      </div>
                      <p className={isDarkMode ? "text-sm text-gray-300" : "text-sm text-gray-700"}>
                        {diff.summary}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={isDarkMode ? "border-gray-800 bg-gray-900" : "border-gray-300 bg-white shadow-sm"}>
            <CardHeader>
              <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                {selectedProject ? selectedProject.name : t("detail.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDiff ? (
                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                  {t("empty.selectDiff")}
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={selectedDiff.breaking ? "destructive" : "outline"}>
                      {selectedDiff.breaking ? t("breaking") : t("compatible")}
                    </Badge>
                    <Badge variant="outline">
                      {t("detail.changeCount", {
                        count: selectedDiff.breakingChangeCount,
                      })}
                    </Badge>
                    <span className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                      {formatDate(selectedDiff.checkedAt)}
                    </span>
                  </div>

                  <div className={`rounded-lg border p-4 ${isDarkMode ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-gray-50"}`}>
                    <div className="flex items-center gap-2">
                      <GitCompareArrows className="h-4 w-4 text-blue-500" />
                      <p className={isDarkMode ? "text-sm text-gray-300" : "text-sm text-gray-700"}>
                        {selectedDiff.summary}
                      </p>
                    </div>
                  </div>

                  {selectedDiff.changes.length === 0 ? (
                    <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                      {t("empty.noChanges")}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDiff.changes.map((change, index) => (
                        <div
                          key={`${change.rule}-${change.location}-${index}`}
                          className={`rounded-lg border p-4 ${isDarkMode ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-white"}`}
                        >
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant="destructive">{ruleLabel(change.rule)}</Badge>
                            <span className={isDarkMode ? "break-all text-sm text-gray-300" : "break-all text-sm text-gray-700"}>
                              {change.location}
                            </span>
                          </div>
                          <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                            {change.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
