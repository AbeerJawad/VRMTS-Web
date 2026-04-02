import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Shield, Bell, Globe, Monitor, Sun, Moon, Eye, Lock, Key, Smartphone, Clock, Save, Camera, AlertCircle, Check } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { useTheme } from '@/hooks/useTheme';

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('en');
  const [timeZone, setTimeZone] = useState('UTC+05:00 Pakistan Standard Time');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [defaultView, setDefaultView] = useState('Grid View');
  const [notifications, setNotifications] = useState({
    assignments: true,
    quizDeadlines: true,
    performance: true,
    announcements: false,
    emailDigest: 'weekly'
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@university.edu',
    phone: '+1 (555) 123-4567',
    institution: 'Medical University',
    studentId: '22i-1239',
    bio: ''
  });

  // Load user settings on component mount
  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/user/settings', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(prev => ({ ...prev, ...data.account }));
        if (data.preferences) {
          setTheme(data.preferences.theme || 'dark');
          setLanguage(data.preferences.language || 'en');
        }
        if (data.notifications) {
          setNotifications(prev => ({ ...prev, ...data.notifications }));
        }
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const promises = [];

      // Save account info
      if (activeTab === 'account') {
        promises.push(
          fetch('http://localhost:8080/api/user/account', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(userData)
          })
        );
      }

      // Save preferences
      if (activeTab === 'preferences') {
        promises.push(
          fetch('http://localhost:8080/api/user/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              theme,
              language,
              timeZone: 'UTC+05:00 Pakistan Standard Time',
              dateFormat: 'MM/DD/YYYY',
              defaultView: 'Grid View'
            })
          })
        );
      }

      // Save notifications
      if (activeTab === 'notifications') {
        promises.push(
          fetch('http://localhost:8080/api/user/notifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(notifications)
          })
        );
      }

      // Save accessibility (simplified - you can expand this)
      if (activeTab === 'accessibility') {
        promises.push(
          fetch('http://localhost:8080/api/user/accessibility', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              textSize: 16,
              highContrast: false,
              reduceMotion: false,
              screenReader: false,
              keyboardNav: true,
              captions: false
            })
          })
        );
      }

      await Promise.all(promises);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account Info', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Monitor },
    { id: 'accessibility', label: 'Accessibility', icon: Eye },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <PageLayout
      title="Settings"
      subtitle="Account settings and preferences"
      breadcrumbLabel="Settings"
      userType="student"
      headerRight={
        <div className="w-10 h-10 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-white shadow-inner">
          {userData.firstName[0]}{userData.lastName[0]}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded text-left transition-all group ${
                  activeTab === tab.id
                    ? 'bg-neutral-900 border border-neutral-800 text-emerald-500'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <tab.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === tab.id ? 'text-emerald-500' : 'text-neutral-600 group-hover:text-neutral-400'}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

          {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'account' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 space-y-8">
              <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-3 mb-8">
                <User className="w-4 h-4 text-emerald-500" />
                Account Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    First name
                  </label>
                  <input
                    type="text"
                    value={userData.firstName || ''}
                    onChange={(e) => setUserData({...userData, firstName: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-medium focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={userData.lastName || ''}
                    onChange={(e) => setUserData({...userData, lastName: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-medium focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input
                    type="email"
                    value={userData.email || ''}
                    onChange={(e) => setUserData({...userData, email: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-medium focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input
                    type="tel"
                    value={userData.phone || ''}
                    onChange={(e) => setUserData({...userData, phone: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-medium focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    Institution
                  </label>
                  <input
                    type="text"
                    value={userData.institution || ''}
                    onChange={(e) => setUserData({...userData, institution: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-medium focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={userData.studentId || ''}
                    disabled
                    className="w-full px-4 py-3 bg-neutral-950/50 border border-neutral-800 rounded text-neutral-600 text-xs font-mono font-bold cursor-not-allowed opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                  Bio / Description
                </label>
                <textarea
                  rows={4}
                  value={userData.bio || ''}
                  onChange={(e) => setUserData({...userData, bio: e.target.value})}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-medium focus:outline-none focus:border-emerald-500/50 transition-all resize-none placeholder:text-neutral-700"
                />
              </div>
            </div>
          )}

            {activeTab === 'preferences' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 space-y-12">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-emerald-500" />
                  Interface Settings
                </h3>

                <div className="space-y-6">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    App theme
                  </label>
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { id: 'light', icon: Sun, label: 'Light' as const },
                      { id: 'dark', icon: Moon, label: 'Dark' as const }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setTheme(mode.id as 'light' | 'dark')}
                        className={`p-6 rounded border transition-all flex flex-col items-center gap-3 group ${
                          theme === mode.id
                            ? 'border-emerald-500/50 bg-neutral-950 text-emerald-500'
                            : 'border-neutral-800 bg-neutral-950/20 text-neutral-600 hover:border-neutral-700 hover:text-neutral-400'
                        }`}
                      >
                        <mode.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${theme === mode.id ? 'text-emerald-500' : 'text-neutral-700'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                    >
                      <option value="en">English (Default)</option>
                      <option value="es">Spanish (ES-1)</option>
                      <option value="fr">French (FR-1)</option>
                      <option value="de">German (DE-1)</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      Time zone
                    </label>
                    <select
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                    >
                      <option value="UTC+05:00 Pakistan Standard Time">PKT (UTC+5)</option>
                      <option value="UTC-08:00 Pacific Time">PST (UTC-8)</option>
                      <option value="UTC-05:00 Eastern Time">EST (UTC-5)</option>
                      <option value="UTC+00:00 GMT">GMT (UTC+0)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      Date format
                    </label>
                    <select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                    >
                      <option value="MM/DD/YYYY">MM / DD / YYYY</option>
                      <option value="DD/MM/YYYY">DD / MM / YYYY</option>
                      <option value="YYYY-MM-DD">YYYY - MM - DD</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      Default dashboard view
                    </label>
                    <select
                      value={defaultView}
                      onChange={(e) => setDefaultView(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                    >
                      <option value="Grid View">Grid view</option>
                      <option value="List View">List view</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'accessibility' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 space-y-12">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-3">
                  <Eye className="w-4 h-4 text-emerald-500" />
                  Accessibility Settings
                </h3>

                <div className="space-y-6">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    Text size
                  </label>
                  <div className="flex items-center gap-6 p-6 bg-neutral-950 border border-neutral-800 rounded">
                    <span className="text-[10px] font-bold text-neutral-600">MIN</span>
                    <input
                      type="range"
                      min="12"
                      max="20"
                      value={16}
                      className="flex-1 accent-emerald-500 bg-neutral-800 h-1 rounded"
                    />
                    <span className="text-lg font-bold text-white">MAX</span>
                  </div>
                  <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">Adjust overall interface text scaling</p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'High Contrast Mode', desc: 'Increase visibility for interface elements' },
                    { label: 'Reduce Motion', desc: 'Disable animations and transitions' },
                    { label: 'Screen reader optimization', desc: 'Optimize structural metadata for screen readers' },
                    { label: 'Keyboard Navigation', desc: 'Show visual indicators for keyboard focus' },
                    { label: 'Closed Captions', desc: 'Display subtitles during video playback' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-6 bg-neutral-950 border border-neutral-800 rounded group hover:border-neutral-700 transition-all">
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">{item.label}</h4>
                        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-tight">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 space-y-12">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-3">
                  <Bell className="w-4 h-4 text-emerald-500" />
                  Notifications
                </h3>

                <div className="space-y-6">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    Email notifications
                  </label>
                  <div className="space-y-4">
                    {[
                      { key: 'assignments', label: 'Assignment updates', desc: 'Alert when new anatomical modules are available' },
                      { key: 'quizDeadlines', label: 'Quiz deadlines', desc: 'Important alerts for upcoming evaluation deadlines' },
                      { key: 'performance', label: 'Performance reports', desc: 'Regular summaries of your academic progress' },
                      { key: 'announcements', label: 'System announcements', desc: 'General alerts regarding platform updates' }
                    ].map((notif) => (
                      <div key={notif.key} className="flex items-center justify-between p-6 bg-neutral-950 border border-neutral-800 rounded group hover:border-neutral-700 transition-all">
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">{notif.label}</h4>
                          <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-tight">{notif.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(notifications[notif.key as keyof typeof notifications])}
                            onChange={(e) => setNotifications({...notifications, [notif.key]: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    Notification Frequency
                  </label>
                  <select
                    value={notifications.emailDigest}
                    onChange={(e) => setNotifications({...notifications, emailDigest: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                  >
                    <option value="realtime">Real-time notifications</option>
                    <option value="daily">Daily Summary</option>
                    <option value="weekly">Weekly summary</option>
                    <option value="never">Disabled</option>
                  </select>
                </div>

                <div className="space-y-6">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-neutral-600" />
                    Push notifications
                  </label>
                  <div className="p-8 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-between">
                    <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">Enable push notifications on this device</p>
                    <button type="button" className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-white transition-all">
                      Enable push notifications
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 space-y-12">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-3">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Security Settings
                </h3>

                <div className="p-8 bg-neutral-950 border border-neutral-800 rounded space-y-8">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-3">
                    <Lock className="w-3.5 h-3.5 text-neutral-600" />
                    Change Password
                  </h4>
                  <div className="space-y-6">
                    {['Current access key', 'New access key', 'Verify new key'].map((label, i) => (
                      <div key={i} className="space-y-3">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{label}</label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded text-white text-xs focus:outline-none focus:border-emerald-500/50 transition-all"
                        />
                      </div>
                    ))}
                    <button className="w-full py-4 bg-white hover:bg-neutral-200 text-black text-[10px] font-bold uppercase tracking-widest rounded transition-all active:scale-[0.98] shadow-lg">
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="p-8 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-3">
                      <Key className="w-3.5 h-3.5 text-emerald-500" />
                      Two-factor authentication
                    </h4>
                    <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-tight">Active layer-2 security verified</p>
                  </div>
                  <button className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-white transition-all">
                    Configure 2FA
                  </button>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Active terminal sessions</h4>
                  <div className="space-y-3">
                    {[
                      { type: Monitor, name: 'Chrome on Windows Desktop', active: true, loc: 'Karachi, PK' },
                      { type: Smartphone, name: 'Safari on iOS Device', loc: 'Rawalpindi, PK' }
                    ].map((session, i) => (
                      <div key={i} className="p-6 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-between group hover:border-neutral-700 transition-all">
                        <div className="flex gap-6 items-center">
                          <div className="w-12 h-12 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                            <session.type className="w-5 h-5 text-neutral-500" />
                          </div>
                          <div>
                            <h5 className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-3">
                              {session.name}
                              {session.active && <span className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">CURRENT</span>}
                            </h5>
                            <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-tight mt-1">{session.loc} // Active</p>
                          </div>
                        </div>
                        {!session.active && (
                          <button className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:text-rose-400 transition-colors">Logout</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded">
                  <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-3 mb-3">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Danger Zone
                  </h4>
                  <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-tight mb-6">Permanently delete your account and all data</p>
                  <button className="px-8 py-3 bg-neutral-900 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded transition-all">
                    Delete my account
                  </button>
                </div>
              </div>
            )}

            <div className="mt-12 pt-12 border-t border-neutral-800 flex justify-end gap-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="px-10 py-3 bg-white hover:bg-neutral-200 text-black text-[10px] font-bold uppercase tracking-widest rounded transition-all shadow-xl active:scale-95 disabled:opacity-30 disabled:grayscale"
              >
                {loading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
    </PageLayout>
  );
}
