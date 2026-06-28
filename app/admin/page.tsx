'use client';

import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { 
  Users, FileText, FolderOpen, ShoppingBag, 
  Settings, BarChart3, Plus, Edit, Trash2, Eye,
  CheckCircle, XCircle, Clock, Search
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

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  status: 'draft' | 'published' | 'archived';
  views: number;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url: string;
  file_path: string;
  created_at: string;
}

interface DashboardStats {
  totalUsers: number;
  totalProjects: number;
  totalPosts: number;
  totalSales: number;
  revenue: number;
}

// ============ COMPONENTS ============
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
      if (res.ok) {
        toast.success('ورود موفق ✅');
        onLogin();
      } else {
        toast.error('نام کاربری یا رمز عبور اشتباه است');
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

// ============ MAIN ADMIN PAGE ============
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'blog' | 'users' | 'courses' | 'settings'>('dashboard');
  const [loading, setLoading] = useState(false);
  
  // داده‌ها
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProjects: 0,
    totalPosts: 0,
    totalSales: 0,
    revenue: 0,
  });

  // فرم پروژه
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({ title: '', desc: '', tech: '', link: '#', image_url: '' });

  // فرم وبلاگ
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postForm, setPostForm] = useState({ title: '', slug: '', excerpt: '', content: '', image_url: '', status: 'draft' as const });

  // ============ FETCH DATA ============
  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, postsRes, usersRes, coursesRes, statsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/blog'),
        fetch('/api/admin/users'),
        fetch('/api/courses'),
        fetch('/api/admin/stats'),
      ]);
      
      const projectsData = await projectsRes.json();
      const postsData = await postsRes.json();
      const usersData = await usersRes.json();
      const coursesData = await coursesRes.json();
      const statsData = await statsRes.json();
      
      if (projectsData.success) setProjects(projectsData.data);
      if (postsData.success) setPosts(postsData.data);
      if (usersData.success) setUsers(usersData.data);
      if (coursesData.success) setCourses(coursesData.data);
      if (statsData.success) setStats(statsData.data);
    } catch (error) {
      toast.error('خطا در دریافت داده‌ها');
    }
    setLoading(false);
  };

  // ============ PROJECTS CRUD ============
  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
    const method = editingProject ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm),
      });
      if (res.ok) {
        toast.success(editingProject ? 'پروژه ویرایش شد ✅' : 'پروژه اضافه شد ✅');
        setProjectForm({ title: '', desc: '', tech: '', link: '#', image_url: '' });
        setEditingProject(null);
        fetchData();
      } else {
        toast.error('خطا در ذخیره');
      }
    } catch (error) {
      toast.error('خطا');
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('آیا از حذف این پروژه مطمئن هستید؟')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
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

  // ============ BLOG CRUD ============
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPost ? `/api/blog/${editingPost.id}` : '/api/blog';
    const method = editingPost ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postForm),
      });
      if (res.ok) {
        toast.success(editingPost ? 'پست ویرایش شد ✅' : 'پست اضافه شد ✅');
        setPostForm({ title: '', slug: '', excerpt: '', content: '', image_url: '', status: 'draft' });
        setEditingPost(null);
        fetchData();
      } else {
        toast.error('خطا در ذخیره');
      }
    } catch (error) {
      toast.error('خطا');
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('آیا از حذف این پست مطمئن هستید؟')) return;
    try {
      const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('پست حذف شد');
        fetchData();
      } else {
        toast.error('خطا در حذف');
      }
    } catch (error) {
      toast.error('خطا');
    }
  };

  // ============ USERS MANAGEMENT ============
  const handleToggleAdmin = async (userId: number, currentIsAdmin: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
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

  // ============ RENDER ============
  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'داشبورد', icon: BarChart3 },
    { id: 'projects', label: 'پروژه‌ها', icon: FolderOpen },
    { id: 'blog', label: 'وبلاگ', icon: FileText },
    { id: 'users', label: 'کاربران', icon: Users },
    { id: 'courses', label: 'دوره‌ها', icon: ShoppingBag },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-vazir" dir="rtl">
      {/* هدر */}
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">
            پنل مدیریت
          </h1>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition text-sm"
          >
            خروج
          </button>
        </div>
      </header>

      {/* منو */}
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

      {/* محتوا */}
      <main className="max-w-7xl mx-auto p-4">
        {/* ===== DASHBOARD ===== */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">داشبورد</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="کاربران" value={stats.totalUsers} color="blue" />
              <StatCard icon={FolderOpen} label="پروژه‌ها" value={stats.totalProjects} color="amber" />
              <StatCard icon={FileText} label="پست‌ها" value={stats.totalPosts} color="green" />
              <StatCard icon={ShoppingBag} label="فروش" value={stats.totalSales} color="purple" />
            </div>
            <div className="mt-6 p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
              <h3 className="text-xl font-bold mb-2">💰 درآمد کل</h3>
              <p className="text-3xl font-bold text-green-400">{stats.revenue.toLocaleString()} تومان</p>
            </div>
          </div>
        )}

        {/* ===== PROJECTS ===== */}
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

            {/* فرم پروژه */}
            {(editingProject || projectForm.title) && (
              <form onSubmit={handleSubmitProject} className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 mb-6 grid gap-4">
                <input
                  type="text"
                  placeholder="عنوان پروژه"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  required
                />
                <input
                  type="text"
                  placeholder="توضیحات"
                  value={projectForm.desc}
                  onChange={(e) => setProjectForm({ ...projectForm, desc: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  required
                />
                <input
                  type="text"
                  placeholder="تکنولوژی‌ها (مثل: React, Next.js)"
                  value={projectForm.tech}
                  onChange={(e) => setProjectForm({ ...projectForm, tech: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none transition"
                />
                <input
                  type="text"
                  placeholder="لینک پروژه"
                  value={projectForm.link}
                  onChange={(e) => setProjectForm({ ...projectForm, link: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none transition"
                />
                <input
                  type="text"
                  placeholder="آدرس عکس"
                  value={projectForm.image_url}
                  onChange={(e) => setProjectForm({ ...projectForm, image_url: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none transition"
                />
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

            {/* لیست پروژه‌ها */}
            <div className="space-y-3">
              {loading ? (
                <p className="text-zinc-500">در حال بارگذاری...</p>
              ) : projects.length === 0 ? (
                <p className="text-zinc-500">هیچ پروژه‌ای یافت نشد</p>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">{project.title}</h3>
                      <p className="text-sm text-zinc-400">{project.tech}</p>
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

        {/* ===== BLOG ===== */}
        {activeTab === 'blog' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">📝 مدیریت وبلاگ</h2>
              <button
                onClick={() => {
                  setEditingPost(null);
                  setPostForm({ title: '', slug: '', excerpt: '', content: '', image_url: '', status: 'draft' });
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition flex items-center gap-2"
              >
                <Plus size={16} /> پست جدید
              </button>
            </div>

            {/* فرم پست */}
            {(editingPost || postForm.title) && (
              <form onSubmit={handleSubmitPost} className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 mb-6 grid gap-4">
                <input
                  type="text"
                  placeholder="عنوان پست"
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  required
                />
                <input
                  type="text"
                  placeholder="اسلاگ (مثال: my-first-post)"
                  value={postForm.slug}
                  onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none transition"
                />
                <input
                  type="text"
                  placeholder="خلاصه"
                  value={postForm.excerpt}
                  onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none transition"
                />
                <textarea
                  placeholder="متن کامل پست (HTML مجاز)"
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none transition min-h-[200px]"
                />
                <input
                  type="text"
                  placeholder="آدرس عکس"
                  value={postForm.image_url}
                  onChange={(e) => setPostForm({ ...postForm, image_url: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none transition"
                />
                <select
                  value={postForm.status}
                  onChange={(e) => setPostForm({ ...postForm, status: e.target.value as any })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:border-blue-500 focus:outline-none transition"
                >
                  <option value="draft">پیش‌نویس</option>
                  <option value="published">منتشر شده</option>
                  <option value="archived">بایگانی</option>
                </select>
                <div className="flex gap-3">
                  <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition">
                    {editingPost ? 'ویرایش' : 'افزودن'} پست
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(null);
                      setPostForm({ title: '', slug: '', excerpt: '', content: '', image_url: '', status: 'draft' });
                    }}
                    className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl transition"
                  >
                    لغو
                  </button>
                </div>
              </form>
            )}

            {/* لیست پست‌ها */}
            <div className="space-y-3">
              {loading ? (
                <p className="text-zinc-500">در حال بارگذاری...</p>
              ) : posts.length === 0 ? (
                <p className="text-zinc-500">هیچ پستی یافت نشد</p>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">{post.title}</h3>
                      <p className="text-sm text-zinc-400">{post.status === 'published' ? '✅ منتشر شده' : post.status === 'draft' ? '📝 پیش‌نویس' : '📦 بایگانی'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPost(post);
                          setPostForm({ title: post.title, slug: post.slug, excerpt: post.excerpt || '', content: post.content, image_url: post.image_url || '', status: post.status });
                        }}
                        className="p-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg transition"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
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

        {/* ===== USERS ===== */}
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

        {/* ===== COURSES ===== */}
        {activeTab === 'courses' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">📚 مدیریت دوره‌ها</h2>
            <p className="text-zinc-500">به زودی...</p>
          </div>
        )}

        {/* ===== SETTINGS ===== */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">⚙️ تنظیمات</h2>
            <p className="text-zinc-500">به زودی...</p>
          </div>
        )}
      </main>

      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}

// ============ STAT CARD COMPONENT ============
const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: 'blue' | 'amber' | 'green' | 'purple' }) => {
  const colors = {
    blue: 'bg-blue-600/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-600/10 text-amber-400 border-amber-500/20',
    green: 'bg-green-600/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-600/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className={`p-4 rounded-2xl border ${colors[color]} backdrop-blur-sm`}>
      <div className="flex items-center gap-2">
        <Icon size={18} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
};
