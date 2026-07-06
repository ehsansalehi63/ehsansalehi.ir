#!/bin/bash

# دریافت پیام commit از کاربر
echo "پیام commit را وارد کنید:"
read commit_msg

# اجرای دستورات
git add .
git commit -m "$commit_msg"
git push origin main
vercel --prod

echo "✅ دیپلوی و پوش با موفقیت انجام شد!"
