import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ChevronRight, LogOut, Menu, X } from 'lucide-react';
import { API_BASE_URL as getApiBaseUrl } from '@/lib/api';

const API_BASE_URL = getApiBaseUrl;

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

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

  const defaultNav: NavItemConfig[] = 
    userType === 'instructor' 
      ? [
          { key: 'dashboard', label: 'Dashboard', path: '/instructordashboard' },
          { key: 'students', label: 'Students', path: '/instructor/students' },
          { key: 'modules', label: 'Modules', path: '/instructor/modules' },
          { key: 'quiz', label: 'Quiz', path: '/instructor/create-quiz' },
          { key: 'analytics', label: 'Analytics', path: '/instructor/analytics' },
        ]
      : userType === 'admin'
        ? [
            { key: 'dashboard', label: 'Dashboard', path: '/admindashboard' },
            { key: 'students', label: 'Students', path: '/admin/students' },
            { key: 'faculty', label: 'Faculty', path: '/admin/faculty' },
            { key: 'audit', label: 'Audit', path: '/admin/audit' },
          ]
        : [
            { key: 'dashboard', label: 'Dashboard', path: dashboardPath },
            { key: 'modules', label: 'Modules', path: '/modules' },
            { key: 'quiz', label: 'Quiz', path: '/quizselection' },
            { key: 'analytics', label: 'Analytics', path: '/studentanalytics' },
          ];

  const navItems = navItemsProp ?? defaultNav;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <header className="border-b border-neutral-900 bg-neutral-950 sticky top-0 z-50">
        <div className={`${isWide ? 'max-w-[1600px]' : 'max-w-[1200px]'} mx-auto px-4 sm:px-6 py-4`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 md:gap-6 min-w-0">
              <h1
                className="text-sm font-bold uppercase tracking-tighter cursor-pointer shrink-0"
                onClick={() => navigate(dashboardPath)}
              >
                <span className="text-emerald-500">VR</span><span className="text-white">MTS</span>
                {userType === 'instructor' && (
                  <span className="text-emerald-500 ml-1.5 uppercase hidden md:inline">INSTRUCTOR</span>
                )}
                {userType === 'admin' && (
                  <span className="text-emerald-500 ml-1.5 uppercase font-bold tracking-widest hidden md:inline">ADMIN</span>
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
            <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
              {headerRight && <div className="min-w-0 flex items-center [&_button]:min-h-[40px] [&_button]:min-w-[40px] md:[&_button]:min-h-0 md:[&_button]:min-w-0">{headerRight}</div>}
              <div className="hidden md:flex items-center gap-2 text-xs text-neutral-600 min-w-0">
                <Home
                  className="w-3.5 h-3.5 shrink-0 cursor-pointer hover:text-white transition-colors"
                  onClick={() => navigate(dashboardPath)}
                  aria-label="Dashboard"
                />
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <span className="text-neutral-500 truncate max-w-[140px] lg:max-w-none">{breadcrumbLabel}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-md transition-colors border border-transparent hover:border-neutral-800"
                aria-label="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="mt-6 md:mt-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-neutral-500 text-sm mt-1 break-words">{subtitle}</p>
            )}
          </div>
        </div>
      </header>

      {/* Mobile menu: same routes as desktop nav + quick actions */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative w-full max-w-[min(100vw,20rem)] bg-neutral-950 border-l border-neutral-900 shadow-2xl flex flex-col max-h-screen pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
            <div className="flex items-center justify-between p-4 border-b border-neutral-900">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Menu</span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    navigate(item.path);
                    setMobileNavOpen(false);
                  }}
                  className={`text-left px-4 py-3.5 rounded-lg text-sm font-medium transition-colors ${
                    activeNav === item.key
                      ? 'bg-neutral-900 text-emerald-500'
                      : 'text-neutral-300 hover:bg-neutral-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="my-4 border-t border-neutral-900" />
              <button
                type="button"
                onClick={() => {
                  navigate(dashboardPath);
                  setMobileNavOpen(false);
                }}
                className="text-left px-4 py-3.5 rounded-lg text-sm text-neutral-300 hover:bg-neutral-900 flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Dashboard home
              </button>
              <p className="px-4 pt-2 text-[10px] uppercase tracking-widest text-neutral-600">Current</p>
              <p className="px-4 pb-2 text-sm text-neutral-400 truncate">{breadcrumbLabel}</p>
              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                  setMobileNavOpen(false);
                }}
                className="mt-auto text-left px-4 py-3.5 rounded-lg text-sm text-rose-400 hover:bg-neutral-900 flex items-center gap-2 border border-neutral-900"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className={`${isWide ? 'max-w-[1600px]' : 'max-w-[1200px]'} mx-auto px-4 sm:px-6 py-6 sm:py-10`}>{children}</main>
    </div>
  );
}
