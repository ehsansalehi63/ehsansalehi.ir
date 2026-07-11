import { query } from '../../lib/mysql';

export interface VerificationCode {
  id: number;
  email: string;
  code: string;
  expiresAt: string;
  createdAt: string;
}

export const VerificationCodeModel = {
  async create(email: string, code: string): Promise<any> {
    return query(
      'INSERT INTO verification_codes (email, code, expiresAt) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
      [email, code]
    );
  },

  async getByEmailAndCode(email: string, code: string): Promise<VerificationCode | null> {
    const rows = await query<VerificationCode>(
      'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expiresAt > NOW() ORDER BY createdAt DESC LIMIT 1',
      [email, code]
    );
    return rows.length ? rows[0] : null;
  },

  async deleteByEmail(email: string): Promise<void> {
    await query('DELETE FROM verification_codes WHERE email = ?', [email]);
  },

  async cleanExpired(): Promise<void> {
    await query('DELETE FROM verification_codes WHERE expiresAt < NOW()');
  },
};
