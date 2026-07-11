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
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN || 'urn:li:person:ZTB9aAQEHQ';

  if (!accessToken) {
    console.log('⏭️ لینکدین: توکن تنظیم نشده');
    return false;
  }

  try {
    // ========== مرحله ۱: دریافت آدرس آپلود ==========
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
      const error = await uploadRes.text();
      console.error('❌ لینکدین: خطا در دریافت آدرس آپلود', error);
      return false;
    }

    const uploadData = await uploadRes.json();
    const uploadUrl2 = uploadData.uploadUrl;
    const asset = uploadData.image;

    // ========== مرحله ۲: آپلود تصویر ==========
    const uploadImageRes = await fetch(uploadUrl2, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'image/png',
      },
      body: coverBuffer,
    });

    if (!uploadImageRes.ok) {
      const error = await uploadImageRes.text();
      console.error('❌ لینکدین: خطا در آپلود تصویر', error);
      return false;
    }

    // ========== مرحله ۳: ایجاد پست ==========
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
      const result = await postRes.json();
      console.log('✅ لینکدین: پست با کاور ارسال شد', result.id);
      return true;
    } else {
      const error = await postRes.text();
      console.error('❌ لینکدین:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ لینکدین error:', error);
    return false;
  }
}
