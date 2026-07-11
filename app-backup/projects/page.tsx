'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Project {
  id: number;
  title: string;
  desc: string;
  tech: string;
  link: string;
  image_url: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data.success) setProjects(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredProjects = filter
    ? projects.filter(p => p.tech.toLowerCase().includes(filter.toLowerCase()))
    : projects;

  const allTechs = Array.from(new Set(projects.map(p => p.tech).filter(Boolean)));

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent mb-4">
          همه پروژه‌ها
        </h1>
        <p className="text-center text-zinc-400 mb-10">برخی از پروژه‌های شاخص من</p>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-full text-sm border ${!filter ? 'border-orange-500 text-orange-500' : 'border-white/10 text-zinc-400 hover:border-orange-500/50'}`}
          >
            همه
          </button>
          {allTechs.map((tech) => (
            <button
              key={tech}
              onClick={() => setFilter(tech)}
              className={`px-4 py-2 rounded-full text-sm border ${filter === tech ? 'border-orange-500 text-orange-500' : 'border-white/10 text-zinc-400 hover:border-orange-500/50'}`}
            >
              {tech}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-zinc-500">در حال بارگذاری...</p>
        ) : filteredProjects.length === 0 ? (
          <p className="text-center text-zinc-500">هیچ پروژه‌ای یافت نشد.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <div key={project.id} className="glass rounded-xl overflow-hidden border border-white/10 hover:border-orange-500/30 transition-all duration-300 hover:scale-[1.02]">
                <div className="h-48 overflow-hidden bg-zinc-800 relative">
                  {project.image_url ? (
                    <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">💼</div>
                  )}
                </div>
                <div className="p-5 text-right">
                  <h3 className="text-xl font-bold mb-1">{project.title}</h3>
                  <p className="text-zinc-400 text-sm mb-3">{project.desc}</p>
                  <div className="text-xs text-orange-400 font-mono mb-3">{project.tech}</div>
                  <Link href={`/projects/${project.id}`} className="text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1 text-sm">
                    جزئیات <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
