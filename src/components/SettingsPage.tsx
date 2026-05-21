"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import * as usersApi from "@/lib/api/users";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useWorkspace } from "@/contexts/workspace-context";
import { canManageWorkspace } from "@/lib/permissions";

type Language = "en" | "ko";

export function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { currentWorkspace, myRole, deleteWorkspace } = useWorkspace();
  const isDarkMode = useDarkMode();
  const t = useTranslations("settings");
  const locale = useLocale() as Language;
  const pathname = usePathname();
  const router = useRouter();

  // Nickname update
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account deletion
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [language, setLanguage] = useState<Language>(locale);
  const canDeleteWorkspace = canManageWorkspace(myRole);

  useEffect(() => {
    setLanguage(locale);
  }, [locale]);

  useEffect(() => {
    setNickname(user?.nickname ?? "");
  }, [user?.nickname]);

  const handleUpdateNickname = async () => {
    if (!nickname.trim()) {
      toast.error(t("toasts.enterNickname"));
      return;
    }
    setIsSavingNickname(true);
    try {
      await usersApi.updateMe({ nickname: nickname.trim() });
      await refreshUser();
      toast.success(t("toasts.nicknameUpdated"));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toasts.nicknameUpdateFailed")));
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      toast.error(t("toasts.fillAllFields"));
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast.error(t("toasts.passwordsNotMatch"));
      return;
    }
    setIsChangingPassword(true);
    try {
      await usersApi.changePassword({
        currentPassword,
        newPassword,
        newPasswordConfirm,
      });
      toast.success(t("toasts.passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toasts.passwordUpdateFailed")));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await usersApi.deleteMe();
      toast.success(t("toasts.accountDeleted"));
      await logout();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toasts.deleteAccountFailed")));
      setIsDeleting(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return;

    setIsDeletingWorkspace(true);
    try {
      await deleteWorkspace(currentWorkspace.id);
      toast.success(t("toasts.workspaceDeleted"));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("toasts.deleteWorkspaceFailed")));
    } finally {
      setIsDeletingWorkspace(false);
    }
  };

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
    router.replace(pathname, { locale: value });
    toast.success(t("toasts.languageSaved"));
  };

  const cardClass = isDarkMode
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-300 shadow-sm";
  const labelClass = isDarkMode ? "text-gray-300" : "";
  const inputClass = isDarkMode
    ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
    : "";
  const disabledInputClass = isDarkMode
    ? "bg-gray-800 border-gray-700 text-gray-400"
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          {t("title")}
        </h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          {t("description")}
        </p>
      </div>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
              {t("profile.title")}
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : ""}>
              {t("profile.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className={labelClass}>{t("profile.email")}</Label>
              <Input
                value={user?.email ?? ""}
                disabled
                className={isDarkMode ? "bg-gray-800 border-gray-700 text-gray-400" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>{t("profile.nickname")}</Label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t("profile.nicknamePlaceholder")}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>{t("profile.joined")}</Label>
              <Input
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString(language === "ko" ? "ko-KR" : "en-US") : ""}
                disabled
                className={isDarkMode ? "bg-gray-800 border-gray-700 text-gray-400" : ""}
              />
            </div>
            <Button onClick={handleUpdateNickname} disabled={isSavingNickname}>
              {isSavingNickname && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("profile.save")}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Language */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
              {t("language.title")}
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : ""}>
              {t("language.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label className={labelClass}>{t("language.displayLanguage")}</Label>
            <Select value={language} onValueChange={(value) => handleLanguageChange(value as Language)}>
              <SelectTrigger className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}>
                <SelectValue placeholder={t("language.selectLanguage")} />
              </SelectTrigger>
              <SelectContent className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                <SelectItem value="en" className={isDarkMode ? "text-white hover:bg-gray-700" : ""}>{t("language.english")}</SelectItem>
                <SelectItem value="ko" className={isDarkMode ? "text-white hover:bg-gray-700" : ""}>{t("language.korean")}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </motion.div>

      {/* Workspace */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
              {t("workspace.title")}
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : ""}>
              {t("workspace.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentWorkspace ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className={labelClass}>{t("workspace.name")}</Label>
                    <Input
                      value={currentWorkspace.name}
                      disabled
                      className={disabledInputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>{t("workspace.role")}</Label>
                    <Input
                      value={
                        myRole
                          ? t(`workspace.roles.${myRole}`)
                          : t("workspace.roleUnknown")
                      }
                      disabled
                      className={disabledInputClass}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className={labelClass}>{t("workspace.slug")}</Label>
                    <Input
                      value={currentWorkspace.slug}
                      disabled
                      className={disabledInputClass}
                    />
                  </div>
                </div>

                <div className={`flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between ${
                  isDarkMode ? "border-red-900/50 bg-red-950/20" : "border-red-200 bg-red-50"
                }`}>
                  <div>
                    <p className={isDarkMode ? "font-medium text-red-300" : "font-medium text-red-700"}>
                      {t("workspace.deleteTitle")}
                    </p>
                    <p className={isDarkMode ? "mt-1 text-sm text-gray-400" : "mt-1 text-sm text-gray-600"}>
                      {canDeleteWorkspace
                        ? t("workspace.deleteDescription")
                        : t("workspace.ownerOnly")}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        disabled={!canDeleteWorkspace || isDeletingWorkspace}
                        className="gap-2 md:w-auto"
                      >
                        {isDeletingWorkspace ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {t("workspace.deleteWorkspace")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                      <AlertDialogHeader>
                        <AlertDialogTitle className={isDarkMode ? "text-white" : ""}>
                          {t("workspace.confirmTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("workspace.confirmDescription", {
                            name: currentWorkspace.name,
                          })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          className={isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : ""}
                        >
                          {t("danger.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteWorkspace}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {t("danger.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            ) : (
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                {t("workspace.empty")}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
              {t("password.title")}
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : ""}>
              {t("password.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className={labelClass}>{t("password.currentPassword")}</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t("password.currentPasswordPlaceholder")}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>{t("password.newPassword")}</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("password.newPasswordPlaceholder")}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>{t("password.confirmNewPassword")}</Label>
              <Input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder={t("password.confirmNewPasswordPlaceholder")}
                className={inputClass}
              />
            </div>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("password.updatePassword")}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className={`${cardClass} border-red-500/30`}>
          <CardHeader>
            <CardTitle className="text-red-500">{t("danger.title")}</CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : ""}>
              {t("danger.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("danger.deleteAccount")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className={isDarkMode ? "bg-gray-900 border-gray-800" : ""}>
                <AlertDialogHeader>
                  <AlertDialogTitle className={isDarkMode ? "text-white" : ""}>
                    {t("danger.confirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("danger.confirmDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    className={isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : ""}
                  >
                    {t("danger.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {t("danger.delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
