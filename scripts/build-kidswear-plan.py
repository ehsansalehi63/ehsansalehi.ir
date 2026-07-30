#!/usr/bin/env python3
"""ساخت یک فایل HTML واحد (RTL فارسی) از همه اسناد پلن فروشگاه پوشاک کودک."""
import os
import re
import markdown

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "kidswear")
OUT = os.path.join(BASE, "PLAN.html")

DOCS = [
    ("README.md", "خلاصه و نقشه کلی"),
    ("01-business-plan.md", "۱ — بیزینس‌پلن"),
    ("02-technical-architecture.md", "۲ — معماری فنی"),
    ("03-automation-pipeline.md", "۳ — پایپ‌لاین اتوماسیون"),
    ("04-social-media-plan.md", "۴ — شبکه‌های اجتماعی"),
    ("05-seo-backlink.md", "۵ — سئو و بک‌لینک"),
    ("06-ads-and-growth.md", "۶ — تبلیغات و رشد"),
    ("07-roadmap-and-kpi.md", "۷ — نقشه راه و KPI"),
    ("08-integrations-and-env.md", "۸ — سرویس‌ها و کلیدها"),
    ("09-data-model.sql", "۹ — مدل داده (SQL)"),
    ("10-decisions-and-questions.md", "۱۰ — تصمیم‌های باز"),
]

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;900&display=swap');
:root{
  --bg:#0b1020; --panel:#121a33; --panel2:#0f1730; --line:#233158;
  --txt:#e8edf9; --muted:#93a2c7; --accent:#5b8cff; --accent2:#22d3a5;
  --warn:#ffb020; --danger:#ff5a7a;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  background:var(--bg); color:var(--txt);
  font-family:'Vazirmatn',system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;
  direction:rtl; text-align:right; line-height:2; font-size:16px;
}
.wrap{display:flex; max-width:1500px; margin:0 auto; gap:0}
/* ---------- Sidebar ---------- */
nav{
  position:sticky; top:0; height:100vh; overflow-y:auto;
  width:290px; flex:0 0 290px; padding:26px 18px;
  background:linear-gradient(180deg,#0d1428,#0b1020);
  border-left:1px solid var(--line);
}
nav h2{font-size:15px; color:var(--muted); margin:0 0 16px; font-weight:500; letter-spacing:.3px}
nav .brand{font-size:19px; font-weight:900; color:#fff; margin-bottom:4px; line-height:1.6}
nav .sub{font-size:12px; color:var(--muted); margin-bottom:22px}
nav a{
  display:block; padding:10px 13px; margin:5px 0; border-radius:11px;
  color:var(--muted); text-decoration:none; font-size:14.5px;
  transition:.18s; border:1px solid transparent;
}
nav a:hover{background:var(--panel); color:#fff; border-color:var(--line)}
nav a.active{background:linear-gradient(90deg,rgba(91,140,255,.22),transparent); color:#fff; border-color:var(--accent)}
/* ---------- Main ---------- */
main{flex:1; padding:36px 44px 120px; min-width:0}
.hero{
  background:linear-gradient(135deg,#16255c,#0f1730 60%);
  border:1px solid var(--line); border-radius:22px; padding:34px 32px; margin-bottom:34px;
}
.hero h1{margin:0 0 10px; font-size:31px; font-weight:900; line-height:1.6}
.hero p{margin:0; color:var(--muted); font-size:15.5px}
.badges{display:flex; flex-wrap:wrap; gap:9px; margin-top:20px}
.badge{
  background:rgba(91,140,255,.14); border:1px solid rgba(91,140,255,.4);
  color:#bcd0ff; padding:6px 14px; border-radius:999px; font-size:13px; font-weight:500;
}
section{
  background:var(--panel2); border:1px solid var(--line);
  border-radius:20px; padding:30px 32px; margin-bottom:26px; scroll-margin-top:20px;
}
section > h1:first-child, section > h2:first-child{margin-top:0}
h1{font-size:27px; font-weight:900; border-bottom:2px solid var(--accent); padding-bottom:12px; margin:34px 0 20px; line-height:1.6}
h2{font-size:22px; font-weight:700; color:#cfe0ff; margin:30px 0 14px; line-height:1.7}
h3{font-size:18px; font-weight:700; color:var(--accent2); margin:22px 0 10px}
h4{font-size:16px; color:#dbe5ff; margin:16px 0 8px}
p{margin:11px 0}
ul,ol{padding-right:24px; margin:11px 0}
li{margin:7px 0}
a{color:var(--accent)}
strong{color:#fff; font-weight:700}
hr{border:0; border-top:1px solid var(--line); margin:32px 0}
blockquote{
  margin:18px 0; padding:14px 18px; border-right:4px solid var(--warn);
  background:rgba(255,176,32,.08); border-radius:0 12px 12px 0; color:#ffe0a8;
}
blockquote p{margin:4px 0}
code{
  background:#1b2545; color:#8ef0cd; padding:2px 7px; border-radius:6px;
  font-size:13.5px; font-family:'JetBrains Mono',Consolas,monospace; direction:ltr; display:inline-block;
}
pre{
  background:#080d1c; border:1px solid var(--line); border-radius:14px;
  padding:18px; overflow-x:auto; direction:ltr; text-align:left; font-size:13px; line-height:1.75;
}
pre code{background:none; padding:0; color:#c9d6f5; font-size:13px}
/* ---------- Tables ---------- */
.tbl{overflow-x:auto; margin:18px 0; border-radius:14px; border:1px solid var(--line)}
table{border-collapse:collapse; width:100%; font-size:14.5px; min-width:520px}
th{
  background:#1a2547; color:#dbe6ff; font-weight:700; padding:13px 14px;
  text-align:right; border-bottom:2px solid var(--accent); white-space:nowrap;
}
td{padding:12px 14px; border-bottom:1px solid #1c2745; vertical-align:top}
tbody tr:nth-child(even){background:rgba(255,255,255,.022)}
tbody tr:hover{background:rgba(91,140,255,.09)}
tbody tr:last-child td{border-bottom:none}
/* ---------- Print ---------- */
@media print{
  nav{display:none} body{background:#fff; color:#111}
  section,.hero{background:#fff; border-color:#ccc; break-inside:avoid}
  h1,h2{color:#111} pre{background:#f5f5f5}
}
@media (max-width:1000px){
  .wrap{flex-direction:column}
  nav{position:relative; width:100%; flex:auto; height:auto; border-left:none; border-bottom:1px solid var(--line)}
  main{padding:22px 16px 80px}
  .hero h1{font-size:23px}
}
"""

JS = """
const links=[...document.querySelectorAll('nav a')];
const secs=[...document.querySelectorAll('section')];
const io=new IntersectionObserver(es=>{
  es.forEach(e=>{ if(e.isIntersecting){
    links.forEach(l=>l.classList.toggle('active', l.getAttribute('href')==='#'+e.target.id));
  }});
},{rootMargin:'-15% 0px -75% 0px'});
secs.forEach(s=>io.observe(s));
"""


def render():
    parts, nav = [], []
    for fname, title in DOCS:
        path = os.path.join(BASE, fname)
        if not os.path.exists(path):
            continue
        raw = open(path, encoding="utf-8").read()
        sid = re.sub(r"[^a-z0-9]+", "-", fname.lower().rsplit(".", 1)[0])
        if fname.endswith(".sql"):
            body = "<h1>" + title + "</h1>\n<pre><code>" + (
                raw.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            ) + "</code></pre>"
        else:
            body = markdown.markdown(
                raw, extensions=["tables", "fenced_code", "toc", "sane_lists", "nl2br"]
            )
            body = body.replace("<table>", '<div class="tbl"><table>').replace(
                "</table>", "</table></div>"
            )
        nav.append(f'<a href="#{sid}">{title}</a>')
        parts.append(f'<section id="{sid}">{body}</section>')

    return f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>بیزینس‌پلن جامع فروشگاه پوشاک کودک و نوجوان</title>
<style>{CSS}</style>
</head>
<body>
<div class="wrap">
<nav>
  <div class="brand">🧒 فروشگاه پوشاک<br>کودک و نوجوان</div>
  <div class="sub">بیزینس‌پلن جامع و طرح اجرایی</div>
  <h2>فهرست اسناد</h2>
  {''.join(nav)}
</nav>
<main>
  <div class="hero">
    <h1>بیزینس‌پلن ۱۰۰٪ جامع — فروشگاه پوشاک کودک و نوجوان</h1>
    <p>فروشگاه اینترنتی روی Hostinger + لایه ایران، با اتوماسیون کامل «عکس ← محصول ← پست شبکه‌های اجتماعی ← ویدئو»، موتور هوش مصنوعی AgentRouter، سئو و بک‌لینک درجه‌یک، و کمپین‌های تبلیغاتی خودکار.</p>
    <div class="badges">
      <span class="badge">۱۱ سند</span>
      <span class="badge">۷٬۴۰۰+ کلمه</span>
      <span class="badge">۲۵ جدول دیتابیس</span>
      <span class="badge">۱۰ کانال اجتماعی</span>
      <span class="badge">نقشه راه ۱۸۰ روزه</span>
      <span class="badge">۱۲ سناریوی n8n</span>
    </div>
  </div>
  {''.join(parts)}
</main>
</div>
<script>{JS}</script>
</body>
</html>"""


if __name__ == "__main__":
    html = render()
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✅ {OUT}  ({len(html)/1024:.1f} KB)")
