"use client"

import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
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

export function LoginPage() {
  const router = useRouter();
  const isDarkMode = useDarkMode();
  const t = useTranslations("auth.login");
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) {
      toast.error(t('errors.missingCredentials'));
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('errors.signInFailed')));
    } finally {
      setIsLoading(false);
    }
  };

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
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{t('email')}</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : ''}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{t('password')}</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : ''}
                />
              </div>

              <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('signingIn')}
                  </>
                ) : (
                  t('signIn')
                )}
              </Button>

              <div className="text-center text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('noAccount')} </span>
                <Link 
                  href="/register"
                  className={`font-medium hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  {t('signUp')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
