import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { verifyCron } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

/**
 * POST /api/cron/set-key
 * Saves an API key/setting to the automation_settings table.
 * Uses verifyCron auth (Bearer admin123 or CRON_SECRET).
 *
 * Body: { key: string, value: string }
 * Example: { "key": "openai_api_key", "value": "sk-..." }
 */
export async function POST(request: NextRequest) {
  const authError = verifyCron(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json(
        { error: 'key and value are required' },
        { status: 400 }
      );
    }

    // Only allow specific keys to be set
    const allowedKeys = [
      'openai_api_key',
      'openai_base_url',
      'openai_model',
      'telegram_bot_token',
      'telegram_channel_id',
      'telegram_chat_id',
      'linkedin_access_token',
      'linkedin_author_urn',
      'instagram_access_token',
      'instagram_account_id',
      'mcp_social_url',
      'mcp_social_token',
      'mcp_social_workspace_id',
      'mcp_social_platforms',
      'make_social_webhook_url',
      'make_social_auth_header_name',
      'make_social_auth_header_value',
      'make_social_platforms',
      'make_translate_webhook_url',
      'make_translate_auth_header_name',
      'make_translate_auth_header_value',
    ];

    if (!allowedKeys.includes(key)) {
      return NextResponse.json(
        { error: `Key "${key}" is not allowed. Allowed: ${allowedKeys.join(', ')}` },
        { status: 403 }
      );
    }

    // Upsert into automation_settings
    await pool.execute(
      `INSERT INTO automation_settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, value]
    );

    // Mask the value in the response
    const masked = typeof value === 'string' && value.length > 8
      ? `${value.slice(0, 4)}...${value.slice(-4)}`
      : '***';

    return NextResponse.json({
      success: true,
      message: `Setting "${key}" saved (${masked})`,
    });
  } catch (error: any) {
    console.error('❌ Error saving setting:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
