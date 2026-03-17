import { useNavigate } from 'react-router-dom';
import { Home, ChevronRight, LogOut } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api';

type NavKey = 'dashboard' | 'modules' | 'quiz' | 'analytics' | 'students' | 'faculty' | 'announcements' | 'audit' | 'none';

export interface NavItemConfig {
  key: NavKey;
  label: string;
  path: string;
}

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbLabel: string;
  activeNav?: NavKey;
  /** Student: go to studentdashboard. Instructor: go to instructordashboard. */
  userType?: 'student' | 'instructor' | 'admin';
  /** Override default nav items (e.g. for instructor: Dashboard, Students, Modules, Analytics) */
  navItems?: NavItemConfig[];
  children: React.ReactNode;
  /** Optional right-side header content (e.g. user menu, actions) */
  headerRight?: React.ReactNode;
  /** If true, the layout container will be wider (max-w-[1600px] instead of default 1200px) */
  isWide?: boolean;
}

export function PageLayout({
  title,
  subtitle,
  breadcrumbLabel,
  activeNav = 'none',
  userType = 'student',
  navItems: navItemsProp,
  children,
  headerRight,
  isWide = false,
}: PageLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // still redirect on network error so user can log in again
    }
    navigate('/login');
  };

  const dashboardPath =
    userType === 'instructor'
      ? '/instructordashboard'
      : userType === 'admin'
        ? '/admindashboard'
        : '/studentdashboard';

  const defaultNav: NavItemConfig[] = [
    { key: 'dashboard', label: 'Dashboard', path: dashboardPath },
    { key: 'modules', label: 'Modules', path: '/modules' },
    { key: 'quiz', label: 'Quiz', path: '/quizselection' },
    ...(userType === 'student' ? [{ key: 'analytics' as const, label: 'Analytics', path: '/studentanalytics' }] : []),
  ];
  const navItems = navItemsProp ?? defaultNav;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <header className="border-b border-neutral-900 bg-neutral-950 sticky top-0 z-50">
        <div className={`${isWide ? 'max-w-[1600px]' : 'max-w-[1200px]'} mx-auto px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-sm font-bold uppercase tracking-tighter cursor-pointer" onClick={() => navigate(dashboardPath)}>
                <span className="text-emerald-500">VR</span><span className="text-white">MTS</span>
                {userType === 'instructor' && (
                  <span className="text-emerald-500 ml-1.5 uppercase">INSTRUCTOR</span>
                )}
              </h1>
              <nav className="hidden md:flex gap-6 text-sm">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.path)}
                    className={
                      activeNav === item.key
                        ? 'text-emerald-500 font-medium'
                        : 'text-neutral-500 hover:text-neutral-300 transition-colors'
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {headerRight}
              <div className="flex items-center gap-2 text-xs text-neutral-600">
                <Home
                  className="w-3.5 h-3.5 cursor-pointer hover:text-white transition-colors"
                  onClick={() => navigate(dashboardPath)}
                  aria-label="Dashboard"
                />
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-neutral-500">{breadcrumbLabel}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-md transition-colors border border-transparent hover:border-neutral-800"
                aria-label="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-neutral-500 text-sm mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </header>

      <main className={`${isWide ? 'max-w-[1600px]' : 'max-w-[1200px]'} mx-auto px-6 py-10`}>{children}</main>
    </div>
  );
}
