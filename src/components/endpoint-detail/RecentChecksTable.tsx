'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { HealthCheckResult } from '@/types/api';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useTranslations } from 'next-intl';

interface RecentChecksTableProps {
  checks: HealthCheckResult[];
}

export function RecentChecksTable({ checks }: RecentChecksTableProps) {
  const isDarkMode = useDarkMode();
  const t = useTranslations('endpointDetail');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card
        className={
          isDarkMode
            ? 'border-gray-800 bg-gray-900'
            : 'border-gray-300 bg-white shadow-sm'
        }
      >
        <CardHeader>
          <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
            {t('recentChecks.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checks.length === 0 ? (
            <div
              className={`py-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {t('recentChecks.empty')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDarkMode ? 'border-b border-gray-800' : 'border-b'}>
                    <th
                      className={`px-4 py-3 text-left ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      {t('recentChecks.columns.timestamp')}
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      {t('recentChecks.columns.statusCode')}
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      {t('recentChecks.columns.responseTime')}
                    </th>
                    <th
                      className={`px-4 py-3 text-left ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      {t('recentChecks.columns.result')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {checks.map((check) => (
                    <tr
                      key={check.id}
                      className={`border-b ${
                        isDarkMode
                          ? 'border-gray-800 hover:bg-gray-800/50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td
                        className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}
                      >
                        {new Date(check.checkedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            check.statusCode >= 200 && check.statusCode < 300
                              ? 'outline'
                              : 'destructive'
                          }
                          className={
                            isDarkMode && check.statusCode >= 200 && check.statusCode < 300
                              ? 'border-green-500/50 text-green-400'
                              : ''
                          }
                        >
                          {check.statusCode}
                        </Badge>
                      </td>
                      <td
                        className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}
                      >
                        {check.responseTimeMs}ms
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={check.status === 'SUCCESS' ? 'outline' : 'destructive'}
                          className={
                            isDarkMode && check.status === 'SUCCESS'
                              ? 'border-green-500/50 text-green-400'
                              : ''
                          }
                        >
                          {check.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
