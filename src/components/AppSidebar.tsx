import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FolderKanban, Bell, Settings, LogOut, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";

interface AppSidebarProps {
  onMobileClose?: () => void;
}

export function AppSidebar({ onMobileClose }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (theme === 'dark' || theme === 'system');

  const menuItems = [
    { id: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: '/projects', label: 'Projects', icon: FolderKanban },
    { id: '/alerts', label: 'Alerts', icon: Bell },
    { id: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch {
      // 에러가 나도 로그아웃 처리됨 (AuthContext에서 토큰 삭제)
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
      if (onMobileClose) onMobileClose();
    }
  };

  const handleNavigate = () => {
    if (onMobileClose) onMobileClose();
  };

  return (
    <div className={`w-64 min-h-screen flex flex-col border-r transition-colors ${
      isDarkMode 
        ? 'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 border-gray-800 text-white'
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className={`p-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-lg">🛡️</span>
          </div>
          <h1 className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>APIGuard</h1>
        </div>
        <p className={`text-xs mt-1 ml-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>API Monitoring</p>
      </div>
      
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
                  : isDarkMode 
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={`p-3 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            isDarkMode 
              ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          {isLoggingOut ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          <span className="text-sm">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
}
