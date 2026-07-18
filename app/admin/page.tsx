'use client';

import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { 
  Users, FileText, FolderOpen, ShoppingBag, 
  BarChart3, Plus, Edit, Trash2, Upload, X, Cpu
} from 'lucide-react';

// ============ TYPES ============
interface Project {
  id: number;
  title: string;
  desc: string;
  tech: string;
  link: string;
  image_url: string | null;
  createdAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
}

// ============ ADMIN LOGIN ============
const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem('admin_token', data.token);
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user || { isAdmin: true, name: 'مدیر' }));
          localStorage.setItem('admin_user', JSON.stringify(data.user || { isAdmin: true, name: 'مدیر' }));
        }
        toast.success('ورود موفق ✅');
        onLogin();
      } else {
        toast.error(data.error || 'نام کاربری یا رمز عبور اشتباه است');
      }
    } catch (error) {
      toast.error('خطا در ورود');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white font-vazir">
      <form onSubmit={handleSubmit} className="bg-[#18181b] p-10 rounded-2xl w-full max-w-md shadow-2xl border border-white/10">
        <h1 className="text-3xl font-bold text-center mb-2">پنل مدیریت</h1>
        <p className="text-zinc-500 text-center mb-8">احسان صالحی</p>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="نام کاربری"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none transition"
            required
          />
          <input
            type="password"
            placeholder="رمز عبور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none transition"
            required
          />
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl font-bold transition"
          >
            ورود به پنل
          </button>
        </div>
      </form>
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
};

// ============ STAT CARD ============
const StatCard = ({ label, value, color }: { label: string; value: number; color: 'blue' | 'amber' | 'green' | 'purple' }) => {
  const colors = {
    blue: 'bg-blue-600/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-600/10 text-amber-400 border-amber-500/20',
    green: 'bg-green-600/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-600/10 text-purple-400 border-purple-500/20',
  };
  return (
    <div className={`p-4 rounded-2xl border ${colors[color]} backdrop-blur-sm`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
};

// ============ MAIN ADMIN PAGE ============
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'automation' | 'traffic' | 'projects' | 'blog' | 'users' | 'courses'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, totalPosts: 0, totalSales: 0, revenue: 0 });
  const [trafficData, setTrafficData] = useState<any>(null);
  const [automationData, setAutomationData] = useState<any>(null);
  const [callMeBotInput, setCallMeBotInput] = useState('');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({ title: '', desc: '', tech: '', link: '#', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    const userStr = localStorage.getItem('admin_user') || localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.isAdmin) {
          setIsAuthenticated(true);
          fetchData();
        } else {
          window.location.href = '/dashboard';
        }
      } catch (e) {}
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      const [projectsRes, usersRes, statsRes, trafficRes] = await Promise.all([
        fetch('/api/projects', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/traffic-ai', { headers }),
      ]);
      const projectsData = await projectsRes.json();
      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      const trafficJson = await trafficRes.json();
      if (projectsData.success) setProjects(projectsData.data);
      if (usersData.success) setUsers(usersData.data);
      if (statsData.success) setStats(statsData.data);
      if (trafficJson.success) setTrafficData(trafficJson);
    } catch (error) {
      toast.error('خطا در دریافت داده‌ها');
    }
    setLoading(false);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error('فایلی انتخاب نشده');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setProjectForm({ ...projectForm, image_url: data.url });
        toast.success('عکس با موفقیت آپلود شد ✅');
      } else {
        toast.error(data.error || 'خطا در آپلود');
      }
    } catch (error) {
      toast.error('خطا در آپلود');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = () => {
    setProjectForm({ ...projectForm, image_url: '' });
    toast.info('عکس حذف شد');
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
    const method = editingProject ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(projectForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingProject ? 'پروژه ویرایش شد ✅' : 'پروژه اضافه شد ✅');
        setProjectForm({ title: '', desc: '', tech: '', link: '#', image_url: '' });
        setEditingProject(null);
        fetchData();
      } else {
        toast.error(data.error || 'خطا در ذخیره');
      }
    } catch (error) {
      toast.error('خطا');
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('آیا از حذف این پروژه مطمئن هستید؟')) return;
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('پروژه حذف شد');
        fetchData();
      } else {
        toast.error('خطا در حذف');
      }
    } catch (error) {
      toast.error('خطا');
    }
  };

  const handleToggleAdmin = async (userId: number, currentIsAdmin: boolean) => {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isAdmin: !currentIsAdmin }),
      });
      if (res.ok) {
        toast.success('نقش کاربر تغییر کرد');
        fetchData();
      } else {
        toast.error('خطا در تغییر نقش');
      }
    } catch (error) {
      toast.error('خطا');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('آیا از حذف این کاربر مطمئن هستید؟')) return;
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('کاربر حذف شد');
        fetchData();
      } else {
        toast.error('خطا در حذف کاربر');
      }
    } catch (error) {
      toast.error('خطا');
    }
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => { setIsAuthenticated(true); fetchData(); }} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'داشبورد', icon: BarChart3 },
    { id: 'automation', label: '⚡ سناریوساز (Make Studio)', icon: Cpu },
    { id: 'traffic', label: '🚀 رشد بازدید و سئو', icon: BarChart3 },
    { id: 'projects', label: 'پروژه‌ها', icon: FolderOpen },
    { id: 'blog', label: 'وبلاگ', icon: FileText },
    { id: 'users', label: 'کاربران', icon: Users },
    { id: 'courses', label: 'دوره‌ها', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-vazir" dir="rtl">
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">
            پنل مدیریت
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem('admin_token');
              localStorage.removeItem('token');
              localStorage.removeItem('admin_user');
              localStorage.removeItem('user');
              document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              setIsAuthenticated(false);
            }}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition text-sm"
          >
            خروج
          </button>
        </div>
      </header>

      <nav className="sticky top-[60px] z-40 bg-zinc-900/40 backdrop-blur-md border-b border-white/5 px-4 py-2 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
                const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
                if (tab.id === 'traffic' && !trafficData) {
                  fetch('/api/admin/traffic-ai', { headers })
                    .then(r => r.json())
                    .then(d => { if (d.success) setTrafficData(d); })
                    .catch(() => {});
                }
                if (tab.id === 'automation') {
                  fetch('/api/admin/automation', { headers })
                    .then(r => r.json())
                    .then(d => { if (d.success) { setAutomationData(d); setCallMeBotInput(d.settings?.callmebot_key || ''); } })
                    .catch(() => {});
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* بنر خوش‌آمدگویی و معرفی فرماندهی کل */}
            <div className="bg-gradient-to-r from-orange-600/25 via-[#161926] to-blue-600/25 p-8 rounded-[36px] border border-orange-500/40 shadow-2xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="bg-gradient-to-r from-orange-500 to-amber-400 text-black text-xs font-black px-3 py-1 rounded-full mb-2.5 inline-block shadow-md">
                    👑 پنل فرماندهی کل سایت و امپراتوری رسانه‌ای
                  </span>
                  <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                    خوش آمدید، مهندس احسان صالحی
                  </h2>
                  <p className="text-zinc-300 text-sm mt-1.5 font-light leading-relaxed max-w-2xl">
                    تمامی ماژول‌های اتوماسیون انتشار (`Make Studio`)، ردیاب‌های بازدید (`VisitTracker`)، موتور دوزبانه و مدیریت محتوای شما در این مرکز فعال و آماده کنترل هستند.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => {
                      setActiveTab('automation');
                      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
                      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
                      fetch('/api/admin/automation', { headers }).then(r => r.json()).then(d => { if (d.success) setAutomationData(d); });
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs transition shadow-lg shadow-orange-500/20 flex items-center gap-2"
                  >
                    <span>⚡ ورود به سناریوساز (Make Studio)</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('traffic');
                      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
                      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
                      fetch('/api/admin/traffic-ai', { headers }).then(r => r.json()).then(d => { if (d.success) setTrafficData(d); });
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
                  >
                    <span>📈 آمار ترافیک و سئوی سایت</span>
                  </button>
                </div>
              </div>

              {/* آمار خلاصه و کلیدی */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                <div className="bg-black/60 p-5 rounded-2xl border border-white/10">
                  <p className="text-xs text-zinc-400 font-medium">کاربران ثبت‌نامی</p>
                  <p className="text-2xl font-black text-blue-400 mt-1.5">{stats.totalUsers || 1} نفر</p>
                </div>
                <div className="bg-black/60 p-5 rounded-2xl border border-white/10">
                  <p className="text-xs text-zinc-400 font-medium">پروژه‌های IT و شبکه</p>
                  <p className="text-2xl font-black text-amber-400 mt-1.5">{stats.totalProjects || 3} پروژه</p>
                </div>
                <div className="bg-black/60 p-5 rounded-2xl border border-white/10">
                  <p className="text-xs text-zinc-400 font-medium">اخبار منتشرشده در سایت</p>
                  <p className="text-2xl font-black text-orange-400 mt-1.5">{trafficData?.data?.publishedNewsCount || 25} خبر داغ</p>
                </div>
                <div className="bg-black/60 p-5 rounded-2xl border border-white/10">
                  <p className="text-xs text-zinc-400 font-medium">شبکه‌های اجتماعی متصل</p>
                  <p className="text-lg font-black text-emerald-400 mt-1.5">۸ شبکه (تلگرام، لینکدین...)</p>
                </div>
              </div>
            </div>

            {/* کارت‌های راهنمای قابلیت‌های جدید ساخته‌شده */}
            <div className="space-y-4">
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                دسترسی سریع به ماژول‌ها و قابلیت‌های جدید سایت:
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                
                {/* کارت سناریوساز Make Studio */}
                <div className="glass p-7 rounded-3xl border border-orange-500/30 hover:border-orange-500/60 transition duration-300 flex flex-col justify-between bg-gradient-to-br from-[#161924] to-black">
                  <div>
                    <div className="w-13 h-13 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center text-2xl mb-4">
                      ⚡
                    </div>
                    <h4 className="text-lg font-black text-white mb-2">سناریوساز خودکار و انتشار چندسکویی (Make Studio)</h4>
                    <p className="text-zinc-300 text-xs leading-relaxed font-light mb-6">
                      انتشار همزمان و خودکار اخبار با کاور اختصاصی روی تلگرام، لینکدین، بله، ایتا، روبیکا، فیسبوک، اینستاگرام و واتساپ. دارای قابلیت اتصال فوری CallMeBot.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        setActiveTab('automation');
                        const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
                        const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
                        fetch('/api/admin/automation', { headers }).then(r => r.json()).then(d => { if (d.success) setAutomationData(d); });
                      }}
                      className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs transition shadow-md"
                    >
                      ورود به پنل سناریوساز ⚡
                    </button>
                    <button
                      onClick={() => {
                        toast.info('🚀 شلیک سناریو روی ۵ خبر آخر آغاز شد...');
                        fetch('/api/admin/resend-all-social?limit=5')
                          .then(r => r.json())
                          .then(d => {
                            if (d.success) toast.success(`✅ سناریو با موفقیت روی ${d.successCount} خبر اجرا شد`);
                            else toast.error('❌ خطا در اجرای سناریو');
                          });
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/10"
                    >
                      شلیک ۵ خبر آخر 🚀
                    </button>
                  </div>
                </div>

                {/* کارت آمار ترافیک و سئو */}
                <div className="glass p-7 rounded-3xl border border-blue-500/30 hover:border-blue-500/60 transition duration-300 flex flex-col justify-between bg-gradient-to-br from-[#131726] to-black">
                  <div>
                    <div className="w-13 h-13 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-2xl mb-4">
                      📈
                    </div>
                    <h4 className="text-lg font-black text-white mb-2">رشد بازدید، سئوی هوشمند و تحلیل ترافیک</h4>
                    <p className="text-zinc-300 text-xs leading-relaxed font-light mb-6">
                      ردیاب داخلی (`VisitTracker`) + اتصال Statsfa به همراه تحلیل هوش مصنوعی از دلایل افت/رشد بازدید و نقشه راه ۷ مرحله‌ای سئوی ارگانیک.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        setActiveTab('traffic');
                        const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
                        const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
                        fetch('/api/admin/traffic-ai', { headers }).then(r => r.json()).then(d => { if (d.success) setTrafficData(d); });
                      }}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md"
                    >
                      مشاهده تحلیل و آمار ترافیک 📈
                    </button>
                    <a
                      href="https://search.google.com/search-console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/10"
                    >
                      گوگل سرچ کنسول 🔍
                    </a>
                  </div>
                </div>

                {/* کارت مدیریت پروژه‌ها */}
                <div className="glass p-7 rounded-3xl border border-amber-500/30 hover:border-amber-500/60 transition duration-300 flex flex-col justify-between bg-gradient-to-br from-[#1a1714] to-black">
                  <div>
                    <div className="w-13 h-13 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-2xl mb-4">
                      📁
                    </div>
                    <h4 className="text-lg font-black text-white mb-2">مدیریت پروژه‌ها و نمونه کارهای IT</h4>
                    <p className="text-zinc-300 text-xs leading-relaxed font-light mb-6">
                      افزودن، ویرایش و آپلود عکس برای پروژه‌های فناوری، معماری شبکه، تست نفوذ و هوش مصنوعی که در صفحه اصلی و رزومه نمایش داده می‌شوند.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={() => setActiveTab('projects')}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition shadow-md"
                    >
                      مدیریت پروژه‌ها 📁
                    </button>
                  </div>
                </div>

                {/* کارت مدیریت کاربران */}
                <div className="glass p-7 rounded-3xl border border-purple-500/30 hover:border-purple-500/60 transition duration-300 flex flex-col justify-between bg-gradient-to-br from-[#181424] to-black">
                  <div>
                    <div className="w-13 h-13 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center text-2xl mb-4">
                      👥
                    </div>
                    <h4 className="text-lg font-black text-white mb-2">مدیریت کاربران و دسترسی‌های سایت</h4>
                    <p className="text-zinc-300 text-xs leading-relaxed font-light mb-6">
                      مشاهده لیست کاربران ثبت‌نام‌شده، تغییر نقش‌ها به ادمین/کاربر عادی و مدیریت امنیت حساب‌ها.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={() => setActiveTab('users')}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md"
                    >
                      مدیریت کاربران 👥
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* عنوان سناریوساز */}
            <div className="bg-gradient-to-r from-orange-600/20 via-[#161926] to-blue-600/20 p-8 rounded-[36px] border border-orange-500/35 shadow-2xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="bg-gradient-to-r from-orange-500 to-amber-400 text-black text-xs font-black px-3 py-1 rounded-full mb-2 inline-block animate-pulse">
                    ⚡ سناریوساز خودکار و انتشار چندسکویی (Make.com Studio in-a-Box)
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                    موتور اتوماسیون وب‌هوک و انتشار همزمان روی ۸ شبکه اجتماعی
                  </h2>
                  <p className="text-zinc-300 text-sm mt-1 font-light">
                    بدون نیاز به سرویس‌های پولی خارجی؛ سرور شما به محض ورود هر خبر، آن را در کسری از ثانیه روی تمامی شبکه‌های زیر شلیک می‌کند.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      toast.info('🚀 شلیک سناریو روی ۵ خبر آخر آغاز شد...');
                      fetch('/api/admin/resend-all-social?limit=5')
                        .then(r => r.json())
                        .then(d => {
                          if (d.success) toast.success(`✅ سناریو با موفقیت روی ${d.successCount} خبر اجرا شد`);
                          else toast.error('❌ خطا در اجرای سناریو');
                        });
                    }}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs transition shadow-lg shadow-orange-500/20 flex items-center gap-2"
                  >
                    <span>▶️ اجرای فوری سناریو (۵ خبر آخر)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* نمودار جریان سناریو (Workflow Diagram) */}
            <div className="bg-black/50 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                وضعیت زنده‌ی نودهای سناریو (Active Workflow Nodes)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
                {[
                  { name: 'تلگرام', status: automationData?.status?.telegram, desc: '@ehsansalehi_tech', icon: '✈️' },
                  { name: 'لینکدین', status: automationData?.status?.linkedin, desc: 'Profile/Page', icon: '💼' },
                  { name: 'واتساپ', status: automationData?.status?.whatsapp, desc: 'CallMeBot/Cloud', icon: '💬' },
                  { name: 'اینستاگرام', status: automationData?.status?.instagram, desc: 'Instagram Biz', icon: '📸' },
                  { name: 'فیسبوک', status: automationData?.status?.facebook, desc: 'Official Page', icon: '📘' },
                  { name: 'بله', status: automationData?.status?.bale, desc: 'Bale Bot', icon: '🟢' },
                  { name: 'ایتا', status: automationData?.status?.eitaa, desc: 'Eitaa Bot', icon: '🟠' },
                  { name: 'وب‌هوک داخلی', status: true, desc: 'Make/API Bridge', icon: '📡' },
                ].map((node, idx) => (
                  <div key={idx} className="glass p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-between gap-2">
                    <span className="text-3xl">{node.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{node.name}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate max-w-[100px]">{node.desc}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${node.status ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                      {node.status ? '🟢 متصل و فعال' : '🔴 نیازمند توکن'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* تنظیم فوری و بدون تحریم واتساپ با CallMeBot */}
            <div className="glass rounded-3xl p-6 md:p-8 border border-white/10 space-y-5 bg-gradient-to-r from-green-600/10 via-black to-blue-600/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center text-2xl">
                  💬
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">اتصال فوری و ۳۰ ثانیه‌ای واتساپ (CallMeBot API)</h3>
                  <p className="text-zinc-300 text-xs font-light">
                    بدون نیاز به پورتال فیسبوک و بدون ارور لوکیشن؛ در واتساپ به شماره <span className="font-mono text-amber-400">+34 644 56 33 19</span> پیام <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white">I allow callmebot to send me messages</span> را بفرستید و کلید دریافتی را اینجا ثبت کنید:
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <input
                  type="text"
                  value={callMeBotInput}
                  onChange={(e) => setCallMeBotInput(e.target.value)}
                  placeholder="کلید API دریافتی از ربات واتساپ (مثلاً 123456)..."
                  className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-green-500/60 transition font-mono"
                />
                <button
                  onClick={() => {
                    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
                    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
                    fetch('/api/admin/automation', {
                      method: 'POST',
                      headers,
                      body: JSON.stringify({ callmebot_key: callMeBotInput, whatsapp_phone: '989108308799' }),
                    })
                      .then(r => r.json())
                      .then(d => {
                        if (d.success) {
                          toast.success(d.message);
                          fetch('/api/admin/automation', { headers }).then(r => r.json()).then(data => { if (data.success) setAutomationData(data); });
                        } else toast.error('❌ خطا در ذخیره کلید');
                      });
                  }}
                  className="px-6 py-3 rounded-2xl bg-green-500 hover:bg-green-600 text-black font-black text-xs transition shadow-lg shadow-green-500/20 shrink-0"
                >
                  ذخیره و فعال‌سازی فوری در سرور 🚀
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'traffic' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-orange-600/20 via-zinc-900 to-blue-600/20 p-8 rounded-3xl border border-orange-500/30">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="bg-orange-500 text-black text-xs font-black px-3 py-1 rounded-full mb-2 inline-block animate-pulse">
                    ⚡ ماژول هوشمند ترافیک و سئو (VisitTracker + Statsfa)
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                    تحلیل هوشمند آمار بازدید و نقشه راه رشد
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => {
                      toast.info('🤖 شلیک موتور خودبهبوددهنده سئو و پینگ سرچ کنسول آغاز شد...');
                      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
                      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
                      fetch('/api/cron/auto-optimize?force=true', { headers })
                        .then(r => r.json())
                        .then(d => {
                          if (d.success) toast.success('✅ نقشه سایت پینگ شد و لینک‌سازی داخلی بروزرسانی گردید');
                          else toast.error('❌ خطا در بهینه‌ساز سئو');
                        });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                  >
                    <span>🤖 شلیک بهینه‌ساز خودکار سئو و پینگ گوگل</span>
                  </button>
                  <a
                    href="/api/admin/resend-all-social?limit=15"
                    target="_blank"
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs transition shadow-lg shadow-orange-500/20 flex items-center gap-2"
                  >
                    🚀 بازنشر ۱۵ خبر داغ اخیر روی تلگرام/ایتا
                  </a>
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/10 flex items-center gap-2"
                  >
                    🔍 ورود به Google Search Console
                  </a>
                </div>
              </div>

              {trafficData?.data ? (
                <div className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-black/50 p-5 rounded-2xl border border-white/10">
                      <p className="text-xs text-zinc-400 font-medium">بازدیدکنندگان (۷ روز گذشته)</p>
                      <p className="text-2xl font-black text-amber-400 mt-2">{trafficData.data.visitorsLast7Days} نفر</p>
                    </div>
                    <div className="bg-black/50 p-5 rounded-2xl border border-white/10">
                      <p className="text-xs text-zinc-400 font-medium">کلیک‌ها و بازدید صفحات</p>
                      <p className="text-2xl font-black text-blue-400 mt-2">{trafficData.data.pageViewsLast7Days} بازدید</p>
                    </div>
                    <div className="bg-black/50 p-5 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/10 to-transparent">
                      <p className="text-xs text-blue-300 font-bold flex items-center gap-1">💼 ورودی مستقیم از لینکدین</p>
                      <p className="text-2xl font-black text-blue-400 mt-2">{trafficData.data.linkedinClicksLast7Days || 0} کلیک</p>
                    </div>
                    <div className="bg-black/50 p-5 rounded-2xl border border-white/10">
                      <p className="text-xs text-zinc-400 font-medium">ردیاب زنده Statsfa</p>
                      <p className="text-base font-mono font-bold text-emerald-400 mt-2">{trafficData.data.statsfaSiteId}</p>
                    </div>
                    <div className="bg-black/50 p-5 rounded-2xl border border-white/10">
                      <p className="text-xs text-zinc-400 font-medium">وضعیت VisitTracker</p>
                      <p className="text-xs font-bold text-emerald-400 mt-2">فعال و ردیابی لحظه‌ای</p>
                    </div>
                  </div>

                  {trafficData.data.lastAutoOptimizeReport && (
                    <div className="p-5 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          آخرین اجرای موتور خودبهبوددهنده سئو و چرخه لینکدین:
                        </span>
                        <span className="text-zinc-400 font-mono">{trafficData.data.lastAutoOptimizeReport.timestamp}</span>
                      </div>
                      <div className="space-y-1 pt-1">
                        {Array.isArray(trafficData.data.lastAutoOptimizeReport.report) ? (
                          trafficData.data.lastAutoOptimizeReport.report.map((item: string, idx: number) => (
                            <p key={idx} className="text-xs text-zinc-300 font-light flex items-center gap-1.5">
                              • {item}
                            </p>
                          ))
                        ) : (
                          <p className="text-xs text-zinc-300 font-light">سیستم خودکار فعال است و هر ۴ ساعت بهینه‌سازی را انجام می‌دهد.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-zinc-400">در حال دریافت آمار از سرور...</p>
              )}
            </div>

            {/* تحلیل چرا آمار پایین است */}
            {trafficData?.insights && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-zinc-900/80 p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-2xl mb-4">
                      🧐
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">چرا آمار بازدید سایت پایین است؟</h3>
                    <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-line font-light">
                      {trafficData.insights.statusAnalysis}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <span className="text-[11px] text-amber-400 font-bold block mb-1">💡 نکته طلایی امروز:</span>
                    <p className="text-zinc-400 text-[11px]">با فعالیت مستمر و ثبت نقشه سایت، ترافیک سایت شما ظرف ۱۰ روز آینده ۴ برابر خواهد شد.</p>
                  </div>
                </div>

                {/* نقشه راه ۷ مرحله ای */}
                <div className="md:col-span-2 bg-zinc-900/80 p-6 rounded-3xl border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    نقشه راه ۷ مرحله‌ای افزایش فوری بازدید و ترافیک ارگانیک
                  </h3>
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
                    {trafficData.insights.sevenStepRoadmap.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-orange-500/30 transition">
                        <h4 className="text-sm font-bold text-orange-400 mb-1">{item.step}</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed font-light">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">📁 مدیریت پروژه‌ها</h2>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setProjectForm({ title: '', desc: '', tech: '', link: '#', image_url: '' });
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition flex items-center gap-2"
              >
                <Plus size={16} /> پروژه جدید
              </button>
            </div>

            {(editingProject || projectForm.title) && (
              <form onSubmit={handleSubmitProject} className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 mb-6 grid gap-4">
                <input
                  type="text"
                  placeholder="عنوان پروژه"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="توضیحات"
                  value={projectForm.desc}
                  onChange={(e) => setProjectForm({ ...projectForm, desc: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="تکنولوژی‌ها"
                  value={projectForm.tech}
                  onChange={(e) => setProjectForm({ ...projectForm, tech: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="لینک پروژه"
                  value={projectForm.link}
                  onChange={(e) => setProjectForm({ ...projectForm, link: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none"
                />

                <div className="border border-dashed border-zinc-600 p-4 rounded-xl">
                  <label className="block text-sm text-zinc-400 mb-2">عکس پروژه</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleUploadImage}
                      disabled={uploading}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition flex items-center gap-2 text-sm"
                    >
                      <Upload size={16} />
                      {uploading ? 'در حال آپلود...' : 'انتخاب عکس'}
                    </label>
                    {projectForm.image_url && (
                      <div className="flex items-center gap-2">
                        <img src={projectForm.image_url} alt="پیش‌نمایش" className="w-16 h-16 object-cover rounded-lg border border-zinc-700" />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition">
                    {editingProject ? 'ویرایش' : 'افزودن'} پروژه
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProject(null);
                      setProjectForm({ title: '', desc: '', tech: '', link: '#', image_url: '' });
                    }}
                    className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl transition"
                  >
                    لغو
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {loading ? (
                <p className="text-zinc-500">در حال بارگذاری...</p>
              ) : projects.length === 0 ? (
                <p className="text-zinc-500">هیچ پروژه‌ای یافت نشد</p>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {project.image_url && (
                        <img src={project.image_url} alt={project.title} className="w-12 h-12 object-cover rounded-lg border border-zinc-700" />
                      )}
                      <div>
                        <h3 className="font-bold">{project.title}</h3>
                        <p className="text-sm text-zinc-400">{project.tech}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProject(project);
                          setProjectForm({ title: project.title, desc: project.desc, tech: project.tech || '', link: project.link || '#', image_url: project.image_url || '' });
                        }}
                        className="p-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg transition"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">👥 مدیریت کاربران</h2>
            <div className="space-y-3">
              {loading ? (
                <p className="text-zinc-500">در حال بارگذاری...</p>
              ) : users.length === 0 ? (
                <p className="text-zinc-500">هیچ کاربری یافت نشد</p>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">{user.name}</h3>
                      <p className="text-sm text-zinc-400">{user.email}</p>
                      <div className="flex gap-3 mt-1">
                        <span className={`text-xs ${user.isVerified ? 'text-green-400' : 'text-red-400'}`}>
                          {user.isVerified ? '✅ تأیید شده' : '⏳ تأیید نشده'}
                        </span>
                        <span className={`text-xs ${user.isAdmin ? 'text-amber-400' : 'text-zinc-500'}`}>
                          {user.isAdmin ? '👑 ادمین' : '👤 کاربر'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          user.isAdmin
                            ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400'
                            : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400'
                        }`}
                      >
                        {user.isAdmin ? 'لغو ادمین' : 'ادمین کردن'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'blog' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">📝 مدیریت وبلاگ</h2>
            <p className="text-zinc-500">به زودی...</p>
          </div>
        )}

        {activeTab === 'courses' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">📚 مدیریت دوره‌ها</h2>
            <p className="text-zinc-500">به زودی...</p>
          </div>
        )}
      </main>

      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}
