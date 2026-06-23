'use client';

import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';

interface Project {
  _id: string;
  title: string;
  desc: string;
  tech: string;
  link: string;
}

interface Message {
  _id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({ title: '', desc: '', tech: '', link: '#' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, messagesRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/messages'),
      ]);
      const projectsData = await projectsRes.json();
      const messagesData = await messagesRes.json();
      if (projectsData.success) setProjects(projectsData.data);
      if (messagesData.success) setMessages(messagesData.data);
    } catch (error) {
      toast.error('خطا در دریافت داده‌ها');
    }
    setLoading(false);
  };

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

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const project = editingProject ? { ...newProject, _id: editingProject._id } : newProject;
    const url = editingProject ? `/api/projects/${editingProject._id}` : '/api/projects';
    const method = editingProject ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (res.ok) {
        toast.success(editingProject ? 'پروژه ویرایش شد ✅' : 'پروژه اضافه شد ✅');
        setNewProject({ title: '', desc: '', tech: '', link: '#' });
        setEditingProject(null);
        fetchData();
      } else {
        toast.error('خطا در ذخیره پروژه');
      }
    } catch (error) {
      toast.error('خطا');
    }
  };

  const handleDeleteProject = async (id: string) => {
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

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProject({ title: project.title, desc: project.desc, tech: project.tech, link: project.link });
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>پنل مدیریت</h1>
          <button
            onClick={() => setIsAuthenticated(false)}
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
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white' }}
              required
            />
            <input
              type="text"
              placeholder="توضیحات (کوتاه)"
              value={newProject.desc}
              onChange={(e) => setNewProject({ ...newProject, desc: e.target.value })}
              style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white' }}
              required
            />
            <input
              type="text"
              placeholder="تکنولوژی‌ها (مثل: React, Next.js)"
              value={newProject.tech}
              onChange={(e) => setNewProject({ ...newProject, tech: e.target.value })}
              style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white' }}
              required
            />
            <input
              type="text"
              placeholder="لینک پروژه (یا #)"
              value={newProject.link}
              onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
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
                    setNewProject({ title: '', desc: '', tech: '', link: '#' });
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

        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>📁 پروژه‌ها ({projects.length})</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {projects.map((project) => (
              <div key={project._id} style={{
                backgroundColor: '#18181b',
                padding: '16px 20px',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <h3 style={{ fontWeight: 'bold' }}>{project.title}</h3>
                  <p style={{ color: '#a3a3a3', fontSize: '14px' }}>{project.tech}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
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
                    onClick={() => handleDeleteProject(project._id)}
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
        </div>

        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>✉️ پیام‌های تماس ({messages.length})</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {messages.map((msg) => (
              <div key={msg._id} style={{
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
        </div>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
