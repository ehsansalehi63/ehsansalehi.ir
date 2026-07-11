/**
 * ارسال خودکار پست به لینکدین
 * نیاز به تنظیم متغیرهای محیطی:
 * - LINKEDIN_ACCESS_TOKEN
 * - LINKEDIN_AUTHOR_URN
 */

export async function sendToLinkedIn(
  title: string,
  summary: string,
  link: string
): Promise<boolean> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN || '';
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN || '';

  if (!accessToken || !authorUrn) {
    console.log('⏭️ لینکدین: توکن یا URN تنظیم نشده');
    return false;
  }

  try {
    const text = `${title}\n\n${summary}\n\n${link}`;
    const url = 'https://api.linkedin.com/v2/ugcPosts';

    const response = await fetch(url, {
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
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    if (response.ok) {
      console.log('✅ لینکدین: پست ارسال شد');
      return true;
    } else {
      const error = await response.text();
      console.error('❌ لینکدین:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ لینکدین error:', error);
    return false;
  }
}
