import { query } from '../../lib/mysql';

export interface Message {
  id: number;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const MessageModel = {
  async getAll(): Promise<Message[]> {
    return query<Message>('SELECT * FROM messages ORDER BY createdAt DESC');
  },

  async getById(id: number): Promise<Message | null> {
    const rows = await query<Message>('SELECT * FROM messages WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  },

  async create(data: Omit<Message, 'id' | 'createdAt' | 'read'>): Promise<any> {
    return query(
      'INSERT INTO messages (`name`, `email`, `message`) VALUES (?, ?, ?)',
      [data.name, data.email, data.message]
    );
  },

  async markAsRead(id: number): Promise<void> {
    await query('UPDATE messages SET `read` = true WHERE id = ?', [id]);
  },

  async delete(id: number): Promise<void> {
    await query('DELETE FROM messages WHERE id = ?', [id]);
  },
};
