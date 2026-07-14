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

  // اگر URN فقط عدد باشد (مثلاً آیدی صفحه شرکتی 135286220 یا آیدی شخص)
  if (!authorUrn.startsWith('urn:li:')) {
    if (process.env.LINKEDIN_COMPANY_ID || process.env.LINKEDIN_IS_COMPANY === 'true' || authorUrn.length > 6) {
      authorUrn = `urn:li:organization:${authorUrn}`;
    } else {
      authorUrn = `urn:li:person:${authorUrn}`;
    }
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

    // تابع داخلی برای اجرای فرایند ثبت و آپلود و انتشار برای یک URN خاص
    const attemptPostForUrn = async (targetUrn: string): Promise<{ success: boolean; error?: string; asset?: string }> => {
      // 1. ثبت درخواست آپلود تصویر در لینکدین (registerUpload)
      const registerUrl = 'https://api.linkedin.com/v2/assets?action=registerUpload';
      const registerRes = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: targetUrn,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }
            ]
          }
        }),
      });

      if (!registerRes.ok) {
        const errorText = await registerRes.text();
        return { success: false, error: `registerUpload روی (${targetUrn}): HTTP ${registerRes.status} - ${errorText}` };
      }

      const registerData = await registerRes.json();
      const uploadUrl2 = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
      const asset = registerData.value?.asset;

      if (!uploadUrl2 || !asset) {
        return { success: false, error: `پاسخ نامعتبر از registerUpload روی (${targetUrn})` };
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
        return { success: false, error: `آپلود بافر تصویر روی (${targetUrn}): HTTP ${uploadImageRes.status} - ${errorText}` };
      }

      // 3. ایجاد پست لینکدین (v2/ugcPosts)
      const text = `📰 ${title}\n\n${summary}\n\n🔗 مطالعه کامل در پایگاه اخبار و فناوری احسان صالحی: ${link}\n\n#فناوری #هوش_مصنوعی #رمزارز #امنیت_سایبری #IT #Nextjs #بلاکچین`;
      const postUrl = 'https://api.linkedin.com/v2/ugcPosts';
      const postRes = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: targetUrn,
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
        console.log(`✅ لینکدین: پست روی ${targetUrn} با کاور اختصاصی منتشر شد (ID: ${result.id})`);
        return { success: true, asset };
      } else {
        const errorText = await postRes.text();
        return { success: false, error: `ایجاد پست روی (${targetUrn}): HTTP ${postRes.status} - ${errorText}` };
      }
    };

    // تلاش اول با authorUrn اصلی (مثلاً صفحه شرکتی urn:li:organization:135286220)
    const firstAttempt = await attemptPostForUrn(authorUrn);
    if (firstAttempt.success) return { success: true };

    // اگر خطای 403 و مربوط به دسترسی سازمان (/author) بود، تلاش دوم به صورت خودکار روی اکانت شخصی (urn:li:person:ZTB9aAQEHQ) انجام شود
    if (firstAttempt.error && firstAttempt.error.includes('processing fields [/author]') && authorUrn.includes('organization')) {
      const personalUrn = 'urn:li:person:ZTB9aAQEHQ';
      console.log(`⚠️ توکن دسترسی انتشار سازمانی (w_organization_social) ندارد، تلاش دوم روی اکانت شخصی (${personalUrn})...`);
      const secondAttempt = await attemptPostForUrn(personalUrn);
      if (secondAttempt.success) {
        return { success: true };
      }
      return { success: false, error: `سازمانی ناموفق (${firstAttempt.error}) | شخصی نیز ناموفق: ${secondAttempt.error}` };
    }

    return firstAttempt;
  } catch (error: any) {
    return { success: false, error: `لینکدین Exception: ${error?.message || error}` };
  }
}
