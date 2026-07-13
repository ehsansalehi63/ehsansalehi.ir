'use client';

import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { 
  Users, FileText, FolderOpen, ShoppingBag, 
  BarChart3, Plus, Edit, Trash2, Upload, X
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
        <p className="text-zinc-500 text-center mb-8">احسان صالحی رباطی</p>
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'blog' | 'users' | 'courses'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, totalPosts: 0, totalSales: 0, revenue: 0 });
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
      const [projectsRes, usersRes, statsRes] = await Promise.all([
        fetch('/api/projects', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/stats', { headers }),
      ]);
      const projectsData = await projectsRes.json();
      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      if (projectsData.success) setProjects(projectsData.data);
      if (usersData.success) setUsers(usersData.data);
      if (statsData.success) setStats(statsData.data);
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
              onClick={() => setActiveTab(tab.id as any)}
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
          <div>
            <h2 className="text-2xl font-bold mb-6">داشبورد</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="کاربران" value={stats.totalUsers} color="blue" />
              <StatCard label="پروژه‌ها" value={stats.totalProjects} color="amber" />
              <StatCard label="فروش" value={stats.totalSales} color="purple" />
            </div>
            <div className="mt-6 p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
              <h3 className="text-xl font-bold mb-2">💰 درآمد کل</h3>
              <p className="text-3xl font-bold text-green-400">{stats.revenue.toLocaleString()} تومان</p>
            </div>
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
