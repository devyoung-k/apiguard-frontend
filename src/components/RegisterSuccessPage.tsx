"use client"

import { Link } from "@/i18n/navigation";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { CheckCircle2, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function RegisterSuccessPage() {
  const isDarkMode = useDarkMode();
  const t = useTranslations("auth.registerSuccess");

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDarkMode
        ? "bg-linear-to-br from-gray-900 via-gray-900 to-black"
        : "bg-linear-to-br from-blue-50 to-indigo-100"
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        <Card className={`w-full backdrop-blur-sm ${
          isDarkMode
            ? "bg-gray-900/90 border-gray-800 shadow-2xl"
            : "bg-white/90 border-white/20 shadow-xl"
        }`}>
          <CardHeader className="space-y-3 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="h-8 w-8 text-white" />
            </motion.div>
            <CardTitle className={`text-2xl ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {t('title')}
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full h-11 text-base">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                {t('signIn')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
