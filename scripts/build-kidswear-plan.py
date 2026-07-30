#!/usr/bin/env python3
"""
ساخت نسخه ارائه‌ای بیزینس‌پلن فروشگاه پوشاک کودک و نوجوان.

خروجی‌ها:
  docs/kidswear/PLAN.html   — سند کامل تعاملی (RTL، فونت جاسازی‌شده، آماده چاپ/PDF)
"""
import base64
import os
import re

import markdown

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, "docs", "kidswear")
FONTS = os.path.join(BASE, "assets", "fonts")
OUT_HTML = os.path.join(BASE, "PLAN.html")

DOCS = [
    ("README.md", "خلاصه اجرایی", "📋"),
    ("01-business-plan.md", "۱ · بیزینس‌پلن", "💼"),
    ("02-technical-architecture.md", "۲ · معماری فنی", "🏗️"),
    ("03-automation-pipeline.md", "۳ · اتوماسیون", "⚙️"),
    ("11-virtual-tryon.md", "۴ · پرو آنلاین لباس", "👕"),
    ("04-social-media-plan.md", "۵ · شبکه‌های اجتماعی", "📱"),
    ("05-seo-backlink.md", "۶ · سئو و بک‌لینک", "🔍"),
    ("06-ads-and-growth.md", "۷ · تبلیغات و رشد", "📈"),
    ("07-roadmap-and-kpi.md", "۸ · نقشه راه و KPI", "🗺️"),
    ("08-integrations-and-env.md", "۹ · سرویس‌ها و کلیدها", "🔌"),
    ("09-data-model.sql", "۱۰ · مدل داده", "🗄️"),
    ("10-decisions-and-questions.md", "۱۱ · تصمیم‌های باز", "✅"),
]

FONT_FILES = [
    ("Vazirmatn-Light.ttf", 300),
    ("Vazirmatn-Regular.ttf", 400),
    ("Vazirmatn-Medium.ttf", 500),
    ("Vazirmatn-Bold.ttf", 700),
    ("Vazirmatn-Black.ttf", 900),
]


def embed_fonts() -> str:
    """فونت وزیرمتن را به‌صورت base64 داخل CSS جاسازی می‌کند تا فایل کاملاً آفلاین باشد."""
    css = []
    for fname, weight in FONT_FILES:
        path = os.path.join(FONTS, fname)
        if not os.path.exists(path):
            continue
        b64 = base64.b64encode(open(path, "rb").read()).decode("ascii")
        css.append(
            "@font-face{font-family:'Vazirmatn';font-style:normal;font-weight:%d;"
            "font-display:swap;src:url(data:font/truetype;charset=utf-8;base64,%s) format('truetype')}"
            % (weight, b64)
        )
    return "\n".join(css)


CSS = """
:root{
  --bg:#070b18; --panel:#0f1730; --panel2:#111a36; --card:#162043;
  --line:#25325c; --line2:#1b2547;
  --txt:#e9eefb; --muted:#93a4cc; --dim:#6b7ba3;
  --accent:#5b8cff; --accent-soft:rgba(91,140,255,.14);
  --green:#22d3a5; --amber:#ffb020; --rose:#ff5a7a; --violet:#a78bfa;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0; background:var(--bg); color:var(--txt);
  font-family:'Vazirmatn',system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;
  direction:rtl; text-align:right; line-height:2.05; font-size:16px;
  -webkit-font-smoothing:antialiased;
}
.layout{display:flex; max-width:1560px; margin:0 auto}

/* ══════ Sidebar ══════ */
nav{
  position:sticky; top:0; align-self:flex-start; height:100vh; overflow-y:auto;
  width:296px; flex:0 0 296px; padding:26px 16px 40px;
  background:linear-gradient(180deg,#0c1densely 0%,#080d1e 100%);
  background:linear-gradient(180deg,#0c1226,#080d1e);
  border-left:1px solid var(--line2);
}
nav::-webkit-scrollbar{width:6px}
nav::-webkit-scrollbar-thumb{background:#26325c; border-radius:9px}
.nav-brand{
  display:flex; align-items:center; gap:11px; padding:0 8px 18px;
  border-bottom:1px solid var(--line2); margin-bottom:16px;
}
.nav-logo{
  width:44px; height:44px; flex:0 0 44px; border-radius:13px;
  background:linear-gradient(135deg,var(--accent),var(--violet));
  display:grid; place-items:center; font-size:22px;
}
.nav-title{font-size:15.5px; font-weight:800; line-height:1.55; color:#fff}
.nav-sub{font-size:11.5px; color:var(--dim); margin-top:3px}
nav .lbl{font-size:11px; color:var(--dim); padding:0 10px; margin:14px 0 7px; letter-spacing:.6px}
nav a{
  display:flex; align-items:center; gap:10px; padding:9px 12px; margin:3px 0;
  border-radius:11px; color:var(--muted); text-decoration:none;
  font-size:14px; font-weight:500; transition:.16s; border:1px solid transparent;
}
nav a .ic{font-size:15px; width:20px; text-align:center; flex:0 0 20px}
nav a:hover{background:var(--panel); color:#fff}
nav a.active{
  background:linear-gradient(90deg,var(--accent-soft),transparent);
  color:#fff; border-color:rgba(91,140,255,.45); font-weight:700;
}
.nav-foot{margin-top:22px; padding:14px 12px 0; border-top:1px solid var(--line2); font-size:11.5px; color:var(--dim); line-height:1.9}

/* ══════ Main ══════ */
main{flex:1; min-width:0; padding:34px 46px 130px}

/* ── Cover ── */
.cover{
  position:relative; overflow:hidden; border-radius:26px; margin-bottom:30px;
  padding:52px 44px; border:1px solid var(--line);
  background:
    radial-gradient(1100px 380px at 88% -12%,rgba(167,139,250,.20),transparent 60%),
    radial-gradient(900px 340px at 8% 108%,rgba(34,211,165,.16),transparent 60%),
    linear-gradient(135deg,#182a63 0%,#101a3a 55%,#0b1densely 100%),
    linear-gradient(135deg,#182a63 0%,#101a3a 55%,#0b1densely 100%);
  background-color:#101a3a;
}
.cover .kicker{
  display:inline-block; font-size:12.5px; font-weight:700; letter-spacing:1.4px;
  color:#9fc0ff; background:rgba(91,140,255,.16); border:1px solid rgba(91,140,255,.42);
  padding:6px 15px; border-radius:999px; margin-bottom:20px;
}
.cover h1{margin:0 0 14px; font-size:38px; font-weight:900; line-height:1.5; color:#fff; letter-spacing:-.4px}
.cover .lede{margin:0; font-size:16.5px; color:#b9c8ea; max-width:920px; line-height:2}
.chips{display:flex; flex-wrap:wrap; gap:9px; margin-top:26px}
.chip{
  background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.14);
  color:#dbe6ff; padding:7px 15px; border-radius:999px; font-size:13px; font-weight:600;
}

/* ── KPI strip ── */
.kpis{display:grid; grid-template-columns:repeat(auto-fit,minmax(178px,1fr)); gap:14px; margin-bottom:30px}
.kpi{
  background:linear-gradient(160deg,var(--card),var(--panel));
  border:1px solid var(--line); border-radius:18px; padding:20px 18px; text-align:center;
}
.kpi .v{font-size:27px; font-weight:900; line-height:1.35; color:#fff}
.kpi .v.g{color:var(--green)} .kpi .v.a{color:var(--amber)} .kpi .v.b{color:var(--accent)} .kpi .v.v{color:var(--violet)}
.kpi .k{font-size:12.5px; color:var(--muted); margin-top:5px; line-height:1.7}

/* ── Sections ── */
section{
  background:var(--panel2); border:1px solid var(--line2);
  border-radius:22px; padding:6px 34px 30px; margin-bottom:24px; scroll-margin-top:14px;
}
.sec-head{
  display:flex; align-items:center; gap:13px; margin:0 -34px 6px;
  padding:20px 34px 18px; border-bottom:1px solid var(--line2);
  background:linear-gradient(90deg,rgba(91,140,255,.09),transparent 65%);
  border-radius:22px 22px 0 0;
}
.sec-ic{
  width:42px; height:42px; flex:0 0 42px; border-radius:12px; display:grid; place-items:center;
  font-size:20px; background:var(--accent-soft); border:1px solid rgba(91,140,255,.35);
}
.sec-name{font-size:19px; font-weight:800; color:#fff}

h1{font-size:25px; font-weight:900; color:#fff; margin:30px 0 16px; padding-bottom:11px; border-bottom:2px solid var(--accent); line-height:1.6}
section > h1:first-of-type{margin-top:18px}
h2{font-size:20.5px; font-weight:800; color:#cfe0ff; margin:30px 0 12px; line-height:1.7; padding-right:14px; border-right:4px solid var(--accent); }
h3{font-size:17.5px; font-weight:700; color:var(--green); margin:24px 0 9px}
h4{font-size:15.5px; font-weight:700; color:#dbe5ff; margin:18px 0 7px}
p{margin:11px 0; color:#dae2f6}
ul,ol{padding-right:26px; margin:11px 0}
li{margin:7px 0; color:#dae2f6}
li::marker{color:var(--accent)}
a{color:#7ba6ff; text-decoration:none; border-bottom:1px dotted rgba(123,166,255,.5)}
a:hover{color:#a9c5ff}
strong{color:#fff; font-weight:800}
em{color:#c5d3f2}
hr{border:0; border-top:1px solid var(--line2); margin:32px 0}

blockquote{
  margin:20px 0; padding:15px 19px; border-radius:0 14px 14px 0;
  border-right:4px solid var(--amber); background:rgba(255,176,32,.075); color:#ffdfa6;
}
blockquote p{margin:4px 0; color:#ffdfa6}
blockquote strong{color:#fff2d4}

code{
  background:#1a2445; color:#8ef0cd; padding:2px 7px; border-radius:6px; font-size:13px;
  font-family:'JetBrains Mono',ui-monospace,Consolas,monospace; direction:ltr; display:inline-block;
}
pre{
  background:#050912; border:1px solid var(--line2); border-radius:15px;
  padding:19px 21px; overflow-x:auto; direction:ltr; text-align:left;
  font-size:12.6px; line-height:1.8; margin:18px 0;
}
pre::-webkit-scrollbar{height:8px}
pre::-webkit-scrollbar-thumb{background:#26325c; border-radius:9px}
pre code{background:none; padding:0; color:#c4d3f4; font-size:12.6px}

/* ── Tables ── */
.tbl{overflow-x:auto; margin:19px 0; border:1px solid var(--line); border-radius:15px; background:#0d1densely; background-color:#0d1densely}
.tbl{background-color:#0c1densely}
.tbl{background-color:#0b1densely}
.tbl{background-color:#0c1329}
table{border-collapse:collapse; width:100%; font-size:14px; min-width:540px}
thead th{
  background:linear-gradient(180deg,#1c2a55,#18234a); color:#e3ecff; font-weight:800;
  padding:13px 15px; text-align:right; border-bottom:2px solid var(--accent); white-space:nowrap; font-size:13.5px;
}
td{padding:12px 15px; border-bottom:1px solid #18224180; vertical-align:top; color:#d6dff5; line-height:1.85}
td:first-child{font-weight:600; color:#eef3ff}
tbody tr:nth-child(even){background:rgba(255,255,255,.018)}
tbody tr:hover{background:rgba(91,140,255,.085)}
tbody tr:last-child td{border-bottom:none}
tbody tr:last-child{font-weight:600}
table code{font-size:12px}

/* ── Print / PDF ── */
@page{size:A4; margin:14mm 12mm}
@media print{
  nav,.no-print{display:none !important}
  body{background:#fff; color:#16181d; font-size:10.5pt; line-height:1.85}
  .layout{display:block; max-width:none}
  main{padding:0}
  .cover{
    background:#f4f7ff !important; border:1px solid #c3d0ea; color:#101828;
    padding:26px; border-radius:14px; page-break-after:always;
  }
  .cover h1{color:#0d1b3e; font-size:24pt}
  .cover .lede{color:#3c4a68}
  .cover .kicker{background:#e2ebff; color:#2c4fa0; border-color:#b9ccf3}
  .chip{background:#eef3ff; color:#31405f; border-color:#c9d6f0}
  .kpis{page-break-inside:avoid}
  .kpi{background:#f7f9ff; border-color:#d3ddf0}
  .kpi .v,.kpi .v.g,.kpi .v.a,.kpi .v.b,.kpi .v.v{color:#152a5c}
  .kpi .k{color:#4b5b7c}
  section{
    background:#fff; border:none; border-radius:0; padding:0; margin:0 0 8mm;
    page-break-before:always; page-break-inside:auto;
  }
  section:first-of-type{page-break-before:avoid}
  .sec-head{background:#eef3ff; border-radius:8px; margin:0 0 10px; padding:10px 14px; border-bottom:2px solid #5b8cff}
  .sec-ic{background:#dfe9ff; border-color:#bdd0f5}
  .sec-name{color:#12203f}
  h1{color:#0d1b3e; font-size:16pt; border-color:#5b8cff; page-break-after:avoid}
  h2{color:#1a2c56; font-size:13pt; border-color:#5b8cff; page-break-after:avoid}
  h3{color:#0e7c5f; font-size:11.5pt; page-break-after:avoid}
  h4{color:#25314d; page-break-after:avoid}
  p,li,td{color:#22293a}
  strong{color:#000}
  a{color:#1f52c9; border:none}
  .tbl{border-color:#c9d3e6; background:#fff; page-break-inside:auto}
  table{font-size:8.8pt}
  thead{display:table-header-group}
  tr{page-break-inside:avoid}
  thead th{background:#e8eefc; color:#152a5c; border-bottom:1.5px solid #5b8cff; padding:7px 9px}
  td{border-bottom:1px solid #e3e8f2; padding:6px 9px}
  tbody tr:nth-child(even){background:#fafbfe}
  pre{background:#f6f8fc; border-color:#d7dfef; color:#1c2534; font-size:8pt; page-break-inside:avoid}
  pre code{color:#1c2534}
  code{background:#eef1f8; color:#0b5f47}
  blockquote{background:#fff8e8; border-color:#e0a020; color:#5c4310; page-break-inside:avoid}
  blockquote p{color:#5c4310}
}

/* ── Responsive ── */
@media (max-width:1080px){
  .layout{flex-direction:column}
  nav{position:relative; width:100%; flex:auto; height:auto; border-left:none; border-bottom:1px solid var(--line2)}
  nav a{display:inline-flex; margin:3px 4px 3px 0}
  main{padding:22px 15px 80px}
  section{padding:6px 18px 24px}
  .sec-head{margin:0 -18px 6px; padding:16px 18px}
  .cover{padding:32px 22px}
  .cover h1{font-size:25px}
}

/* ── Floating actions ── */
.fab{position:fixed; bottom:24px; left:24px; display:flex; flex-direction:column; gap:10px; z-index:60}
.fab button{
  width:auto; padding:11px 18px; border-radius:14px; cursor:pointer;
  background:linear-gradient(135deg,var(--accent),#4470e6); color:#fff; border:none;
  font-family:inherit; font-size:13.5px; font-weight:700; box-shadow:0 8px 26px rgba(0,0,0,.45);
  transition:.18s;
}
.fab button:hover{transform:translateY(-2px); box-shadow:0 12px 32px rgba(91,140,255,.4)}
.fab .ghost{background:#1a2447; border:1px solid var(--line)}
.progress{position:fixed; top:0; right:0; height:3px; background:linear-gradient(90deg,var(--violet),var(--accent),var(--green)); z-index:100; width:0}
"""

JS = """
// progress bar
const bar=document.querySelector('.progress');
addEventListener('scroll',()=>{
  const h=document.documentElement;
  bar.style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%';
},{passive:true});

// active nav
const links=[...document.querySelectorAll('nav a[href^="#"]')];
const io=new IntersectionObserver(es=>{
  es.forEach(e=>{ if(e.isIntersecting){
    links.forEach(l=>l.classList.toggle('active', l.getAttribute('href')==='#'+e.target.id));
  }});
},{rootMargin:'-12% 0px -78% 0px'});
document.querySelectorAll('section').forEach(s=>io.observe(s));
"""


def md_to_html(raw: str) -> str:
    html = markdown.markdown(
        raw, extensions=["tables", "fenced_code", "sane_lists", "nl2br", "attr_list"]
    )
    return html.replace("<table>", '<div class="tbl"><table>').replace(
        "</table>", "</table></div>"
    )


def sql_to_html(raw: str) -> str:
    esc = raw.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return (
        "<p>اسکیمای کامل دیتابیس فروشگاه، اتوماسیون، بازاریابی، پرو آنلاین و صف کارها. "
        "آماده اجرا روی MySQL 8 یا MariaDB.</p>\n<pre><code>" + esc + "</code></pre>"
    )


def build() -> str:
    nav_items, sections = [], []

    for fname, title, icon in DOCS:
        path = os.path.join(BASE, fname)
        if not os.path.exists(path):
            continue
        raw = open(path, encoding="utf-8").read()
        sid = re.sub(r"[^a-z0-9]+", "-", fname.lower().rsplit(".", 1)[0])
        body = sql_to_html(raw) if fname.endswith(".sql") else md_to_html(raw)
        nav_items.append(
            f'<a href="#{sid}"><span class="ic">{icon}</span><span>{title}</span></a>'
        )
        sections.append(
            f'<section id="{sid}">'
            f'<div class="sec-head"><div class="sec-ic">{icon}</div>'
            f'<div class="sec-name">{title}</div></div>'
            f"{body}</section>"
        )

    kpis = [
        ("۵۵–۲۳۸", "میلیون تومان سرمایه اولیه", "b"),
        ("ماه ۲–۳", "نقطه سر‌به‌سر عملیاتی", "g"),
        ("۹۰ ثانیه", "از عکس تا انتشار در ۱۰ کانال", "a"),
        ("زیر ۷٪", "نرخ مرجوعی با پرو آنلاین", "v"),
        ("~۵۰۰ هزار", "هزینه ماهانه زیرساخت مرحله ۱", "g"),
        ("۳۰+", "قطعه محتوای خودکار در روز", "b"),
    ]
    kpi_html = "".join(
        f'<div class="kpi"><div class="v {c}">{v}</div><div class="k">{k}</div></div>'
        for v, k, c in kpis
    )

    chips = [
        "۱۲ سند", "۸٬۵۰۰+ کلمه", "۲۹ جدول دیتابیس", "پرو آنلاین ۴ سطحی",
        "شروع روی cPanel", "۱۰ کانال اجتماعی", "نقشه راه ۱۸۰ روزه", "AgentRouter",
    ]
    chip_html = "".join(f'<span class="chip">{c}</span>' for c in chips)

    return f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>بیزینس‌پلن جامع — فروشگاه پوشاک کودک و نوجوان</title>
<meta name="description" content="بیزینس‌پلن کامل راه‌اندازی فروشگاه اینترنتی پوشاک کودک و نوجوان با پرو آنلاین، اتوماسیون شبکه‌های اجتماعی و سئوی حرفه‌ای">
<style>{embed_fonts()}</style>
<style>{CSS}</style>
</head>
<body>
<div class="progress"></div>
<div class="layout">

<nav class="no-print">
  <div class="nav-brand">
    <div class="nav-logo">🧒</div>
    <div>
      <div class="nav-title">فروشگاه پوشاک<br>کودک و نوجوان</div>
      <div class="nav-sub">بیزینس‌پلن جامع و طرح اجرایی</div>
    </div>
  </div>
  <div class="lbl">فهرست اسناد</div>
  {''.join(nav_items)}
  <div class="nav-foot">
    نسخه ۲ · مرداد ۱۴۰۵<br>
    شامل پرو آنلاین لباس<br>
    و مسیر کم‌هزینه cPanel
  </div>
</nav>

<main>
  <div class="cover">
    <span class="kicker">BUSINESS PLAN · نسخه ۲</span>
    <h1>بیزینس‌پلن جامع فروشگاه پوشاک کودک و نوجوان</h1>
    <p class="lede">
      فروشگاه اینترنتی تخصصی با چهار تمایز کلیدی: <strong>پرو آنلاین لباس</strong> روی آواتار کودک،
      اتوماسیون کامل «عکس ← محصول ← پست شبکه‌های اجتماعی ← ویدئو» در کمتر از ۹۰ ثانیه،
      سئو و بک‌لینک درجه‌یک با موتور محتوای هوش مصنوعی،
      و <strong>شروع کم‌هزینه روی cPanel</strong> با مسیر رشد مرحله‌ای به VPS.
    </p>
    <div class="chips">{chip_html}</div>
  </div>

  <div class="kpis">{kpi_html}</div>

  {''.join(sections)}
</main>
</div>

<div class="fab no-print">
  <button onclick="window.print()">🖨️ ذخیره به PDF</button>
  <button class="ghost" onclick="scrollTo({{top:0,behavior:'smooth'}})">↑ بالا</button>
</div>

<script>{JS}</script>
</body>
</html>"""


if __name__ == "__main__":
    html = build()
    with open(OUT_HTML, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✅ {OUT_HTML}  ({len(html)/1024:.0f} KB)")
