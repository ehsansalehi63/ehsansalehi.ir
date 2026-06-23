import { query } from '@/app/lib/mysql';

export const VerificationCodeModel = {
  async create(email: string, code: string) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await query(
      'INSERT INTO verification_codes (email, code, expiresAt) VALUES (?, ?, ?)',
      [email, code, expiresAt]
    );
  },

  async findValid(email: string, code: string) {
    const rows = await query(
      'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expiresAt > NOW()',
      [email, code]
    );
    return (rows as any[])[0] || null;
  },

  async deleteByEmail(email: string) {
    await query('DELETE FROM verification_codes WHERE email = ?', [email]);
  },
};
