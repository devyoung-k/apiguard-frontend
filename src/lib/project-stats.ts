import * as projectsApi from '@/lib/api/projects';
import * as healthChecksApi from '@/lib/api/health-checks';
import type { ProjectWithStats } from '@/types/api';

export async function getProjectsWithStats(
  workspaceId: number,
): Promise<ProjectWithStats[]> {
  const projectList = await projectsApi.getProjects(workspaceId);

  const statsResults = await Promise.allSettled(
    projectList.map((project) => healthChecksApi.getProjectStats(project.id)),
  );

  return projectList.map((project, index) => {
    const statsResult = statsResults[index];
    if (statsResult.status === 'fulfilled') {
      return { ...project, stats: statsResult.value };
    }
    return { ...project };
  });
}
