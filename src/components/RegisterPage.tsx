"use client"

import { useRouter } from "next/navigation";
import Link from "next/link";
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

export function RegisterPage() {
  const router = useRouter();
  const isDarkMode = useDarkMode();
  const { signup } = useAuth();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!nickname || !email || !password || !confirmPassword) {
      toast.error('모든 필드를 입력해 주세요.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }
    setIsLoading(true);
    try {
      await signup(email, password, nickname);
      toast.success('회원가입이 완료되었습니다. 로그인해 주세요.');
      router.push('/login');
    } catch (error) {
      toast.error(getApiErrorMessage(error, '회원가입에 실패했습니다.'));
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : '';
  const labelStyles = isDarkMode ? 'text-gray-300' : 'text-gray-700';

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
              Create your account
            </CardTitle>
            <CardDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Start monitoring your APIs in minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className={labelStyles}>Nickname</Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  disabled={isLoading}
                  className={inputStyles}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className={labelStyles}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={inputStyles}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className={labelStyles}>Password</Label>
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
                <Label htmlFor="confirm-password" className={labelStyles}>Confirm Password</Label>
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
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="text-center text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Already have an account? </span>
                <Link 
                  href="/login"
                  className={`font-medium hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
