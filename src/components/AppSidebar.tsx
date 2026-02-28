import { Link, usePathname, useRouter } from '@/i18n/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Bell,
  Settings,
  LogOut,
  Loader2,
  Users,
  ChevronsUpDown,
  CreditCard,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { useTranslations } from 'next-intl';
import { canManageMembers } from '@/lib/permissions';

interface AppSidebarProps {
  onMobileClose?: () => void;
}

export function AppSidebar({ onMobileClose }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { currentWorkspace, workspaces, myRole, switchWorkspace } =
    useWorkspace();
  const t = useTranslations('sidebar');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isWsSelectorOpen, setIsWsSelectorOpen] = useState(false);

  const menuItems = [
    { id: '/dashboard', label: t('menu.dashboard'), icon: LayoutDashboard },
    { id: '/projects', label: t('menu.projects'), icon: FolderKanban },
    { id: '/alerts', label: t('menu.alerts'), icon: Bell },
    ...(canManageMembers(myRole)
      ? [{ id: '/admin/members', label: t('menu.admin'), icon: Users }]
      : []),
    { id: '/settings', label: t('menu.settings'), icon: Settings },
    { id: '/billing', label: t('menu.billing'), icon: CreditCard },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch {
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
      if (onMobileClose) onMobileClose();
    }
  };

  const handleNavigate = () => {
    if (onMobileClose) onMobileClose();
  };

  const handleSwitchWorkspace = (id: number) => {
    switchWorkspace(id);
    setIsWsSelectorOpen(false);
  };

  return (
    <div className="w-64 min-h-screen flex flex-col border-r border-gray-200 bg-white text-gray-900 transition-colors dark:border-gray-800 dark:bg-linear-to-b dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 dark:text-white">
      <div className="border-b border-gray-200 p-6 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-lg">🛡️</span>
          </div>
          <h1 className="text-xl text-gray-900 dark:text-white">APIGuard</h1>
        </div>
        <p className="text-xs mt-1 ml-10 text-gray-600 dark:text-gray-400">
          {t('brandTagline')}
        </p>
      </div>

      {/* 워크스페이스 셀렉터 */}
      {workspaces.length > 0 && (
        <div className="px-3 pt-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsWsSelectorOpen(!isWsSelectorOpen)}
              aria-label={isWsSelectorOpen ? '워크스페이스 목록 닫기' : '워크스페이스 목록 열기'}
              aria-expanded={isWsSelectorOpen}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800"
            >
              <span className="truncate font-medium">
                {currentWorkspace?.name ?? t('workspace.switch')}
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
            </button>

            {isWsSelectorOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => handleSwitchWorkspace(ws.id)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      ws.id === currentWorkspace?.id
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {ws.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.id);
          return (
            <Link
              key={item.id}
              href={item.id}
              onClick={handleNavigate}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3 dark:border-gray-800">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          {isLoggingOut ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          <span className="text-sm">
            {isLoggingOut ? t('loggingOut') : t('logout')}
          </span>
        </button>
      </div>
    </div>
  );
}
