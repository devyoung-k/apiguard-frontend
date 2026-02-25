'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useTranslations } from 'next-intl';

interface EndpointChartsProps {
  responseTimeData: Array<{ time: string; value: number }>;
  uptimeData: Array<{ name: string; value: number }>;
  hasChecks: boolean;
}

const COLORS = ['#10b981', '#ef4444'];

export function EndpointCharts({
  responseTimeData,
  uptimeData,
  hasChecks,
}: EndpointChartsProps) {
  const isDarkMode = useDarkMode();
  const t = useTranslations('endpointDetail');

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <motion.div
        className="lg:col-span-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
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
              {t('charts.responseTimeTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent className={isDarkMode ? 'bg-gray-900' : ''}>
            {responseTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={responseTimeData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                  />
                  <XAxis
                    dataKey="time"
                    stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                      border: isDarkMode
                        ? '1px solid #374151'
                        : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: isDarkMode ? '#ffffff' : '#000000',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div
                className={`py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {t('charts.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
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
              {t('charts.successVsFailed')}
            </CardTitle>
          </CardHeader>
          <CardContent className={isDarkMode ? 'bg-gray-900' : ''}>
            {uptimeData.length > 0 && hasChecks ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={uptimeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {uptimeData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                      border: isDarkMode
                        ? '1px solid #374151'
                        : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: isDarkMode ? '#ffffff' : '#000000',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div
                className={`py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {t('charts.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
