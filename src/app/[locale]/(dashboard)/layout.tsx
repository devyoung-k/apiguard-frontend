'use client';

import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { WorkspaceProvider } from '@/contexts/workspace-context';
import { PlanProvider } from '@/contexts/plan-context';
import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from '@/i18n/navigation';
import { PageLoadingState } from '@/components/ui/page-states';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <PageLoadingState />;
  }

  return (
    <WorkspaceProvider>
      <PlanProvider>
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden fixed top-4 left-4 z-50 rounded-lg bg-white p-2 text-gray-900 shadow-md dark:bg-gray-800 dark:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <button
              type="button"
              aria-label="메뉴 닫기"
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={`${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0 fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out`}
          >
            <AppSidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
          </div>

          <main className="flex-1 p-4 md:p-8 md:ml-64 overflow-auto">
            <div className="pt-12 md:pt-0">{children}</div>
          </main>
        </div>
      </PlanProvider>
    </WorkspaceProvider>
  );
}
