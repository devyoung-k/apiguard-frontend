// ============================================================
// 공통
// ============================================================

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
}

// ============================================================
// Enums
// ============================================================

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';
export type CheckStatus = 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'ERROR';
export type AlertType = 'EMAIL' | 'SLACK';

// ============================================================
// 인증
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

// ============================================================
// 사용자
// ============================================================

export interface UserResponse {
  id: number;
  email: string;
  nickname: string;
  createdAt: string;
}

export interface UpdateUserRequest {
  nickname?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

// ============================================================
// 프로젝트
// ============================================================

export interface ProjectResponse {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

// ============================================================
// 엔드포인트
// ============================================================

export interface EndpointResponse {
  id: number;
  projectId: number;
  url: string;
  httpMethod: HttpMethod;
  headers: string | null;
  body: string | null;
  expectedStatusCode: number;
  checkInterval: number;
  isActive: boolean;
  lastCheckedAt: string | null;
  createdAt: string;
}

export interface CreateEndpointRequest {
  url: string;
  httpMethod: HttpMethod;
  headers?: string | null;
  body?: string | null;
  expectedStatusCode?: number;
  checkInterval?: number;
}

export interface UpdateEndpointRequest {
  url?: string;
  httpMethod?: HttpMethod;
  headers?: string | null;
  body?: string | null;
  expectedStatusCode?: number;
  checkInterval?: number;
}

// ============================================================
// 헬스체크
// ============================================================

export interface HealthCheckResult {
  id: number;
  endpointId: number;
  status: CheckStatus;
  statusCode: number;
  responseTimeMs: number;
  errorMessage: string | null;
  checkedAt: string;
}

export interface EndpointStats {
  totalChecks: number;
  successCount: number;
  successRate: number;
  avgResponseTimeMs: number;
  since: string;
}

export interface HourlyStats {
  hour: string;
  checkCount: number;
  successCount: number;
  avgResponseTimeMs: number;
}

// --- Composite types ---

export interface ProjectWithStats extends ProjectResponse {
  stats?: ProjectStats;
}

export interface ProjectStats {
  totalEndpoints: number;
  upCount: number;
  downCount: number;
  avgResponseTimeMs: number;
}

// ============================================================
// 알림
// ============================================================

export interface AlertResponse {
  id: number;
  endpointId: number;
  alertType: AlertType;
  target: string;
  threshold: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateAlertRequest {
  alertType: AlertType;
  target: string;
  threshold?: number;
}

export interface UpdateAlertRequest {
  alertType?: AlertType;
  target?: string;
  threshold?: number;
}

// ============================================================
// 워크스페이스 / RBAC
// ============================================================

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface WorkspaceResponse {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: number;
  userId: number;
  email: string;
  nickname: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
}

export interface InviteMemberRequest {
  email: string;
  role: WorkspaceRole;
}

export interface UpdateMemberRoleRequest {
  role: WorkspaceRole;
}

// ============================================================
// 결제 / 플랜
// ============================================================

export type PlanType = 'free' | 'pro';
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'none';

export interface PlanLimits {
  maxProjects: number;
  maxEndpointsPerProject: number;
  minCheckInterval: number;
}

export interface PlanInfo {
  type: PlanType;
  name: string;
  price: number;
  limits: PlanLimits;
  features: string[];
}

export interface SubscriptionResponse {
  planType: PlanType;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}
