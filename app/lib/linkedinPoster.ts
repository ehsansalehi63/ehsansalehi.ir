/**
 * ارسال خودکار پست با تصویر (کاور هوشمند) به لینکدین
 * نیاز به تنظیم متغیرهای محیطی:
 * - LINKEDIN_ACCESS_TOKEN
 * - LINKEDIN_AUTHOR_URN
 */

export async function sendToLinkedIn(
  title: string,
  summary: string,
  coverBuffer: Buffer,
  link: string
): Promise<boolean> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN || '';
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN || '';

  if (!accessToken || !authorUrn) {
    console.log('⏭️ لینکدین: توکن یا URN تنظیم نشده');
    return false;
  }

  try {
    // ========== مرحله ۱: دریافت آدرس آپلود ==========
    console.log('📤 لینکدین: درخواست آدرس آپلود...');
    const uploadUrl = 'https://api.linkedin.com/v2/images?action=upload';
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        owner: authorUrn,
      }),
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error('❌ لینکدین: خطا در دریافت آدرس آپلود', uploadRes.status, errorText);
      return false;
    }

    const uploadData = await uploadRes.json();
    const uploadUrl2 = uploadData.uploadUrl;
    const asset = uploadData.image;
    console.log('✅ لینکدین: آدرس آپلود دریافت شد');

    // ========== مرحله ۲: آپلود تصویر ==========
    console.log('📤 لینکدین: در حال آپلود تصویر...');
    const uploadImageRes = await fetch(uploadUrl2, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'image/png',
      },
      body: new Uint8Array(coverBuffer),
    });

    if (!uploadImageRes.ok) {
      const errorText = await uploadImageRes.text();
      console.error('❌ لینکدین: خطا در آپلود تصویر', uploadImageRes.status, errorText);
      return false;
    }
    console.log('✅ لینکدین: تصویر با موفقیت آپلود شد');

    // ========== مرحله ۳: ایجاد پست ==========
    console.log('📤 لینکدین: در حال ایجاد پست...');
    const text = `${title}\n\n${summary}\n\n${link}`;
    const postUrl = 'https://api.linkedin.com/v2/ugcPosts';
    const postRes = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: 'IMAGE',
            media: [
              {
                status: 'READY',
                media: asset,
              },
            ],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    if (postRes.ok) {
      console.log('✅ لینکدین: پست با کاور هوشمند ارسال شد');
      return true;
    } else {
      const errorText = await postRes.text();
      console.error('❌ لینکدین: خطا در ایجاد پست', postRes.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ لینکدین error:', error);
    return false;
  }
}
