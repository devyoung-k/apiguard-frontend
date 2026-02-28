'use client';

import { useState } from 'react';
import { PricingPage } from '@/components/PricingPage';
import { BillingPage } from '@/components/BillingPage';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useTranslations } from 'next-intl';

export default function BillingRoute() {
  const [activeTab, setActiveTab] = useState<'pricing' | 'billing'>('pricing');
  const isDarkMode = useDarkMode();
  const t = useTranslations('billing');

  return (
    <div className="space-y-6">
      <div>
        <h1
          className={`text-3xl mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {t('title')}
        </h1>
      </div>

      {/* 탭 네비게이션 */}
      <div
        className={`inline-flex p-1 rounded-xl ${
          isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'
        }`}
      >
        {(['pricing', 'billing'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? isDarkMode
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'pricing' ? <PricingPage /> : <BillingPage />}
    </div>
  );
}
