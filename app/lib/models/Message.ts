import { query } from '@/app/lib/mysql';

export interface Message {
  id: number;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export const MessageModel = {
  async create(name: string, email: string, message: string) {
    await query(
      'INSERT INTO messages (name, email, message, `read`) VALUES (?, ?, ?, ?)',
      [name, email, message, 0]
    );
  },

  async getAll() {
    const rows = await query('SELECT * FROM messages ORDER BY createdAt DESC');
    return rows;
  },
};
