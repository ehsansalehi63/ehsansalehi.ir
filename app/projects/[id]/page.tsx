import { notFound } from 'next/navigation';
import { ProjectModel } from '@/lib/models/Project';
import ProjectDetailView from './ProjectDetailView';

export const dynamic = 'force-dynamic';

async function getProject(id: string) {
  try {
    const data = await ProjectModel.getById(parseInt(id, 10));
    return data || null;
  } catch (error) {
    console.error('❌ Error fetching project:', error);
    return null;
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return <ProjectDetailView project={project} />;
}
