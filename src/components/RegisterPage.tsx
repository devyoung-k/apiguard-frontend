"use client"

import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Shield, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { useTranslations } from "next-intl";

export function RegisterPage() {
  const router = useRouter();
  const isDarkMode = useDarkMode();
  const t = useTranslations("auth.register");
  const { signup } = useAuth();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!nickname || !email || !password || !confirmPassword) {
      toast.error(t('errors.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('errors.passwordsNotMatch'));
      return;
    }
    setIsLoading(true);
    try {
      await signup(email, password, nickname);
      router.push('/register/success');
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('errors.signUpFailed')));
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : '';
  const labelStyles = isDarkMode ? 'text-gray-300' : 'text-gray-700';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-linear-to-br from-gray-900 via-gray-900 to-black' 
        : 'bg-linear-to-br from-blue-50 to-indigo-100'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        <Card className={`w-full backdrop-blur-sm ${
          isDarkMode 
            ? 'bg-gray-900/90 border-gray-800 shadow-2xl' 
            : 'bg-white/90 border-white/20 shadow-xl'
        }`}>
          <CardHeader className="space-y-3 text-center">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20"
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>
            <CardTitle className={`text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('title')}
            </CardTitle>
            <CardDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className={labelStyles}>{t('nickname')}</Label>
                <Input
                  id="name"
                  placeholder={t('nicknamePlaceholder')}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  disabled={isLoading}
                  className={inputStyles}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className={labelStyles}>{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={inputStyles}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className={labelStyles}>{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className={inputStyles}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className={labelStyles}>{t('confirmPassword')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className={inputStyles}
                />
              </div>

              <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('creatingAccount')}
                  </>
                ) : (
                  t('createAccount')
                )}
              </Button>

              <div className="text-center text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('alreadyHaveAccount')} </span>
                <Link 
                  href="/login"
                  className={`font-medium hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  {t('signIn')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
