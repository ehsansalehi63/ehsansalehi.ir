import { query } from '../../lib/mysql';

export interface Project {
  id: number;
  title: string;
  desc: string;
  tech: string;
  link: string;
  image_url: string;
  createdAt: string;
}

export const ProjectModel = {
  async getAll(): Promise<Project[]> {
    return query<Project>('SELECT * FROM projects ORDER BY createdAt DESC');
  },

  async getById(id: number): Promise<Project | null> {
    const rows = await query<Project>('SELECT * FROM projects WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  },

  async create(data: Omit<Project, 'id' | 'createdAt'>): Promise<any> {
    return query(
      'INSERT INTO projects (title, desc, tech, link, image_url) VALUES (?, ?, ?, ?, ?)',
      [data.title, data.desc, data.tech, data.link, data.image_url]
    );
  },

  async update(id: number, data: Partial<Project>): Promise<void> {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    await query(`UPDATE projects SET ${fields} WHERE id = ?`, [...values, id]);
  },

  async delete(id: number): Promise<void> {
    await query('DELETE FROM projects WHERE id = ?', [id]);
  },
};
