import { publishToLinkedIn, testLinkedInConnection } from '../connectors/linkedin.mjs';
import { publishToInstagram, testInstagramConnection } from '../connectors/instagram.mjs';
import { publishToTelegram, testTelegramConnection } from '../connectors/telegram.mjs';
import { publishViaMakeBridge, testMakeBridgeConnection } from '../connectors/make-bridge.mjs';
import { addDelivery, getConnection } from '../lib/store.mjs';

const DIRECT_PLATFORM_MAP = {
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

export const SUPPORTED_PLATFORMS = ['linkedin', 'instagram', 'telegram', 'facebook'];

async function resolveHandlers(workspaceId, platform) {
  const connection = await getConnection(workspaceId, platform);
  if (String(connection?.provider || '').startsWith('make')) {
    return {
      provider: connection.provider,
      publish: (payload) => publishViaMakeBridge(workspaceId, platform, payload),
      test: () => testMakeBridgeConnection(workspaceId, platform),
    };
  }

  const direct = DIRECT_PLATFORM_MAP[platform];
  if (!direct) return null;
  return {
    provider: connection?.provider || platform,
    publish: (payload) => direct.publish(workspaceId, payload),
    test: () => direct.test(workspaceId),
  };
}

export async function testPlatforms(workspaceId, platforms = SUPPORTED_PLATFORMS) {
  const results = {};
  for (const platform of platforms) {
    const handlers = await resolveHandlers(workspaceId, platform);
    if (!handlers) {
      results[platform] = { ok: false, error: 'Unsupported platform' };
      continue;
    }
    results[platform] = await handlers.test();
  }
  return results;
}

export async function publishPost(workspaceId, payload) {
  const platforms = Array.isArray(payload.platforms) && payload.platforms.length ? payload.platforms : SUPPORTED_PLATFORMS;

  const results = {};
  const errors = {};
  for (const platform of platforms) {
    const handlers = await resolveHandlers(workspaceId, platform);
    if (!handlers) {
      results[platform] = { ok: false, error: 'Unsupported platform' };
      errors[platform] = 'Unsupported platform';
      continue;
    }

    if (payload.dryRun) {
      results[platform] = {
        ok: true,
        dryRun: true,
        provider: handlers.provider,
        preview: {
          title: payload.title,
          content: payload.content,
          imageUrl: payload.imageUrl || null,
          link: payload.link || null,
        },
      };
      continue;
    }

    const response = await handlers.publish(payload);
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
