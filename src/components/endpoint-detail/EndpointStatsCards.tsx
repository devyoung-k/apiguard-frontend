'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import type { EndpointStats } from '@/types/api';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useTranslations } from 'next-intl';

interface EndpointStatsCardsProps {
  stats: EndpointStats;
  checkInterval: number;
}

export function EndpointStatsCards({
  stats,
  checkInterval,
}: EndpointStatsCardsProps) {
  const isDarkMode = useDarkMode();
  const t = useTranslations('endpointDetail');

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 md:grid-cols-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card
        className={
          isDarkMode
            ? 'border-gray-800 bg-gray-900'
            : 'border-gray-300 bg-white shadow-sm'
        }
      >
        <CardContent className="pt-6">
          <div className="mb-1 text-2xl text-green-600">
            {stats.successRate.toFixed(2)}%
          </div>
          <div
            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            {t('stats.successRate')}
          </div>
        </CardContent>
      </Card>

      <Card
        className={
          isDarkMode
            ? 'border-gray-800 bg-gray-900'
            : 'border-gray-300 bg-white shadow-sm'
        }
      >
        <CardContent className="pt-6">
          <div
            className={`mb-1 text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {Math.round(stats.avgResponseTimeMs)}ms
          </div>
          <div
            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            {t('stats.avgResponseTime')}
          </div>
        </CardContent>
      </Card>

      <Card
        className={
          isDarkMode
            ? 'border-gray-800 bg-gray-900'
            : 'border-gray-300 bg-white shadow-sm'
        }
      >
        <CardContent className="pt-6">
          <div
            className={`mb-1 text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {stats.totalChecks.toLocaleString()}
          </div>
          <div
            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            {t('stats.totalChecks')}
          </div>
        </CardContent>
      </Card>

      <Card
        className={
          isDarkMode
            ? 'border-gray-800 bg-gray-900'
            : 'border-gray-300 bg-white shadow-sm'
        }
      >
        <CardContent className="pt-6">
          <div
            className={`mb-1 text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {checkInterval}s
          </div>
          <div
            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            {t('stats.checkInterval')}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
