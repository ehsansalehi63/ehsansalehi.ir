import { query } from '@/app/lib/mysql';

export interface Project {
  id: number;
  title: string;
  desc: string;
  tech: string;
  link: string;
  createdAt: Date;
}

export const ProjectModel = {
  async create(project: Omit<Project, 'id' | 'createdAt'>) {
    await query(
      'INSERT INTO projects (title, `desc`, tech, link) VALUES (?, ?, ?, ?)',
      [project.title, project.desc, project.tech, project.link]
    );
  },

  async findAll() {
    const rows = await query('SELECT * FROM projects ORDER BY createdAt DESC');
    return rows;
  },

  async findById(id: number) {
    const rows = await query('SELECT * FROM projects WHERE id = ?', [id]);
    return (rows as any[])[0] || null;
  },

  async update(id: number, data: Partial<Project>) {
    const fields = [];
    const values = [];
    if (data.title) { fields.push('title = ?'); values.push(data.title); }
    if (data.desc) { fields.push('`desc` = ?'); values.push(data.desc); }
    if (data.tech) { fields.push('tech = ?'); values.push(data.tech); }
    if (data.link) { fields.push('link = ?'); values.push(data.link); }
    if (fields.length === 0) return null;
    values.push(id);
    await query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(id: number) {
    await query('DELETE FROM projects WHERE id = ?', [id]);
  },
};
