import { query } from '../../lib/mysql';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  isAdmin: boolean;
  auth_id?: string;
  createdAt: string;
}

export const UserModel = {
  async getAll(): Promise<User[]> {
    return query<User>('SELECT id, name, email, isVerified, isAdmin, createdAt FROM users');
  },

  async getById(id: number): Promise<User | null> {
    const rows = await query<User>('SELECT * FROM users WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  },

  async getByEmail(email: string): Promise<User | null> {
    const rows = await query<User>('SELECT * FROM users WHERE email = ?', [email]);
    return rows.length ? rows[0] : null;
  },

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<any> {
    return query(
      'INSERT INTO users (name, email, password, isVerified, isAdmin, auth_id) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, data.email, data.password, data.isVerified || false, data.isAdmin || false, data.auth_id || null]
    );
  },

  async update(id: number, data: Partial<User>): Promise<void> {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    await query(`UPDATE users SET ${fields} WHERE id = ?`, [...values, id]);
  },

  async delete(id: number): Promise<void> {
    await query('DELETE FROM users WHERE id = ?', [id]);
  },
};
