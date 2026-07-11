'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Comment {
  id: number;
  name: string;
  content: string;
  created_at: string;
}

interface NewsCommentsProps {
  newsId: number;
}

export default function NewsComments({ newsId }: NewsCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', content: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // دریافت نظرات
  useEffect(() => {
    fetch(`/api/news/comments?newsId=${newsId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setComments(data.comments);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [newsId]);

  // ولیدیشن
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 2) newErrors.name = 'نام حداقل ۲ کاراکتر';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'ایمیل معتبر نیست';
    if (!form.content.trim() || form.content.length < 3) newErrors.content = 'متن نظر حداقل ۳ کاراکتر';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/news/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsId, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود ✅');
        setForm({ name: '', email: '', content: '' });
        // بارگذاری مجدد نظرات
        const reload = await fetch(`/api/news/comments?newsId=${newsId}`);
        const reloadData = await reload.json();
        if (reloadData.success) setComments(reloadData.comments);
      } else {
        toast.error(data.error || 'خطا در ثبت نظر');
      }
    } catch {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <div className="text-center text-zinc-400 py-8">در حال بارگذاری نظرات...</div>;

  return (
    <div className="mt-10 pt-6 border-t border-white/10">
      <h3 className="text-xl font-bold mb-6">💬 نظرات ({comments.length})</h3>
      
      {/* لیست نظرات */}
      {comments.length === 0 ? (
        <p className="text-zinc-400 text-sm">هنوز نظری ثبت نشده است. اولین نفر باشید!</p>
      ) : (
        <div className="space-y-4 mb-8">
          {comments.map((comment) => (
            <div key={comment.id} className="glass p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-bold text-orange-400">{comment.name}</span>
                <span className="text-xs text-zinc-500">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* فرم ثبت نظر */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <h4 className="font-bold text-lg text-orange-400">نظر خود را بنویسید</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="نام و نام خانوادگی"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:border-orange-500/50 outline-none transition-colors text-sm"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <input
              type="email"
              placeholder="آدرس ایمیل"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:border-orange-500/50 outline-none transition-colors text-sm"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>
        <div>
          <textarea
            rows={4}
            placeholder="متن نظر شما..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:border-orange-500/50 outline-none transition-colors resize-none text-sm"
          />
          {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content}</p>}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm"
        >
          {submitting ? 'در حال ثبت...' : 'ارسال نظر'}
        </button>
        <p className="text-xs text-zinc-500">* نظر شما پس از تأیید نمایش داده می‌شود.</p>
      </form>
    </div>
  );
}
