# گزارش وضعیت تاریخچه `main`

> تاریخ بررسی: ۲۰۲۶-۰۸-۰۲ — فقط گزارش، هیچ تغییری روی `main` اعمال نشد.

## خلاصه در یک خط

`main` فقط **۱ کامیت** دارد، در حالی که برنچ کاری `arena/019fb245` **۲۵۵ کامیت** دارد،
و این دو **هیچ جد مشترکی ندارند**. تاریخچه `main` بازنویسی (force-push) شده است.

## شواهد

```
$ git rev-list --count origin/main
1

$ git rev-list --count origin/arena/019fb245-ehsansalehi-ir
255

$ git merge-base origin/main origin/arena/019fb245-ehsansalehi-ir
(خروجی خالی — یعنی هیچ جد مشترکی وجود ندارد)
```

تنها کامیت `main`:

| | |
|---|---|
| SHA | `928de762100f8aed1cf6f1353363fab62a394f2c` |
| پیام | `Create deploy-cpanel.sh` |
| نویسنده | ehsansalehi63 |
| تاریخ | ۱ اوت ۲۰۲۶، ۲۳:۵۲ |

## خبر خوب: محتوا سالم است

اختلاف فایل‌ها بین `main` و برنچ کامل، فقط **۲ فایل** است:

```
$ git diff --name-status origin/main origin/arena/019fb245-ehsansalehi-ir
M   .github/workflows/deploy-mizbanfa.yml
D   tools/deploy-cpanel.sh
```

یعنی **هیچ کد سایتی گم نشده** — کل `app/`، `relay/`، `scripts/` و
`_ARENA_DELIVERABLES/` روی `main` موجود است. فقط *تاریخچه* از بین رفته.

## چه چیزی از دست رفته

- سابقه ۲۵۵ کامیت (چه کسی، کِی، چرا هر تغییر را داد)
- امکان `git blame` و `git bisect` برای پیدا کردن منشأ باگ‌ها
- امکان بازگشت (`revert`) به نسخه‌های قبلی

## چرا احتمالاً اتفاق افتاد

برنچ `arena/019fa2b4` پیامی دارد که ریشه ماجرا را نشان می‌دهد:

> `fix: remove workflow from arena branch to allow push (workflows permission missing), workflow restore pending manual push`

توکن آرنا مجوز `workflows` ندارد، بنابراین هر پوشی که فایل `.github/workflows/*`
داشته باشد رد می‌شود. به‌نظر می‌رسد برای دور زدن این محدودیت، فایل‌ها به‌صورت
دستی از رابط وب گیت‌هاب ساخته شده‌اند و در این مسیر تاریخچه بازنویسی شده است.

## گزینه‌های بازیابی (هیچ‌کدام اجرا نشده — منتظر تأیید شما)

### گزینه ۱ — کاری نکنید (پیشنهاد من فعلاً)
محتوا سالم است. تاریخچه قدیمی در برنچ‌های `arena/*` روی گیت‌هاب **هنوز موجود است**
و از بین نمی‌رود مگر آن‌ها را حذف کنید. هر وقت به `git blame` نیاز داشتید،
از آن برنچ‌ها بخوانید.

> ⚠️ برنچ‌های `arena/*` را حذف نکنید — تنها نسخه تاریخچه هستند.

### گزینه ۲ — پیوند زدن تاریخچه بدون تغییر محتوا
یک کامیت merge می‌سازیم که هر دو تاریخچه را به هم وصل می‌کند، ولی
درخت فایل دقیقاً همان `main` فعلی می‌ماند:

```bash
git checkout main
git merge --allow-unrelated-histories -s ours origin/arena/019fb245-ehsansalehi-ir \
  -m "chore: reattach full project history (content unchanged)"
```
نتیجه: `git log` دوباره ۲۵۶ کامیت نشان می‌دهد، هیچ فایلی عوض نمی‌شود،
و **نیازی به force-push نیست**.

### گزینه ۳ — بازگرداندن کامل
`main` را روی نوک برنچ کامل ببرید و ۲ فایل تفاوت را دوباره اعمال کنید.
نیاز به force-push دارد و ریسک بیشتری دارد. توصیه نمی‌کنم.

## پیشگیری

1. روی `main` محافظت فعال کنید: Settings → Branches → Protect `main`
   → تیک **Do not allow force pushes**.
2. به GitHub App آرنا مجوز `workflows` بدهید تا دیگر نیاز به
   ساخت دستی فایل‌های workflow نباشد.
