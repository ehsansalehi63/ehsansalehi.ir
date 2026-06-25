'use client';

import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';

interface Project {
  id: number;
  title: string;
  desc: string;
  tech: string;
  link: string;
  image_url: string | null;
  createdAt: string;
}

interface Message {
  id: number;
  name: string;
  email: string;
  message: string;
  read: boolean;
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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'messages' | 'users'>('projects');
  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    tech: '',
    link: '#',
    image_url: '',
  });

  // لاگین
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        toast.success('ورود موفق ✅');
        fetchData();
      } else {
        toast.error('نام کاربری یا رمز عبور اشتباه است');
      }
    } catch (error) {
      toast.error('خطا در ورود');
    }
  };

  // دریافت داده‌ها
  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, messagesRes, usersRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/messages'),
        fetch('/api/admin/users'),
      ]);
      const projectsData = await projectsRes.json();
      const messagesData = await messagesRes.json();
      const usersData = await usersRes.json();
      if (projectsData.success) setProjects(projectsData.data);
      if (messagesData.success) setMessages(messagesData.data);
      if (usersData.success) setUsers(usersData.data);
    } catch (error) {
      toast.error('خطا در دریافت داده‌ها');
    }
    setLoading(false);
  };

  // ذخیره پروژه
  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const project = editingProject ? { ...formData, _id: editingProject.id } : formData;
    const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
    const method = editingProject ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (res.ok) {
        toast.success(editingProject ? 'پروژه ویرایش شد ✅' : 'پروژه اضافه شد ✅');
        setFormData({ title: '', desc: '', tech: '', link: '#', image_url: '' });
        setEditingProject(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'خطا در ذخیره پروژه');
      }
    } catch (error) {
      toast.error('خطا');
    }
  };

  // حذف پروژه
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

  // ویرایش پروژه
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      desc: project.desc,
      tech: project.tech || '',
      link: project.link || '#',
      image_url: project.image_url || '',
    });
  };

  // تغییر نقش کاربر (ادمین/عادی)
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

  // حذف کاربر
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    toast.success('خروج موفق');
  };

  // صفحه لاگین
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        color: 'white',
        direction: 'rtl',
        fontFamily: 'Vazirmatn, sans-serif',
      }}>
        <form onSubmit={handleLogin} style={{
          backgroundColor: '#18181b',
          padding: '40px',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '24px' }}>پنل مدیریت</h1>
          <input
            type="text"
            placeholder="نام کاربری"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: '16px',
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: 'white',
            }}
          />
          <input
            type="password"
            placeholder="رمز عبور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: '24px',
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: 'white',
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              borderRadius: '8px',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ورود
          </button>
        </form>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  // پنل مدیریت
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: 'white',
      direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>پنل مدیریت</h1>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              borderRadius: '8px',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            خروج
          </button>
        </div>

        {/* تب‌ها */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          {[
            { key: 'projects', label: '📁 پروژه‌ها' },
            { key: 'messages', label: '✉️ پیام‌ها' },
            { key: 'users', label: '👥 کاربران' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === tab.key ? '#2563eb' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#a3a3a3',
                cursor: 'pointer',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* تب پروژه‌ها */}
        {activeTab === 'projects' && (
          <>
            {/* فرم افزودن/ویرایش پروژه */}
            <div style={{
              backgroundColor: '#18181b',
              padding: '24px',
              borderRadius: '16px',
              marginBottom: '40px',
            }}>
              <h2 style={{ marginBottom: '16px' }}>{editingProject ? 'ویرایش پروژه' : 'پروژه جدید'}</h2>
              <form onSubmit={handleSubmitProject} style={{ display: 'grid', gap: '16px' }}>
                <input
                  type="text"
                  placeholder="عنوان پروژه"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white' }}
                  required
                />
                <input
                  type="text"
                  placeholder="توضیحات (کوتاه)"
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white' }}
                  required
                />
                <input
                  type="text"
                  placeholder="تکنولوژی‌ها (مثل: React, Next.js)"
                  value={formData.tech}
                  onChange={(e) => setFormData({ ...formData, tech: e.target.value })}
                  style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white' }}
                />
                <input
                  type="text"
                  placeholder="لینک پروژه (یا #)"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white' }}
                />
                <input
                  type="text"
                  placeholder="آدرس عکس (مثلاً /images/projects/network.jpg)"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white' }}
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#2563eb',
                      borderRadius: '8px',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    {editingProject ? 'ویرایش' : 'افزودن'} پروژه
                  </button>
                  {editingProject && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProject(null);
                        setFormData({ title: '', desc: '', tech: '', link: '#', image_url: '' });
                      }}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#737373',
                        borderRadius: '8px',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      لغو
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* لیست پروژه‌ها */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>📁 پروژه‌ها ({projects.length})</h2>
              {loading ? (
                <p style={{ color: '#737373' }}>در حال بارگذاری...</p>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {projects.map((project) => (
                    <div key={project.id} style={{
                      backgroundColor: '#18181b',
                      padding: '16px 20px',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {project.image_url && (
                          <img src={project.image_url} alt={project.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                        )}
                        <div>
                          <h3 style={{ fontWeight: 'bold' }}>{project.title}</h3>
                          <p style={{ color: '#a3a3a3', fontSize: '14px' }}>{project.tech}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleEditProject(project)}
                          style={{
                            padding: '6px 16px',
                            backgroundColor: '#f59e0b',
                            borderRadius: '6px',
                            border: 'none',
                            color: 'black',
                            cursor: 'pointer',
                          }}
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          style={{
                            padding: '6px 16px',
                            backgroundColor: '#dc2626',
                            borderRadius: '6px',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* تب پیام‌ها */}
        {activeTab === 'messages' && (
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>✉️ پیام‌های تماس ({messages.length})</h2>
            {loading ? (
              <p style={{ color: '#737373' }}>در حال بارگذاری...</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{
                    backgroundColor: '#18181b',
                    padding: '16px 20px',
                    borderRadius: '12px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{msg.name}</strong> - <span style={{ color: '#60a5fa' }}>{msg.email}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#737373' }}>
                        {new Date(msg.createdAt).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                    <p style={{ color: '#d4d4d4', marginTop: '8px' }}>{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* تب کاربران */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>👥 کاربران ({users.length})</h2>
            {loading ? (
              <p style={{ color: '#737373' }}>در حال بارگذاری...</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {users.map((user) => (
                  <div key={user.id} style={{
                    backgroundColor: '#18181b',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}>
                    <div>
                      <h3 style={{ fontWeight: 'bold' }}>{user.name}</h3>
                      <p style={{ color: '#a3a3a3', fontSize: '14px' }}>{user.email}</p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '12px', color: user.isVerified ? '#22c55e' : '#ef4444' }}>
                          {user.isVerified ? '✅ تأیید شده' : '⏳ تأیید نشده'}
                        </span>
                        <span style={{ fontSize: '12px', color: user.isAdmin ? '#f59e0b' : '#737373' }}>
                          {user.isAdmin ? '👑 ادمین' : '👤 کاربر'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                        style={{
                          padding: '6px 16px',
                          backgroundColor: user.isAdmin ? '#dc2626' : '#2563eb',
                          borderRadius: '6px',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        {user.isAdmin ? 'لغو ادمین' : 'ادمین کردن'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        style={{
                          padding: '6px 16px',
                          backgroundColor: '#dc2626',
                          borderRadius: '6px',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
