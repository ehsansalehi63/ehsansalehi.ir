import { createSchedule, getJob, listSchedules, updateJob, addDelivery } from '../lib/store.mjs';
import { publishPost } from './publisher.mjs';

const runningTimers = new Map();
const MAX_TIMEOUT_MS = 2_147_483_647;

function clearExisting(jobId) {
  const timer = runningTimers.get(jobId);
  if (timer) {
    clearTimeout(timer);
    runningTimers.delete(jobId);
  }
}

async function executeScheduledJob(jobId) {
  clearExisting(jobId);
  const job = await getJob(jobId);
  if (!job || job.status !== 'scheduled') return;

  await updateJob(jobId, { status: 'running', startedAt: new Date().toISOString() });
  const result = await publishPost(job.workspaceId, {
    title: job.title,
    content: job.content,
    imageUrl: job.imageUrl,
    link: job.link,
    platforms: job.platforms,
    dryRun: false,
  });

  await updateJob(jobId, {
    status: result.ok ? 'completed' : 'failed',
    finishedAt: new Date().toISOString(),
    result,
  });

  await addDelivery(job.workspaceId, {
    type: 'scheduled-job',
    scheduleId: jobId,
    title: job.title,
    platforms: job.platforms,
    results: result.results,
    errors: result.errors,
    source: 'mcp-social-scheduler',
  });
}

export function registerJobTimer(job) {
  clearExisting(job.id);
  if (!job || job.status !== 'scheduled') return;

  const delay = Math.max(0, new Date(job.runAt).getTime() - Date.now());
  const nextDelay = Math.min(delay, MAX_TIMEOUT_MS);

  const timer = setTimeout(() => {
    if (delay > MAX_TIMEOUT_MS) {
      registerJobTimer(job);
      return;
    }

    executeScheduledJob(job.id).catch((error) => {
      console.error('[scheduler] executeScheduledJob failed', error);
    });
  }, nextDelay);

  runningTimers.set(job.id, timer);
}

export async function createScheduledPost(workspaceId, schedule) {
  const record = await createSchedule(workspaceId, schedule);
  registerJobTimer(record);
  return record;
}

export async function hydrateScheduler(workspaceId) {
  const schedules = await listSchedules(workspaceId);
  for (const item of schedules) {
    if (item.status === 'scheduled') registerJobTimer(item);
  }
}
