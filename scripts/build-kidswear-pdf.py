#!/usr/bin/env python3
"""
ساخت PDF ارائه‌ای فارسی (RTL) از بیزینس‌پلن فروشگاه پوشاک کودک و نوجوان.

از ReportLab + arabic_reshaper + python-bidi استفاده می‌کند تا بدون نیاز به
مرورگر یا pango، یک PDF کاملاً فارسی و راست‌چین تولید شود.

خروجی: docs/kidswear/بیزینس-پلن-فروشگاه-پوشاک-کودک.pdf
"""
import os
import re

import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, NextPageTemplate, PageBreak,
    PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, "docs", "kidswear")
FONTS = os.path.join(BASE, "assets", "fonts")
OUT = os.path.join(BASE, "بیزینس-پلن-فروشگاه-پوشاک-کودک.pdf")

DOCS = [
    ("README.md", "خلاصه اجرایی"),
    ("01-business-plan.md", "بخش ۱ — بیزینس‌پلن"),
    ("02-technical-architecture.md", "بخش ۲ — معماری فنی"),
    ("03-automation-pipeline.md", "بخش ۳ — پایپ‌لاین اتوماسیون"),
    ("11-virtual-tryon.md", "بخش ۴ — پرو آنلاین لباس"),
    ("04-social-media-plan.md", "بخش ۵ — شبکه‌های اجتماعی"),
    ("05-seo-backlink.md", "بخش ۶ — سئو و بک‌لینک"),
    ("06-ads-and-growth.md", "بخش ۷ — تبلیغات و رشد"),
    ("07-roadmap-and-kpi.md", "بخش ۸ — نقشه راه و KPI"),
    ("08-integrations-and-env.md", "بخش ۹ — سرویس‌ها و کلیدها"),
    ("10-decisions-and-questions.md", "بخش ۱۰ — تصمیم‌های باز"),
]

# ───────────────────────── palette ─────────────────────────
NAVY = colors.HexColor("#0d1b3e")
BLUE = colors.HexColor("#2f5fd0")
BLUE_L = colors.HexColor("#e8eefc")
BLUE_XL = colors.HexColor("#f5f8ff")
GREEN = colors.HexColor("#0e7c5f")
AMBER = colors.HexColor("#b57a05")
AMBER_BG = colors.HexColor("#fff8e8")
INK = colors.HexColor("#1e2637")
MUTED = colors.HexColor("#5a6883")
LINE = colors.HexColor("#d2dcee")
CODE_BG = colors.HexColor("#f4f6fb")

PAGE_W, PAGE_H = A4
MARGIN_X = 15 * mm
MARGIN_T = 17 * mm
MARGIN_B = 17 * mm
CONTENT_W = PAGE_W - 2 * MARGIN_X


# ───────────────────────── fonts ─────────────────────────
def register_fonts():
    fam = {
        "Vazir": "Vazirmatn-Regular.ttf",
        "Vazir-Bold": "Vazirmatn-Bold.ttf",
        "Vazir-Black": "Vazirmatn-Black.ttf",
        "Vazir-Light": "Vazirmatn-Light.ttf",
    }
    for name, fn in fam.items():
        pdfmetrics.registerFont(TTFont(name, os.path.join(FONTS, fn)))
    pdfmetrics.registerFontFamily(
        "Vazir", normal="Vazir", bold="Vazir-Bold", italic="Vazir", boldItalic="Vazir-Bold"
    )


# ───────────────────── RTL shaping ─────────────────────
_TAG = re.compile(r"(<[^>]+>)")
EMOJI = re.compile(
    "[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF"
    "\U00002190-\U000021FF\U00002B00-\U00002BFF\uFE0F\u200d]+"
)


def shape(t: str) -> str:
    """یک قطعه متن را reshape و bidi می‌کند (بدون شکستن خط)."""
    return get_display(arabic_reshaper.reshape(t))


def rtl(text: str) -> str:
    """
    متن فارسی را برای ReportLab آماده می‌کند.

    نکته کلیدی: reshape+bidi روی کل پاراگراف باعث می‌شود ReportLab هنگام شکستن
    خط، ترتیب خطوط را برعکس نشان دهد. برای همین این تابع فقط برای متن‌های کوتاه
    (تیتر، سلول جدول) استفاده می‌شود؛ برای پاراگراف‌های بلند `rtl_para` به کار می‌رود
    که خودش خط‌ها را می‌شکند و هر خط را جداگانه shape می‌کند.
    """
    if not text:
        return ""
    text = EMOJI.sub("", text)
    out = []
    for part in _TAG.split(text):
        if not part:
            continue
        if part.startswith("<") and part.endswith(">"):
            out.append(part)
        else:
            part = part.replace("&nbsp;", " ").replace("&zwnj;", "\u200c")
            out.append(shape(part))
    return "".join(out)


def _close_of(tag: str) -> str:
    return "</%s>" % tag[1:].split()[0].rstrip(">").rstrip("/")


def rtl_para(html: str, font: str, size: float, max_w: float) -> str:
    """
    متن را به خطوطی که در عرض `max_w` جا می‌شوند می‌شکند و هر خط را جداگانه
    shape می‌کند؛ سپس با <br/> به هم می‌چسباند. نتیجه: ترتیب خطوط درست است.
    """
    if not html:
        return ""
    html = EMOJI.sub("", html)

    stack, words = [], []
    for part in _TAG.split(html):
        if not part:
            continue
        if part.startswith("<") and part.endswith(">"):
            if part.startswith("</"):
                if stack:
                    stack.pop()
            elif not part.endswith("/>"):
                stack.append(part)
            continue
        part = part.replace("&nbsp;", " ").replace("&zwnj;", "\u200c")
        pre = "".join(stack)
        suf = "".join(_close_of(t) for t in reversed(stack))
        bold = any(t.startswith(("<b>", "<b ")) for t in stack)
        mono = any("Courier" in t for t in stack)
        for w in part.split():
            words.append((pre, suf, w, bold, mono))

    if not words:
        return ""

    space_w = pdfmetrics.stringWidth(" ", font, size)
    lines, cur, cur_w = [], [], 0.0
    for it in words:
        f = "Courier" if it[4] else ("Vazir-Bold" if it[3] else font)
        sz = size * 0.92 if it[4] else size
        w = pdfmetrics.stringWidth(shape(it[2]), f, sz)
        add = w + (space_w if cur else 0)
        if cur and cur_w + add > max_w:
            lines.append(cur)
            cur, cur_w = [it], w
        else:
            cur.append(it)
            cur_w += add
    if cur:
        lines.append(cur)

    rendered_lines = []
    for line in lines:
        segs, buf, key = [], [], None
        for pre, suf, w, _b, _m in line:
            if key is not None and (pre, suf) != key:
                segs.append((key, buf))
                buf = []
            key = (pre, suf)
            buf.append(w)
        if buf:
            segs.append((key, buf))
        # segments are laid out right-to-left
        chunks = [k[0] + shape(" ".join(ws)) + k[1] for k, ws in reversed(segs)]
        rendered_lines.append(" ".join(chunks))
    return "<br/>".join(rendered_lines)


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def inline(md: str) -> str:
    """مارک‌داون inline → تگ‌های ReportLab."""
    s = esc(md)
    s = re.sub(r"`([^`]+)`", r'<font face="Courier" size="8.5" color="#0b5f47">\1</font>', s)
    s = re.sub(r"\*\*\*(.+?)\*\*\*", r"<b>\1</b>", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", s)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<font color="#1f52c9">\1</font>', s)
    s = s.replace("✅", "[بله] ").replace("❌", "[خیر] ").replace("⚠️", "[هشدار] ")
    s = s.replace("⛔", "[توقف] ").replace("⭐", "[مهم] ").replace("🔥", "")
    s = s.replace("🔴", "[حیاتی] ").replace("🟠", "[بالا] ")
    s = s.replace("🟡", "[متوسط] ").replace("🟢", "[پایین] ").replace("🔵", "[بعدی] ")
    s = s.replace("💚", "").replace("💛", "").replace("🧡", "").replace("🔀", "")
    s = re.sub(r"\[[ x]\]", "", s)
    return s.strip()


# ───────────────────────── styles ─────────────────────────
def build_styles():
    def st(name, **kw):
        base = dict(
            fontName="Vazir", fontSize=9.3, leading=16.5, alignment=TA_RIGHT,
            textColor=INK, spaceBefore=0, spaceAfter=0,
        )
        base.update(kw)
        return ParagraphStyle(name, **base)

    return {
        "cover_kicker": st("ck", fontName="Vazir-Bold", fontSize=10, leading=18,
                           textColor=BLUE, alignment=TA_CENTER),
        "cover_title": st("ct", fontName="Vazir-Black", fontSize=25, leading=42,
                          textColor=NAVY, alignment=TA_CENTER),
        "cover_sub": st("cs", fontSize=11.5, leading=25, textColor=MUTED, alignment=TA_CENTER),
        "cover_meta": st("cm", fontSize=9, leading=18, textColor=MUTED, alignment=TA_CENTER),
        "sec": st("sec", fontName="Vazir-Black", fontSize=19, leading=34,
                  textColor=colors.white, alignment=TA_RIGHT),
        "h1": st("h1", fontName="Vazir-Black", fontSize=14.5, leading=27,
                 textColor=NAVY, spaceBefore=13, spaceAfter=5),
        "h2": st("h2", fontName="Vazir-Bold", fontSize=12.2, leading=23,
                 textColor=colors.HexColor("#1a3570"), spaceBefore=11, spaceAfter=4),
        "h3": st("h3", fontName="Vazir-Bold", fontSize=10.6, leading=20,
                 textColor=GREEN, spaceBefore=9, spaceAfter=3),
        "h4": st("h4", fontName="Vazir-Bold", fontSize=9.8, leading=18,
                 textColor=colors.HexColor("#2b3a5c"), spaceBefore=7, spaceAfter=2),
        "p": st("p", spaceAfter=5),
        "li": st("li", fontSize=9.1, leading=16, spaceAfter=2.5, rightIndent=11),
        "quote": st("q", fontSize=9.1, leading=16.5, textColor=colors.HexColor("#6b4c08"),
                    rightIndent=7, leftIndent=7),
        "code": ParagraphStyle("code", fontName="Courier", fontSize=7.3, leading=10.4,
                               textColor=colors.HexColor("#1c2534"), alignment=TA_LEFT,
                               leftIndent=5, rightIndent=5),
        "th": st("th", fontName="Vazir-Bold", fontSize=8.2, leading=13.5,
                 textColor=NAVY, alignment=TA_CENTER),
        "td": st("td", fontSize=8.1, leading=13.5, alignment=TA_RIGHT),
        "td1": st("td1", fontName="Vazir-Bold", fontSize=8.1, leading=13.5, alignment=TA_RIGHT),
        "toc": st("toc", fontSize=10.5, leading=24),
        "toc_n": st("tocn", fontName="Vazir-Bold", fontSize=10.5, leading=24,
                    textColor=BLUE, alignment=TA_CENTER),
        "kpi_v": st("kv", fontName="Vazir-Black", fontSize=15, leading=22,
                    textColor=NAVY, alignment=TA_CENTER),
        "kpi_k": st("kk", fontSize=7.8, leading=12, textColor=MUTED, alignment=TA_CENTER),
    }


S = None  # populated after font registration


def P(text, style="p", width=None):
    """پاراگراف راست‌چین با شکستن خط صحیح."""
    st = S[style]
    w = (width if width is not None else CONTENT_W) - st.rightIndent - st.leftIndent - 2
    return Paragraph(rtl_para(inline(text), st.fontName, st.fontSize, w), st)


# ───────────────────────── markdown parser ─────────────────────────
def split_row(line: str):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def make_table(header, rows):
    ncol = len(header)
    rows = [r + [""] * (ncol - len(r)) if len(r) < ncol else r[:ncol] for r in rows]

    # column widths from content weight
    weights = []
    for i in range(ncol):
        cells = [header[i]] + [r[i] for r in rows]
        m = max(len(re.sub(r"[*`\[\]]", "", c)) for c in cells)
        weights.append(min(max(m, 6), 58))
    total = sum(weights)
    widths = [CONTENT_W * w / total for w in weights]
    # enforce minimum
    minw = 15 * mm
    for i, w in enumerate(widths):
        if w < minw:
            widths[i] = minw
    scale = CONTENT_W / sum(widths)
    widths = [w * scale for w in widths]

    def cell(txt, style, w):
        st = S[style]
        return Paragraph(rtl_para(inline(txt), st.fontName, st.fontSize, w - 9), st)

    data = [[cell(h, "th", widths[i]) for i, h in enumerate(header)]]
    for r in rows:
        data.append([
            cell(c, "td1" if i == 0 else "td", widths[i]) for i, c in enumerate(r)
        ])

    # RTL: reverse column order so first markdown column renders rightmost
    data = [list(reversed(row)) for row in data]
    widths = list(reversed(widths))

    t = Table(data, colWidths=widths, repeatRows=1, hAlign="CENTER")
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), BLUE_L),
        ("LINEBELOW", (0, 0), (-1, 0), 1.1, BLUE),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), BLUE_XL))
    t.setStyle(TableStyle(style))
    return t


def parse_md(md: str):
    """مارک‌داون → لیست flowable"""
    out = []
    lines = md.split("\n")
    i = 0
    while i < len(lines):
        ln = lines[i]
        st = ln.strip()

        # code fence
        if st.startswith("```"):
            i += 1
            buf = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            # long blocks are chunked so they never overflow a single page
            CHUNK = 58
            chunks = [buf[j:j + CHUNK] for j in range(0, len(buf), CHUNK)] or [[]]
            emitted = False
            for ci, chunk in enumerate(chunks):
                code = "\n".join(chunk)
                if not code.strip():
                    continue
                para = Paragraph(
                    esc(code).replace(" ", "&nbsp;").replace("\n", "<br/>"), S["code"]
                )
                tb = Table([[para]], colWidths=[CONTENT_W], hAlign="CENTER")
                tb.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), CODE_BG),
                    ("BOX", (0, 0), (-1, -1), 0.4, LINE),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 7),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ]))
                if not emitted:
                    out.append(Spacer(1, 4))
                    emitted = True
                out.append(tb)
                if ci < len(chunks) - 1:
                    out.append(Spacer(1, 2))
            if emitted:
                out.append(Spacer(1, 6))
            continue

        # table
        if st.startswith("|") and i + 1 < len(lines) and re.match(
            r"^\|[\s:|-]+\|?$", lines[i + 1].strip()
        ):
            header = split_row(st)
            i += 2
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(split_row(lines[i].strip()))
                i += 1
            if rows:
                out += [Spacer(1, 5), make_table(header, rows), Spacer(1, 8)]
            continue

        # headings
        m = re.match(r"^(#{1,4})\s+(.*)", st)
        if m:
            lvl, txt = len(m.group(1)), m.group(2)
            key = {1: "h1", 2: "h2", 3: "h3", 4: "h4"}[lvl]
            out.append(KeepTogether([P(txt, key), Spacer(1, 1)]))
            i += 1
            continue

        # hr
        if re.match(r"^(-{3,}|\*{3,}|_{3,})$", st):
            out += [Spacer(1, 5), HRule(), Spacer(1, 7)]
            i += 1
            continue

        # blockquote
        if st.startswith(">"):
            buf = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip().lstrip(">").strip())
                i += 1
            txt = " ".join(x for x in buf if x)
            if txt:
                st = S["quote"]
                w = CONTENT_W - st.rightIndent - st.leftIndent - 20
                q = Paragraph(rtl_para(inline(txt), st.fontName, st.fontSize, w), st)
                tb = Table([[q]], colWidths=[CONTENT_W], hAlign="CENTER")
                tb.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), AMBER_BG),
                    ("LINEAFTER", (0, 0), (-1, -1), 2.2, AMBER),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ]))
                out += [Spacer(1, 4), tb, Spacer(1, 7)]
            continue

        # lists
        m = re.match(r"^([-*+]|\d+[.)])\s+(.*)", st)
        if m:
            while i < len(lines):
                s2 = lines[i].strip()
                mm2 = re.match(r"^([-*+]|\d+[.)])\s+(.*)", s2)
                if not mm2:
                    if s2 == "":
                        break
                    if re.match(r"^\s{2,}\S", lines[i]) and out:
                        i += 1
                        continue
                    break
                marker, body = mm2.group(1), mm2.group(2)
                body = re.sub(r"^\[[ x]\]\s*", "", body)
                bullet = f"{marker} " if marker[0].isdigit() else "• "
                st = S["li"]
                w = CONTENT_W - st.rightIndent - st.leftIndent - 14
                body_html = rtl_para(inline(body), st.fontName, st.fontSize, w)
                out.append(Paragraph(bullet + " " + body_html, st)
                           if False else Paragraph(_bullet_first(body_html, bullet), st))
                i += 1
            out.append(Spacer(1, 5))
            continue

        # blank
        if st == "":
            i += 1
            continue

        # paragraph
        buf = []
        while i < len(lines):
            s2 = lines[i].strip()
            if (s2 == "" or s2.startswith(("|", ">", "#", "```"))
                    or re.match(r"^([-*+]|\d+[.)])\s+", s2)
                    or re.match(r"^(-{3,}|\*{3,}|_{3,})$", s2)):
                break
            buf.append(s2)
            i += 1
        txt = " ".join(buf)
        if txt:
            out.append(P(txt))
    return out


def _bullet_first(line_html: str, bullet: str) -> str:
    """گلوله را ابتدای سمت راست خط اول می‌گذارد."""
    parts = line_html.split("<br/>", 1)
    head = f'<font color="#2f5fd0">{bullet.strip()}</font> ' + parts[0]
    return head + ("<br/>" + parts[1] if len(parts) > 1 else "")


class HRule(Table):
    def __init__(self):
        super().__init__([[""]], colWidths=[CONTENT_W], rowHeights=[0.7], hAlign="CENTER")
        self.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), LINE)]))


# ───────────────────────── page furniture ─────────────────────────
TITLE = "بیزینس‌پلن فروشگاه پوشاک کودک و نوجوان"


def draw_page(canvas, doc):
    canvas.saveState()
    # header
    canvas.setFillColor(BLUE_XL)
    canvas.rect(0, PAGE_H - 11 * mm, PAGE_W, 11 * mm, stroke=0, fill=1)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.4)
    canvas.line(0, PAGE_H - 11 * mm, PAGE_W, PAGE_H - 11 * mm)
    canvas.setFont("Vazir", 7.6)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 7.6 * mm, rtl(TITLE))
    sec = getattr(doc, "cur_section", "")
    if sec:
        canvas.drawString(MARGIN_X, PAGE_H - 7.6 * mm, rtl(sec))
    # footer
    canvas.setStrokeColor(LINE)
    canvas.line(MARGIN_X, 11 * mm, PAGE_W - MARGIN_X, 11 * mm)
    canvas.setFont("Vazir", 7.6)
    canvas.setFillColor(MUTED)
    canvas.drawCentredString(PAGE_W / 2, 7 * mm, rtl(f"صفحه {doc.page}"))
    canvas.drawString(MARGIN_X, 7 * mm, rtl("محرمانه · نسخه ۲"))
    canvas.restoreState()


def draw_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#16295e"))
    canvas.circle(PAGE_W * 0.88, PAGE_H * 0.90, 78 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#122350"))
    canvas.circle(PAGE_W * 0.10, PAGE_H * 0.10, 62 * mm, stroke=0, fill=1)
    canvas.setFillColor(BLUE)
    canvas.rect(0, PAGE_H - 6 * mm, PAGE_W, 6 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#22d3a5"))
    canvas.rect(0, 0, PAGE_W, 4 * mm, stroke=0, fill=1)
    canvas.restoreState()


class Doc(BaseDocTemplate):
    def __init__(self, path):
        super().__init__(
            path, pagesize=A4,
            leftMargin=MARGIN_X, rightMargin=MARGIN_X,
            topMargin=MARGIN_T, bottomMargin=MARGIN_B,
            title=TITLE, author="طرح کسب‌وکار", subject="Business Plan",
        )
        frame = Frame(MARGIN_X, MARGIN_B, CONTENT_W,
                      PAGE_H - MARGIN_T - MARGIN_B, id="body")
        cover_frame = Frame(MARGIN_X, MARGIN_B, CONTENT_W,
                            PAGE_H - MARGIN_T - MARGIN_B, id="cover")
        self.addPageTemplates([
            PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover),
            PageTemplate(id="body", frames=[frame], onPage=draw_page),
        ])
        self.cur_section = ""

    def afterFlowable(self, flowable):
        if isinstance(flowable, SectionMarker):
            self.cur_section = flowable.name


class SectionMarker(Spacer):
    def __init__(self, name):
        super().__init__(1, 0.1)
        self.name = name


def section_banner(title):
    p = Paragraph(rtl(inline(title)), S["sec"])
    t = Table([[p]], colWidths=[CONTENT_W], hAlign="CENTER")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("TOPPADDING", (0, 0), (-1, -1), 11),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
    ]))
    return t


def kpi_band(items):
    cells, widths = [], []
    for v, k in items:
        inner = Table(
            [[Paragraph(rtl(v), S["kpi_v"])], [Paragraph(rtl(k), S["kpi_k"])]],
            colWidths=[CONTENT_W / len(items) - 3],
        )
        inner.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BLUE_XL),
            ("BOX", (0, 0), (-1, -1), 0.5, LINE),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        cells.append(inner)
        widths.append(CONTENT_W / len(items))
    t = Table([cells], colWidths=widths, hAlign="CENTER")
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 1.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 1.5),
    ]))
    return t


# ───────────────────────── build ─────────────────────────
def build():
    global S
    register_fonts()
    S = build_styles()

    story = []

    # ── cover ──
    story.append(Spacer(1, 46 * mm))
    story.append(Paragraph(rtl("BUSINESS PLAN  ·  نسخه ۲"),
                           ParagraphStyle("k", parent=S["cover_kicker"],
                                          textColor=colors.HexColor("#8fb4ff"))))
    story.append(Spacer(1, 7 * mm))
    story.append(Paragraph(rtl("بیزینس‌پلن جامع"),
                           ParagraphStyle("t1", parent=S["cover_title"],
                                          textColor=colors.white)))
    story.append(Paragraph(rtl("فروشگاه پوشاک کودک و نوجوان"),
                           ParagraphStyle("t2", parent=S["cover_title"],
                                          fontSize=20, leading=36,
                                          textColor=colors.HexColor("#9fc0ff"))))
    story.append(Spacer(1, 9 * mm))
    story.append(Paragraph(
        rtl("پرو آنلاین لباس · اتوماسیون کامل شبکه‌های اجتماعی · "
            "سئو و بک‌لینک درجه‌یک · شروع کم‌هزینه روی cPanel"),
        ParagraphStyle("s", parent=S["cover_sub"], textColor=colors.HexColor("#b9c8ea"))))
    story.append(Spacer(1, 34 * mm))
    story.append(Paragraph(
        rtl("۱۱ سند تخصصی  ·  ۸٬۵۰۰+ کلمه  ·  ۲۹ جدول دیتابیس  ·  نقشه راه ۱۸۰ روزه"),
        ParagraphStyle("m", parent=S["cover_meta"], textColor=colors.HexColor("#7f92bb"))))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(rtl("سند محرمانه — مرداد ۱۴۰۵"),
                           ParagraphStyle("m2", parent=S["cover_meta"],
                                          textColor=colors.HexColor("#6d80a8"))))

    story.append(NextPageTemplate("body"))
    story.append(PageBreak())

    # ── executive dashboard ──
    story.append(section_banner("در یک نگاه"))
    story.append(Spacer(1, 8))
    story.append(kpi_band([
        ("۵۵–۲۳۸", "میلیون تومان سرمایه اولیه"),
        ("ماه ۲–۳", "نقطه سربه‌سر"),
        ("۹۰ ثانیه", "عکس تا انتشار"),
    ]))
    story.append(Spacer(1, 6))
    story.append(kpi_band([
        ("زیر ۷٪", "نرخ مرجوعی با پرو آنلاین"),
        ("~۵۰۰ هزار", "هزینه ماهانه زیرساخت اولیه"),
        ("۳۰+", "محتوای خودکار روزانه"),
    ]))
    story.append(Spacer(1, 12))

    story.append(P("این سند، طرح کامل راه‌اندازی یک فروشگاه اینترنتی تخصصی پوشاک کودک و نوجوان "
                   "است با چهار تمایز اصلی نسبت به همه رقبای بازار ایران:", "p"))
    for t in [
        "**پرو آنلاین لباس** روی آواتار کودک — تقریباً هیچ فروشگاه پوشاک کودکی در ایران این را ندارد.",
        "**اتوماسیون کامل**: فروشنده فقط چند عکس ساده می‌فرستد؛ ظرف ۹۰ ثانیه محصول روی سایت و ۱۰ کانال اجتماعی منتشر می‌شود.",
        "**سلطه سئویی** با موتور تولید محتوای هوش مصنوعی — روزی یک مقاله تخصصی، بدون هزینه نیروی انسانی.",
        "**شروع کم‌هزینه روی cPanel** و رشد مرحله‌ای به VPS — سرمایه به‌جای زیرساخت، خرج کالا و تبلیغات می‌شود.",
    ]:
        st = S["li"]
        w = CONTENT_W - st.rightIndent - st.leftIndent - 14
        story.append(Paragraph(
            _bullet_first(rtl_para(inline(t), st.fontName, st.fontSize, w), "• "), st))

    # ── TOC ──
    story.append(Spacer(1, 14))
    story.append(P("فهرست مطالب", "h1"))
    toc_w = CONTENT_W - 18 * mm - 12
    toc_rows = []
    for n, (_, t) in enumerate(DOCS, 1):
        size = S["toc"].fontSize
        while size > 7 and pdfmetrics.stringWidth(shape(t), "Vazir", size) > toc_w:
            size -= 0.4
        stl = ParagraphStyle(f"toc{n}", parent=S["toc"], fontSize=size,
                             leading=size * 2.2)
        toc_rows.append([Paragraph(rtl(t), stl), Paragraph(rtl(str(n)), S["toc_n"])])
    # RTL: number column goes left, title right
    toc_rows = [list(reversed(r)) for r in toc_rows]
    tt = Table(toc_rows, colWidths=[18 * mm, CONTENT_W - 18 * mm], hAlign="CENTER")
    tt.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(tt)

    # ── sections ──
    for fname, title in DOCS:
        path = os.path.join(BASE, fname)
        if not os.path.exists(path):
            continue
        raw = open(path, encoding="utf-8").read()
        # strip the H1 (we render our own banner)
        raw = re.sub(r"^#\s+.*\n", "", raw, count=1)
        story.append(PageBreak())
        story.append(SectionMarker(title))
        story.append(section_banner(title))
        story.append(Spacer(1, 9))
        story += parse_md(raw)

    Doc(OUT).build(story)
    size = os.path.getsize(OUT) / 1024
    print(f"✅ {OUT}  ({size:.0f} KB)")


if __name__ == "__main__":
    build()
