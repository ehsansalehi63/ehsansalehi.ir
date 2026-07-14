import { addWatermarkToImage } from './watermark';

export async function sendToLinkedIn(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string
): Promise<{ success: boolean; error?: string }> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN || '';
  let authorUrn = (process.env.LINKEDIN_AUTHOR_URN || 'urn:li:person:ZTB9aAQEHQ').trim();

  if (!accessToken) {
    return { success: false, error: 'توکن LINKEDIN_ACCESS_TOKEN در متغیرهای Vercel یافت نشد یا خالی است.' };
  }

  // اگر URN با urn:li: شروع نشود، پیش‌فرض urn:li:person: اضافه شود
  if (!authorUrn.startsWith('urn:li:')) {
    authorUrn = `urn:li:person:${authorUrn}`;
  }

  try {
    const defaultImage = 'https://ehsansalehi.ir/images/og-image.jpg';
    const imageUrlFinal = imageUrl && !imageUrl.includes('placehold') ? imageUrl : defaultImage;

    const imageRes = await fetch(imageUrlFinal, { signal: AbortSignal.timeout(6000) });
    if (!imageRes.ok) {
      return { success: false, error: `خطا در دانلود بافر تصویر از آدرس ${imageUrlFinal} (HTTP ${imageRes.status})` };
    }
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const watermarkedBuffer = await addWatermarkToImage(imageBuffer, title);

    // 1. ثبت درخواست آپلود تصویر در لینکدین (v2/images)
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
      return { success: false, error: `لینکدین آپلود تصویر (v2/images): HTTP ${uploadRes.status} - ${errorText}` };
    }

    const uploadData = await uploadRes.json();
    const uploadUrl2 = uploadData.uploadUrl;
    const asset = uploadData.image;

    if (!uploadUrl2 || !asset) {
      return { success: false, error: `لینکدین: پاسخ نامعتبر از v2/images: ${JSON.stringify(uploadData)}` };
    }

    // 2. آپلود بافر تصویر روی سرور لینکدین
    const uploadImageRes = await fetch(uploadUrl2, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'image/png',
      },
      body: new Uint8Array(watermarkedBuffer),
    });

    if (!uploadImageRes.ok) {
      const errorText = await uploadImageRes.text();
      return { success: false, error: `لینکدین آپلود بافر تصویر: HTTP ${uploadImageRes.status} - ${errorText}` };
    }

    // 3. ایجاد پست لینکدین (v2/ugcPosts)
    const text = `📰 ${title}\n\n${summary}\n\n🔗 مطالعه کامل در پایگاه اخبار و فناوری: ${link}\n\n#فناوری #هوش_مصنوعی #رمزارز #امنیت_سایبری #IT #Nextjs`;
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
      console.log('✅ لینکدین: پست با کاور زیبا با موفقیت منتشر شد (ID:', result.id, ')');
      return { success: true };
    } else {
      const errorText = await postRes.text();
      return { success: false, error: `لینکدین ایجاد پست (ugcPosts): HTTP ${postRes.status} - ${errorText}` };
    }
  } catch (error: any) {
    return { success: false, error: `لینکدین Exception: ${error?.message || error}` };
  }
}
