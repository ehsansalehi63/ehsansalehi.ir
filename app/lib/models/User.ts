import { query } from '@/app/lib/mysql';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  createdAt: Date;
}

export const UserModel = {
  async create(user: Omit<User, 'id' | 'createdAt'>) {
    const result = await query(
      'INSERT INTO users (name, email, password, isVerified) VALUES (?, ?, ?, ?)',
      [user.name, user.email, user.password, user.isVerified ? 1 : 0]
    );
    return result;
  },

  async findByEmail(email: string) {
    const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
    return (rows as any[])[0] || null;
  },

  async findById(id: number) {
    const rows = await query('SELECT * FROM users WHERE id = ?', [id]);
    return (rows as any[])[0] || null;
  },

  async verify(email: string) {
    await query('UPDATE users SET isVerified = 1 WHERE email = ?', [email]);
  },
};
