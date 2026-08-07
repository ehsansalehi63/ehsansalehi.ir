export const TOOL_DEFS = [
  {
    name: 'social.connections.list',
    description: 'List all saved social connections for a workspace.',
    requiredPermission: 'social.connections.read',
    inputSchema: { type: 'object', properties: { workspaceId: { type: 'string', description: 'Arena workspace/account id.' } } },
  },
  {
    name: 'social.connect.start',
    description: 'Start OAuth connection flow for LinkedIn or Instagram and return an auth URL.',
    requiredPermission: 'social.connections.write',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        platform: { type: 'string', enum: ['linkedin', 'instagram'] },
        connectionLabel: { type: 'string', description: 'Optional human label for the connection.' }
      },
      required: ['platform']
    },
  },
  {
    name: 'social.connect.status',
    description: 'Get the current status of one social connection.',
    requiredPermission: 'social.connections.read',
    inputSchema: {
      type: 'object',
      properties: { workspaceId: { type: 'string' }, platform: { type: 'string', enum: ['linkedin', 'instagram', 'telegram', 'facebook'] } },
      required: ['platform']
    },
  },
  {
    name: 'social.make_bridge.configure',
    description: 'Configure Make.com webhook bridge for one or many platforms.',
    requiredPermission: 'social.connections.write',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        platforms: { type: 'array', items: { type: 'string', enum: ['linkedin', 'instagram', 'telegram', 'facebook'] } },
        publishWebhookUrl: { type: 'string', description: 'Make custom webhook URL used for publish actions.' },
        testWebhookUrl: { type: 'string', description: 'Optional Make custom webhook URL used for test actions.' },
        connectionLabel: { type: 'string' },
        authHeaderName: { type: 'string', description: 'Optional extra header name sent to Make.' },
        authHeaderValue: { type: 'string', description: 'Optional extra header value sent to Make.' },
        note: { type: 'string' }
      },
      required: ['publishWebhookUrl']
    },
  },
  {
    name: 'social.telegram.connect',
    description: 'Connect a Telegram bot and target chat/channel.',
    requiredPermission: 'social.connections.write',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        botToken: { type: 'string', description: 'Telegram bot token.' },
        chatId: { type: 'string', description: 'Chat id or @channel username.' },
        connectionLabel: { type: 'string' }
      },
      required: ['botToken', 'chatId']
    },
  },
  {
    name: 'social.disconnect',
    description: 'Disconnect one platform and remove its saved tokens/keys.',
    requiredPermission: 'social.connections.write',
    inputSchema: {
      type: 'object',
      properties: { workspaceId: { type: 'string' }, platform: { type: 'string', enum: ['linkedin', 'instagram', 'telegram', 'facebook'] } },
      required: ['platform']
    },
  },
  {
    name: 'social.refresh.token',
    description: 'Refresh an expiring social token when the provider supports it.',
    requiredPermission: 'social.connections.write',
    inputSchema: {
      type: 'object',
      properties: { workspaceId: { type: 'string' }, platform: { type: 'string', enum: ['linkedin', 'instagram'] } },
      required: ['platform']
    },
  },
  {
    name: 'social.test.connection',
    description: 'Run a live health check against one or all connected platforms.',
    requiredPermission: 'social.diagnostics.read',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        platform: { type: 'string', enum: ['linkedin', 'instagram', 'telegram', 'facebook'] }
      }
    },
  },
  {
    name: 'social.import.legacy_settings',
    description: 'Import existing social credentials from the legacy automation_settings table into MCP connections.',
    requiredPermission: 'social.connections.write',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        platforms: { type: 'array', items: { type: 'string', enum: ['linkedin', 'instagram', 'telegram'] } },
        verify: { type: 'boolean', description: 'If true, run live verification after import.' }
      }
    },
  },
  {
    name: 'social.publish.post',
    description: 'Publish a post to one or many social platforms now.',
    requiredPermission: 'social.publish',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        platforms: { type: 'array', items: { type: 'string', enum: ['linkedin', 'instagram', 'telegram', 'facebook'] } },
        title: { type: 'string' },
        content: { type: 'string' },
        imageUrl: { type: 'string' },
        link: { type: 'string' },
        dryRun: { type: 'boolean', description: 'If true, no live publish is executed.' }
      },
      required: ['platforms', 'title', 'content']
    },
  },
  {
    name: 'social.schedule.post',
    description: 'Schedule one post to publish later.',
    requiredPermission: 'social.schedule',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
        platforms: { type: 'array', items: { type: 'string', enum: ['linkedin', 'instagram', 'telegram', 'facebook'] } },
        title: { type: 'string' },
        content: { type: 'string' },
        imageUrl: { type: 'string' },
        link: { type: 'string' },
        runAt: { type: 'string', description: 'ISO-8601 timestamp.' }
      },
      required: ['platforms', 'title', 'content', 'runAt']
    },
  },
  {
    name: 'social.publish.status',
    description: 'Read the status of a scheduled or executed publish job.',
    requiredPermission: 'social.schedule',
    inputSchema: {
      type: 'object',
      properties: { workspaceId: { type: 'string' }, jobId: { type: 'string' } },
      required: ['jobId']
    },
  },
  {
    name: 'social.cancel.scheduled_post',
    description: 'Cancel a pending scheduled post.',
    requiredPermission: 'social.schedule',
    inputSchema: {
      type: 'object',
      properties: { workspaceId: { type: 'string' }, jobId: { type: 'string' } },
      required: ['jobId']
    },
  },
  {
    name: 'social.diagnostics',
    description: 'Return connection, delivery and scheduling diagnostics for a workspace.',
    requiredPermission: 'social.diagnostics.read',
    inputSchema: { type: 'object', properties: { workspaceId: { type: 'string' } } },
  }
];

export function getToolDef(name) {
  return TOOL_DEFS.find((tool) => tool.name === name) || null;
}

export const RESOURCE_DEFS = [
  { uri: 'social://connections', name: 'Connections', description: 'Current social connections snapshot.' },
  { uri: 'social://scheduled-posts', name: 'Scheduled Posts', description: 'Future scheduled posts.' },
  { uri: 'social://recent-deliveries', name: 'Recent Deliveries', description: 'Latest publish results.' },
  { uri: 'social://diagnostics', name: 'Diagnostics', description: 'Connection and delivery diagnostics.' }
];

export const PROMPT_DEFS = [
  {
    name: 'social.publish_multichannel',
    description: 'Prepare one social post for LinkedIn, Instagram and Telegram.',
    arguments: [
      { name: 'topic', required: true },
      { name: 'cta', required: false },
      { name: 'link', required: false }
    ]
  },
  {
    name: 'social.connection_audit',
    description: 'Audit current connections and suggest what must be reconnected.',
    arguments: [{ name: 'workspaceId', required: false }]
  }
];
