'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { PublicStatusPageResponse, PublicEndpointStatus, OverallStatus } from '@/types/api';
import { getPublicStatusPage } from '@/lib/api/status-page';

const STATUS_CONFIG: Record<OverallStatus, { label: string; color: string; bg: string }> = {
  OPERATIONAL: { label: 'All Systems Operational', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  DEGRADED: { label: 'Partial System Outage', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  MAJOR_OUTAGE: { label: 'Major System Outage', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  NO_DATA: { label: 'No Data Available', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
};

const ENDPOINT_STATUS_DOT: Record<string, string> = {
  UP: 'bg-green-500',
  DOWN: 'bg-red-500',
  UNKNOWN: 'bg-gray-400',
};

function UptimeBar({ percent }: { percent: number }) {
  const color = percent >= 99.5 ? 'bg-green-500' : percent >= 95 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}

function EndpointRow({ endpoint }: { endpoint: PublicEndpointStatus }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${ENDPOINT_STATUS_DOT[endpoint.status] ?? ENDPOINT_STATUS_DOT.UNKNOWN}`} />
          <span className="font-medium text-gray-900 text-sm break-all">{endpoint.url}</span>
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
            {endpoint.httpMethod}
          </span>
        </div>
        <span className={`text-sm font-medium ${endpoint.status === 'UP' ? 'text-green-600' : endpoint.status === 'DOWN' ? 'text-red-600' : 'text-gray-500'}`}>
          {endpoint.status === 'UP' ? 'Operational' : endpoint.status === 'DOWN' ? 'Down' : 'Unknown'}
        </span>
      </div>
      <UptimeBar percent={endpoint.uptimePercent} />
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>{endpoint.uptimePercent.toFixed(2)}% uptime (24h)</span>
        <span>{Math.round(endpoint.avgResponseTimeMs)}ms avg</span>
        {endpoint.lastCheckedAt && (
          <span>Last checked: {new Date(endpoint.lastCheckedAt).toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}

export default function PublicStatusPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<PublicStatusPageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await getPublicStatusPage(slug);
        setData(result);
        setError(null);
      } catch {
        setError('Status page not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // 60초마다 자동 새로고침
    const interval = setInterval(() => {
      getPublicStatusPage(slug).then(setData).catch(() => {});
    }, 60_000);

    return () => clearInterval(interval);
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600">This status page does not exist or is not public.</p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[data.overallStatus] ?? STATUS_CONFIG.NO_DATA;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.title}</h1>
          {data.description && (
            <p className="text-gray-600">{data.description}</p>
          )}
        </div>

        {/* Overall Status Banner */}
        <div className={`border rounded-lg p-4 text-center mb-8 ${statusConfig.bg}`}>
          <p className={`text-lg font-semibold ${statusConfig.color}`}>
            {statusConfig.label}
          </p>
        </div>

        {/* Endpoints */}
        <div className="space-y-3">
          {data.endpoints.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No endpoints are being monitored.
            </div>
          ) : (
            data.endpoints.map((endpoint, index) => (
              <EndpointRow key={index} endpoint={endpoint} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-400">
          Powered by <span className="font-semibold text-gray-500">APIGuard</span>
        </div>
      </div>
    </div>
  );
}
