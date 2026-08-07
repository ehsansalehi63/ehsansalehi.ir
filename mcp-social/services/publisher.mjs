import { publishToLinkedIn, testLinkedInConnection } from '../connectors/linkedin.mjs';
import { publishToInstagram, testInstagramConnection } from '../connectors/instagram.mjs';
import { publishToTelegram, testTelegramConnection } from '../connectors/telegram.mjs';
import { addDelivery } from '../lib/store.mjs';

const PLATFORM_MAP = {
  linkedin: {
    publish: publishToLinkedIn,
    test: testLinkedInConnection,
  },
  instagram: {
    publish: publishToInstagram,
    test: testInstagramConnection,
  },
  telegram: {
    publish: publishToTelegram,
    test: testTelegramConnection,
  },
};

export const SUPPORTED_PLATFORMS = Object.keys(PLATFORM_MAP);

export async function testPlatforms(workspaceId, platforms = SUPPORTED_PLATFORMS) {
  const results = {};
  for (const platform of platforms) {
    const handler = PLATFORM_MAP[platform]?.test;
    if (!handler) {
      results[platform] = { ok: false, error: 'Unsupported platform' };
      continue;
    }
    results[platform] = await handler(workspaceId);
  }
  return results;
}

export async function publishPost(workspaceId, payload) {
  const platforms = Array.isArray(payload.platforms) && payload.platforms.length ? payload.platforms : SUPPORTED_PLATFORMS;

  const results = {};
  const errors = {};
  for (const platform of platforms) {
    const handler = PLATFORM_MAP[platform]?.publish;
    if (!handler) {
      results[platform] = { ok: false, error: 'Unsupported platform' };
      errors[platform] = 'Unsupported platform';
      continue;
    }

    if (payload.dryRun) {
      results[platform] = {
        ok: true,
        dryRun: true,
        preview: {
          title: payload.title,
          content: payload.content,
          imageUrl: payload.imageUrl || null,
          link: payload.link || null,
        },
      };
      continue;
    }

    const response = await handler(workspaceId, payload);
    results[platform] = response;
    if (!response.ok) {
      errors[platform] = response.error || 'Unknown publish error';
    }
  }

  const delivery = await addDelivery(workspaceId, {
    type: payload.dryRun ? 'dry-run' : 'publish',
    title: payload.title,
    platforms,
    results,
    errors,
    source: 'mcp-social',
  });

  return {
    ok: Object.values(results).some((item) => item?.ok),
    deliveryId: delivery.id,
    results,
    errors,
  };
}
