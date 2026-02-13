"use client"

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Shield, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import axios from "axios";

export function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  const isDarkMode = mounted && (theme === 'dark' || theme === 'system');

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) {
      toast.error('이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.response?.data?.detail || '로그인에 실패했습니다.';
        toast.error(message);
      } else {
        toast.error('로그인에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-black' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
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
              Welcome to APIGuard
            </CardTitle>
            <CardDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Monitor your APIs with confidence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : ''}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Password</Label>
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
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="text-center text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Don&apos;t have an account? </span>
                <Link 
                  href="/register"
                  className={`font-medium hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
