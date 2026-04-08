import { expect, type Page, type Route } from '@playwright/test';

type UserRole = 'USER' | 'ADMIN';
type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

interface MockUser {
  id: number;
  email: string;
  nickname: string;
  role: UserRole;
  createdAt: string;
}

interface MockWorkspace {
  id: number;
  name: string;
  slug: string;
  role: WorkspaceRole;
  createdAt: string;
}

interface MockWorkspaceMember {
  id: number;
  userId: number;
  email: string;
  nickname: string;
  role: WorkspaceRole;
  joinedAt: string;
}

interface MockProject {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

interface MockProjectStats {
  totalEndpoints: number;
  upCount: number;
  downCount: number;
  avgResponseTimeMs: number;
}

interface MockEndpoint {
  id: number;
  projectId: number;
  url: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Record<string, string> | null;
  body: string | null;
  expectedStatusCode: number;
  checkInterval: number;
  isActive: boolean;
  lastCheckedAt: string | null;
  createdAt: string;
}

interface MockSubscription {
  planType: 'FREE' | 'PRO';
  active: boolean;
  expiredAt: string | null;
  maxEndpointsPerProject: number;
  minCheckIntervalSeconds: number;
  maxAlertChannels: number;
  maxMembers: number;
  dataRetentionDays: number;
}

interface MockAdminUser {
  id: number;
  email: string;
  nickname: string;
  role: UserRole;
  createdAt: string;
  deletedAt: string | null;
}

interface MockAlert {
  id: number;
  endpointId: number;
  alertType: 'EMAIL' | 'SLACK';
  target: string;
  threshold: number;
  isActive: boolean;
  createdAt: string;
}

interface MockHealthCheck {
  id: number;
  endpointId: number;
  status: 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'ERROR';
  statusCode: number;
  responseTimeMs: number;
  errorMessage: string | null;
  checkedAt: string;
}

interface MockApiOptions {
  userRole?: UserRole;
  workspaceRole?: WorkspaceRole;
  projects?: MockProject[];
  endpointsByProjectId?: Record<number, MockEndpoint[]>;
  alertsByEndpointId?: Record<number, MockAlert[]>;
}

interface MockState {
  user: MockUser;
  workspaces: MockWorkspace[];
  members: MockWorkspaceMember[];
  subscription: MockSubscription;
  projects: MockProject[];
  endpointsByProjectId: Record<number, MockEndpoint[]>;
  projectStatsById: Record<number, MockProjectStats>;
  alertsByEndpointId: Record<number, MockAlert[]>;
  checksByEndpointId: Record<number, MockHealthCheck[]>;
  adminUsers: MockAdminUser[];
}

const NOW = '2026-03-15T12:00:00.000Z';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

function createFakeJwt(role: UserRole) {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: '1',
      role,
      'User.role': role,
    }),
  );

  return `${header}.${payload}.playwright-signature`;
}

function createState(options: MockApiOptions = {}): MockState {
  const userRole = options.userRole ?? 'USER';
  const workspaceRole = options.workspaceRole ?? 'OWNER';
  const projects = [...(options.projects ?? [])];
  const workspaces: MockWorkspace[] = [
    {
      id: 1,
      name: '개인 워크스페이스',
      slug: 'personal-workspace',
      role: workspaceRole,
      createdAt: NOW,
    },
  ];

  const members: MockWorkspaceMember[] = [
    {
      id: 1,
      userId: 1,
      email: 'owner@example.com',
      nickname: 'Owner',
      role: workspaceRole,
      joinedAt: NOW,
    },
  ];

  return {
    user: {
      id: 1,
      email: 'owner@example.com',
      nickname: 'Owner',
      role: userRole,
      createdAt: NOW,
    },
    workspaces,
    members,
    subscription: {
      planType: 'FREE',
      active: false,
      expiredAt: null,
      maxEndpointsPerProject: 5,
      minCheckIntervalSeconds: 300,
      maxAlertChannels: 2,
      maxMembers: 3,
      dataRetentionDays: 1,
    },
    projects,
    endpointsByProjectId: { ...(options.endpointsByProjectId ?? {}) },
    alertsByEndpointId: { ...(options.alertsByEndpointId ?? {}) },
    checksByEndpointId: {},
    projectStatsById: Object.fromEntries(
      projects.map((project) => [
        project.id,
        {
          totalEndpoints: options.endpointsByProjectId?.[project.id]?.length ?? 0,
          upCount: 0,
          downCount: 0,
          avgResponseTimeMs: 0,
        },
      ]),
    ),
    adminUsers: [
      {
        id: 1,
        email: 'owner@example.com',
        nickname: 'Owner',
        role: userRole,
        createdAt: NOW,
        deletedAt: null,
      },
      {
        id: 2,
        email: 'member@example.com',
        nickname: 'Member',
        role: 'USER',
        createdAt: NOW,
        deletedAt: null,
      },
    ],
  };
}

export async function installMockApi(page: Page, options: MockApiOptions = {}) {
  const state = createState(options);
  let nextProjectId =
    Math.max(100, ...state.projects.map((project) => project.id)) + 1;
  let nextEndpointId = 1000;
  let nextAlertId = 2000;
  let nextCheckId = 3000;
  let nextMemberId =
    Math.max(10, ...state.members.map((m) => m.id)) + 1;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const method = request.method();

    if (pathname === '/api/auth/login' && method === 'POST') {
      return json(route, {
        success: true,
        data: {
          accessToken: createFakeJwt(state.user.role),
          refreshToken: 'playwright-refresh-token',
        },
      });
    }

    if (pathname === '/api/auth/refresh' && method === 'POST') {
      return json(route, {
        success: true,
        data: {
          accessToken: createFakeJwt(state.user.role),
          refreshToken: 'playwright-refresh-token',
        },
      });
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      return json(route, { success: true });
    }

    if (pathname === '/api/users/me' && method === 'GET') {
      return json(route, { success: true, data: state.user });
    }

    if (pathname === '/api/workspaces' && method === 'GET') {
      return json(route, { success: true, data: state.workspaces });
    }

    if (pathname === '/api/workspaces' && method === 'POST') {
      const body = (request.postDataJSON() ?? {}) as { name?: string };
      const createdWorkspace: MockWorkspace = {
        id: state.workspaces.length + 1,
        name: body.name?.trim() || `워크스페이스 ${state.workspaces.length + 1}`,
        slug: `workspace-${state.workspaces.length + 1}`,
        role: 'OWNER',
        createdAt: NOW,
      };
      state.workspaces.push(createdWorkspace);
      return json(route, { success: true, data: createdWorkspace });
    }

    const membersMatch = pathname.match(/^\/api\/workspaces\/(\d+)\/members$/);
    if (membersMatch && method === 'GET') {
      return json(route, { success: true, data: state.members });
    }

    const subscriptionMatch = pathname.match(
      /^\/api\/workspaces\/(\d+)\/subscription$/,
    );
    if (subscriptionMatch && method === 'GET') {
      return json(route, { success: true, data: state.subscription });
    }

    const projectsMatch = pathname.match(/^\/api\/workspaces\/(\d+)\/projects$/);
    if (projectsMatch && method === 'GET') {
      return json(route, { success: true, data: state.projects });
    }

    if (projectsMatch && method === 'POST') {
      const body = (request.postDataJSON() ?? {}) as {
        name?: string;
        description?: string;
      };
      const createdProject: MockProject = {
        id: nextProjectId,
        name: body.name?.trim() || `프로젝트 ${nextProjectId}`,
        description: body.description ?? '',
        createdAt: NOW,
      };

      state.projects.push(createdProject);
      state.endpointsByProjectId[createdProject.id] = [];
      state.projectStatsById[createdProject.id] = {
        totalEndpoints: 0,
        upCount: 0,
        downCount: 0,
        avgResponseTimeMs: 0,
      };
      nextProjectId += 1;

      return json(route, { success: true, data: createdProject });
    }

    const projectDetailMatch = pathname.match(/^\/api\/projects\/(\d+)$/);
    if (projectDetailMatch && method === 'GET') {
      const projectId = Number(projectDetailMatch[1]);
      const project = state.projects.find((item) => item.id === projectId);

      if (!project) {
        return json(route, { success: false, message: 'Project not found.' }, 404);
      }

      return json(route, { success: true, data: project });
    }

    const projectStatsMatch = pathname.match(/^\/api\/projects\/(\d+)\/stats$/);
    if (projectStatsMatch && method === 'GET') {
      const projectId = Number(projectStatsMatch[1]);
      const stats = state.projectStatsById[projectId] ?? {
        totalEndpoints: 0,
        upCount: 0,
        downCount: 0,
        avgResponseTimeMs: 0,
      };

      return json(route, { success: true, data: stats });
    }

    const projectEndpointsMatch = pathname.match(
      /^\/api\/projects\/(\d+)\/endpoints$/,
    );
    if (projectEndpointsMatch && method === 'GET') {
      const projectId = Number(projectEndpointsMatch[1]);
      return json(route, {
        success: true,
        data: state.endpointsByProjectId[projectId] ?? [],
      });
    }

    if (projectEndpointsMatch && method === 'POST') {
      const projectId = Number(projectEndpointsMatch[1]);
      const body = (request.postDataJSON() ?? {}) as {
        url?: string;
        httpMethod?: string;
        expectedStatusCode?: number;
        checkInterval?: number;
        headers?: Record<string, string> | null;
        body?: string | null;
      };
      const created: MockEndpoint = {
        id: nextEndpointId,
        projectId,
        url: body.url ?? 'https://example.com',
        httpMethod: (body.httpMethod as MockEndpoint['httpMethod']) ?? 'GET',
        headers: body.headers ?? null,
        body: body.body ?? null,
        expectedStatusCode: body.expectedStatusCode ?? 200,
        checkInterval: body.checkInterval ?? 300,
        isActive: true,
        lastCheckedAt: null,
        createdAt: NOW,
      };
      if (!state.endpointsByProjectId[projectId]) {
        state.endpointsByProjectId[projectId] = [];
      }
      state.endpointsByProjectId[projectId].push(created);
      state.alertsByEndpointId[created.id] = [];
      state.checksByEndpointId[created.id] = [];
      nextEndpointId += 1;
      return json(route, { success: true, data: created });
    }

    // --- Endpoint detail ---
    const endpointDetailMatch = pathname.match(/^\/api\/endpoints\/(\d+)$/);
    if (endpointDetailMatch && method === 'GET') {
      const endpointId = Number(endpointDetailMatch[1]);
      const endpoint = Object.values(state.endpointsByProjectId)
        .flat()
        .find((e) => e.id === endpointId);
      if (!endpoint) {
        return json(route, { success: false, message: 'Endpoint not found.' }, 404);
      }
      return json(route, { success: true, data: endpoint });
    }

    // --- Manual health check (Test Now) ---
    const testEndpointMatch = pathname.match(/^\/api\/endpoints\/(\d+)\/test$/);
    if (testEndpointMatch && method === 'POST') {
      const endpointId = Number(testEndpointMatch[1]);
      const check: MockHealthCheck = {
        id: nextCheckId++,
        endpointId,
        status: 'SUCCESS',
        statusCode: 200,
        responseTimeMs: 142,
        errorMessage: null,
        checkedAt: NOW,
      };
      if (!state.checksByEndpointId[endpointId]) {
        state.checksByEndpointId[endpointId] = [];
      }
      state.checksByEndpointId[endpointId].unshift(check);
      return json(route, { success: true, data: check });
    }

    // --- Recent checks ---
    const checksMatch = pathname.match(/^\/api\/endpoints\/(\d+)\/checks$/);
    if (checksMatch && method === 'GET') {
      const endpointId = Number(checksMatch[1]);
      return json(route, {
        success: true,
        data: state.checksByEndpointId[endpointId] ?? [],
      });
    }

    // --- Endpoint stats ---
    const endpointStatsMatch = pathname.match(/^\/api\/endpoints\/(\d+)\/stats$/);
    if (endpointStatsMatch && method === 'GET') {
      const endpointId = Number(endpointStatsMatch[1]);
      const checks = state.checksByEndpointId[endpointId] ?? [];
      const successCount = checks.filter((c) => c.status === 'SUCCESS').length;
      return json(route, {
        success: true,
        data: {
          totalChecks: checks.length,
          successCount,
          successRate: checks.length > 0 ? successCount / checks.length : 0,
          avgResponseTimeMs: checks.length > 0
            ? checks.reduce((sum, c) => sum + c.responseTimeMs, 0) / checks.length
            : 0,
          since: NOW,
        },
      });
    }

    // --- Hourly stats ---
    const hourlyStatsMatch = pathname.match(
      /^\/api\/endpoints\/(\d+)\/stats\/hourly$/,
    );
    if (hourlyStatsMatch && method === 'GET') {
      return json(route, { success: true, data: [] });
    }

    // --- Alerts per endpoint ---
    const endpointAlertsMatch = pathname.match(
      /^\/api\/endpoints\/(\d+)\/alerts$/,
    );
    if (endpointAlertsMatch && method === 'GET') {
      const endpointId = Number(endpointAlertsMatch[1]);
      return json(route, {
        success: true,
        data: state.alertsByEndpointId[endpointId] ?? [],
      });
    }

    if (endpointAlertsMatch && method === 'POST') {
      const endpointId = Number(endpointAlertsMatch[1]);
      const body = (request.postDataJSON() ?? {}) as {
        alertType?: string;
        target?: string;
        threshold?: number;
      };
      const alert: MockAlert = {
        id: nextAlertId++,
        endpointId,
        alertType: (body.alertType as MockAlert['alertType']) ?? 'EMAIL',
        target: body.target ?? '',
        threshold: body.threshold ?? 3,
        isActive: true,
        createdAt: NOW,
      };
      if (!state.alertsByEndpointId[endpointId]) {
        state.alertsByEndpointId[endpointId] = [];
      }
      state.alertsByEndpointId[endpointId].push(alert);
      return json(route, { success: true, data: alert });
    }

    // --- Toggle alert ---
    const toggleAlertMatch = pathname.match(/^\/api\/alerts\/(\d+)\/toggle$/);
    if (toggleAlertMatch && method === 'PATCH') {
      const alertId = Number(toggleAlertMatch[1]);
      for (const alerts of Object.values(state.alertsByEndpointId)) {
        const alert = alerts.find((a) => a.id === alertId);
        if (alert) {
          alert.isActive = !alert.isActive;
          return json(route, { success: true, data: alert });
        }
      }
      return json(route, { success: false, message: 'Alert not found.' }, 404);
    }

    // --- Delete alert ---
    const deleteAlertMatch = pathname.match(/^\/api\/alerts\/(\d+)$/);
    if (deleteAlertMatch && method === 'DELETE') {
      const alertId = Number(deleteAlertMatch[1]);
      for (const [epId, alerts] of Object.entries(state.alertsByEndpointId)) {
        const idx = alerts.findIndex((a) => a.id === alertId);
        if (idx !== -1) {
          alerts.splice(idx, 1);
          state.alertsByEndpointId[Number(epId)] = alerts;
          return json(route, { success: true });
        }
      }
      return json(route, { success: false, message: 'Alert not found.' }, 404);
    }

    // --- Invite member ---
    if (membersMatch && method === 'POST') {
      const body = (request.postDataJSON() ?? {}) as {
        email?: string;
        role?: WorkspaceRole;
      };
      const member: MockWorkspaceMember = {
        id: nextMemberId,
        userId: nextMemberId + 100,
        email: body.email ?? 'new@example.com',
        nickname: (body.email ?? 'new@example.com').split('@')[0],
        role: body.role ?? 'MEMBER',
        joinedAt: NOW,
      };
      state.members.push(member);
      nextMemberId += 1;
      return json(route, { success: true, data: member });
    }

    // --- Update user nickname ---
    if (pathname === '/api/users/me' && method === 'PATCH') {
      const body = (request.postDataJSON() ?? {}) as { nickname?: string };
      if (body.nickname) {
        state.user.nickname = body.nickname;
      }
      return json(route, { success: true, data: state.user });
    }

    // --- Change password ---
    if (pathname === '/api/users/me/password' && method === 'PATCH') {
      return json(route, { success: true });
    }

    if (pathname === '/api/admin/users' && method === 'GET') {
      if (state.user.role !== 'ADMIN') {
        return json(route, { success: false, message: 'Forbidden' }, 403);
      }

      return json(route, { success: true, data: state.adminUsers });
    }

    return json(
      route,
      {
        success: false,
        message: `Unhandled mock API route: ${method} ${pathname}`,
      },
      501,
    );
  });

  return state;
}

export async function seedSession(page: Page, userRole: UserRole = 'USER') {
  const accessToken = createFakeJwt(userRole);

  await page.addInitScript(
    ({ token }) => {
      window.localStorage.setItem('accessToken', token);
      window.localStorage.setItem('refreshToken', 'playwright-refresh-token');
      window.localStorage.setItem('currentWorkspaceId', '1');
    },
    { token: accessToken },
  );
}

export async function loginViaUi(page: Page) {
  await page.goto('/ko/login');
  await page.getByLabel('이메일').fill('owner@example.com');
  await page.getByLabel('비밀번호').fill('Password1!');
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL(/\/ko\/dashboard$/);
}
