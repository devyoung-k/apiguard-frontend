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

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
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
