import { addWatermarkToImage } from './watermark';

export async function sendToLinkedIn(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string
): Promise<boolean> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN || '';
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN || 'urn:li:person:ZTB9aAQEHQ';

  if (!accessToken) {
    console.log('⏭️ لینکدین: توکن (LINKEDIN_ACCESS_TOKEN) تنظیم نشده است.');
    return false;
  }

  try {
    const defaultImage = 'https://ehsansalehi.ir/images/og-image.jpg';
    const imageUrlFinal = imageUrl && !imageUrl.includes('placehold') ? imageUrl : defaultImage;

    const imageRes = await fetch(imageUrlFinal, { signal: AbortSignal.timeout(6000) });
    if (!imageRes.ok) {
      console.error(`❌ لینکدین: خطا در دانلود تصویر اصلی (${imageRes.status})`);
      return false;
    }
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const watermarkedBuffer = await addWatermarkToImage(imageBuffer, title);

    // 1. ثبت درخواست آپلود تصویر در لینکدین
    const uploadUrl = 'https://api.linkedin.com/v2/images?action=upload';
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        owner: authorUrn.startsWith('urn:li:') ? authorUrn : `urn:li:person:${authorUrn}`,
      }),
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error('❌ لینکدین: خطا در دریافت آدرس آپلود تصویر:', errorText);
      return false;
    }

    const uploadData = await uploadRes.json();
    const uploadUrl2 = uploadData.uploadUrl;
    const asset = uploadData.image;

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
      console.error('❌ لینکدین: خطا در آپلود بافر تصویر:', errorText);
      return false;
    }

    // 3. ایجاد پست لینکدین
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
        author: authorUrn.startsWith('urn:li:') ? authorUrn : `urn:li:person:${authorUrn}`,
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
      return true;
    } else {
      const errorText = await postRes.text();
      console.error('❌ لینکدین: خطا در انتشار پست:', errorText);
      return false;
    }
  } catch (error: any) {
    console.error('❌ لینکدین error:', error?.message || error);
    return false;
  }
}
