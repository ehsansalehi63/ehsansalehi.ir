'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useI18n } from './I18nProvider';
import { MessageSquare, Send, User, Clock, CheckCircle } from 'lucide-react';

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
  const { lang } = useI18n();
  const isEn = lang === 'en';

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', content: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/news/comments?newsId=${newsId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setComments(data.comments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [newsId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 2) newErrors.name = isEn ? 'Name must be at least 2 characters' : 'نام حداقل ۲ کاراکتر';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = isEn ? 'Valid email is required' : 'ایمیل معتبر نیست';
    if (!form.content.trim() || form.content.length < 3) newErrors.content = isEn ? 'Comment must be at least 3 characters' : 'متن نظر حداقل ۳ کاراکتر';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/news/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, newsId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(isEn ? 'Comment posted successfully! ✅' : 'نظر شما با موفقیت ثبت شد ✅');
        setForm({ name: '', email: '', content: '' });
        setErrors({});
        fetch(`/api/news/comments?newsId=${newsId}`)
          .then(r => r.json())
          .then(d => { if (d.success) setComments(d.comments || []); });
      } else {
        toast.error(data.error || (isEn ? 'Error submitting comment' : 'خطا در ثبت نظر'));
      }
    } catch {
      toast.error(isEn ? 'Network error' : 'خطا در ارتباط با سرور');
    }
    setSubmitting(false);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return isEn
      ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="space-y-12 font-vazir" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Comments Form Box */}
      <div className="bg-gradient-to-b from-[#161924] to-[#0e1017] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
        <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <MessageSquare size={20} className="text-orange-400" />
          <span>{isEn ? 'Leave a Technical Comment or Question' : 'ثبت دیدگاه یا پرسش فنی'}</span>
        </h4>
        <p className="text-zinc-400 text-xs sm:text-sm mb-6 font-light">
          {isEn ? 'Share your thoughts, insights, or technical questions regarding this article.' : 'نظرات، تحلیل‌ها یا پرسش‌های تخصصی خود را پیرامون این مقاله با ما و دیگر متخصصان در میان بگذارید.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                {isEn ? 'Full Name' : 'نام و نام خانوادگی'} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={isEn ? 'e.g. John Doe' : 'مثلاً مهندس رضایی'}
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/60 transition"
              />
              {errors.name && <span className="text-red-400 text-[11px] mt-1 block font-bold">{errors.name}</span>}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                {isEn ? 'Email Address' : 'آدرس ایمیل'} <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={isEn ? 'name@company.com' : 'example@domain.com'}
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/60 transition"
              />
              {errors.email && <span className="text-red-400 text-[11px] mt-1 block font-bold">{errors.email}</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              {isEn ? 'Comment Content' : 'متن دیدگاه شما'} <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={isEn ? 'Write your analysis or question here...' : 'متن دیدگاه یا تحلیل تخصصی خود را بنویسید...'}
              className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/60 transition resize-y"
            />
            {errors.content && <span className="text-red-400 text-[11px] mt-1 block font-bold">{errors.content}</span>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold text-xs sm:text-sm transition-all duration-300 shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            <Send size={15} className={isEn ? 'rotate-0' : '-rotate-90'} />
            <span>{submitting ? (isEn ? 'Posting Comment...' : 'در حال ثبت دیدگاه...') : (isEn ? 'Post Comment 🚀' : 'ثبت و انتشار دیدگاه 🚀')}</span>
          </button>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        <h4 className="text-lg font-extrabold text-white flex items-center gap-2">
          <span>{isEn ? `Published Comments (${comments.length})` : `دیدگاه‌های منتشرشده (${comments.length})`}</span>
        </h4>

        {loading ? (
          <div className="h-40 bg-zinc-800/40 rounded-3xl animate-pulse flex items-center justify-center text-zinc-500 text-sm">
            {isEn ? 'Loading comments...' : 'در حال بارگذاری دیدگاه‌ها...'}
          </div>
        ) : comments.length === 0 ? (
          <div className="bg-black/40 border border-white/5 rounded-3xl p-8 text-center text-zinc-500 text-sm font-light">
            {isEn ? 'No comments published yet. Be the first to share your thoughts!' : 'هنوز دیدگاهی برای این مقاله ثبت نشده است. اولین نفری باشید که نظر خود را به اشتراک می‌گذارید!'}
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-black/50 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                      <User size={16} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">{comment.name}</h5>
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <Clock size={11} /> {formatDate(comment.created_at)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {isEn ? 'Verified Member' : 'کاربر تأییدشده'}
                  </span>
                </div>
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-light pl-11">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
