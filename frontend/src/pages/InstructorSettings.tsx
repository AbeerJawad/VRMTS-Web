import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Shield, Bell, Globe, Monitor, Sun, Moon, Eye, Lock, Key, Smartphone, Clock, Save, Camera, AlertCircle, Check, BookOpen, Users, Award, Activity } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { useTheme } from '@/hooks/useTheme';
import { buildApiUrl } from '@/lib/api';

export default function InstructorSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState({
    studentProgress: true,
    classUpdates: true,
    quizSubmissions: true,
    systemAnnouncements: false,
    emailDigest: 'weekly'
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState({
    firstName: 'Dr. Sarah',
    lastName: 'Rahman',
    email: 'sarah.rahman@university.edu',
    phone: '+1 (555) 987-6543',
    institution: 'Medical University',
    department: 'Anatomy & Physiology',
    specialization: 'Human Anatomy'
  });
  const [preferences, setPreferences] = useState({
    timeZone: 'UTC+05:00 Pakistan Standard Time',
    dateFormat: 'MM/DD/YYYY',
    defaultView: 'Grid View'
  });
  const [accessibility, setAccessibility] = useState({
    textSize: 16,
    highContrast: false,
    reduceMotion: false,
    screenReader: false,
    keyboardNav: true,
    captions: false
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // Load user settings on component mount
  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const response = await fetch(buildApiUrl('user/settings'), {
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
          fetch(buildApiUrl('user/account'), {
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
          fetch(buildApiUrl('user/preferences'), {
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
          fetch(buildApiUrl('user/notifications'), {
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
          fetch(buildApiUrl('user/accessibility'), {
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
      subtitle="Manage your account settings and preferences"
      breadcrumbLabel="Settings"
      userType="instructor"
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
                    : 'text-neutral-600 hover:text-neutral-400 hover:bg-neutral-900'
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
                  Email Address
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
                  Phone Number
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
                    Department
                  </label>
                  <input
                    type="text"
                    value={userData.department || ''}
                    onChange={(e) => setUserData({...userData, department: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-medium focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                  Specialization
                </label>
                <input
                  type="text"
                  value={userData.specialization || ''}
                  onChange={(e) => setUserData({...userData, specialization: e.target.value})}
                  placeholder="e.g. Human Anatomy, Physiology"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-neutral-700"
                />
              </div>
            </div>
          )}

            {activeTab === 'preferences' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 space-y-12">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-3">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  Preferences
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
                      value={preferences.timeZone}
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
                      value={preferences.dateFormat}
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
                      value={preferences.defaultView}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                    >
                      <option value="Grid View">Grid view</option>
                      <option value="List View">List view</option>
                      <option value="Compact View">Compact view</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'accessibility' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 space-y-12">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-3">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Accessibility
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
                    { label: 'High contrast mode', desc: 'Increase contrast for better visibility' },
                    { label: 'Reduce motion', desc: 'Disable animations and transitions' },
                    { label: 'Screen reader compatibility', desc: 'Optimize content for screen readers' },
                    { label: 'Keyboard Navigation', desc: 'Show highlights for keyboard focus' },
                    { label: 'Subtitles & Captions', desc: 'Automatically show captions for videos' }
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
                      { key: 'studentProgress', label: 'Student progress', desc: 'Alert when students achieve module proficiency' },
                      { key: 'classUpdates', label: 'Class updates', desc: 'Notifications regarding assignment updates' },
                      { key: 'quizSubmissions', label: 'Quiz submissions', desc: 'Real-time alerts for student quiz completions' },
                      { key: 'systemAnnouncements', label: 'System announcements', desc: 'General alerts regarding platform updates' }
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
                    Digest recurrence
                  </label>
                  <select
                    value={notifications.emailDigest}
                    onChange={(e) => setNotifications({...notifications, emailDigest: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                  >
                    <option value="realtime">Real-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="never">Never</option>
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
                  Security
                </h3>

                <div className="space-y-6">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    Change Password
                  </label>
                  <div className="space-y-4">
                    {[
                      { label: 'Current password', type: 'password', placeholder: 'Enter current password' },
                      { label: 'New password', type: 'password', placeholder: 'Enter new password' },
                      { label: 'Verify password', type: 'password', placeholder: 'Confirm new password' }
                    ].map((field, idx) => (
                      <div key={idx} className="space-y-3">
                        <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-tight italic">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded text-white text-xs font-bold focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-neutral-800"
                        />
                      </div>
                    ))}
                    <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-[10px] font-bold uppercase tracking-[0.2em] rounded transition-all mt-4">
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center justify-between">
                    Two-factor authentication
                    <span className="text-neutral-700">STATUS: DISABLED</span>
                  </label>
                  <div className="p-8 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-between">
                    <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest max-w-md">Enable 2fa for an extra layer of security</p>
                    <button className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] font-bold uppercase tracking-widest text-white transition-all">
                      Configure 2FA
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    Active sessions
                  </label>
                  <div className="space-y-3">
                    {[
                      { device: 'Desktop Chrome / Windows 11', location: 'Islamabad, PK', active: 'Current', icon: Monitor },
                      { device: 'Safari / iPhone 14 Pro', location: 'Rawalpindi, PK', active: '48h ago', icon: Smartphone }
                    ].map((session, idx) => (
                      <div key={idx} className="flex items-center justify-between p-6 bg-neutral-950 border border-neutral-800 rounded">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 flex items-center justify-center rounded">
                            <session.icon className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">{session.device}</h4>
                            <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-tight">{session.location} • {session.active}</p>
                          </div>
                        </div>
                        {session.active !== 'Current' && (
                          <button className="text-[10px] font-bold text-red-500/70 hover:text-red-500 uppercase tracking-widest transition-all">LOGOUT</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    Activity logs
                  </label>
                  <div className="space-y-1">
                    {[
                      { action: 'Password Updated', time: 'OCT 15, 2025 / 14:30', status: 'COMPLETE' },
                      { action: 'New Login Session', time: 'OCT 12, 2025 / 09:15', status: 'VERIFIED' }
                    ].map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-neutral-950/50 border-l-2 border-emerald-500">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-white uppercase tracking-widest">{log.action}</p>
                          <p className="text-[10px] text-neutral-700 font-bold uppercase">{log.time}</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500/50">{log.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-8 border-t border-neutral-800">
              <div className="flex flex-col gap-1">
                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                    <Shield className="w-3 h-3" />
                    Error: {error}
                  </div>
                )}
                {saved && (
                  <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                    <Check className="w-3 h-3" />
                    Settings saved successfully
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-8 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-500 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-800 text-neutral-950 disabled:text-neutral-500 text-[10px] font-bold uppercase tracking-[0.2em] rounded transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  {loading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3" />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

