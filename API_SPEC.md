# APIGuard Backend API Specification

## 1. Overview

- Base URL: `http://localhost:8080`
- Response envelope: 모든 API는 `ApiResponse<T>` 형태로 응답
- Auth: JWT Bearer
- Header: `Authorization: Bearer {accessToken}`

성공 응답 예시:

```json
{
  "success": true,
  "data": {}
}
```

실패 응답 예시:

```json
{
  "success": false,
  "message": "에러 메시지"
}
```

## 2. Authentication & Authorization

### Public endpoints

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /users/signup`
- `GET /health`
- `GET /error`
- `GET /swagger-ui/**` (dev)
- `GET /v3/api-docs/**` (dev)

### Protected endpoints

- 위 화이트리스트 외 모든 API는 인증 필요
- `/admin/**` 경로는 `ADMIN` 권한 필요

### Authorization notes

- Workspace API는 워크스페이스 멤버십/역할 기반 권한을 사용
- Payment API는 워크스페이스 `OWNER`만 호출 가능
- Project/Endpoint/Check/Alert API는 현재 구현 기준으로 리소스 소유자 중심 권한 검사를 사용
  - 예: 엔드포인트 조회/수정은 프로젝트 소유자만 가능

## 3. Common Error Status

| Status | Meaning                                                      |
| ------ | ------------------------------------------------------------ |
| `400`  | validation 실패, 잘못된 요청, JSON 파싱 오류, 결제 검증 실패 |
| `401`  | 인증 없음, 로그인 실패                                       |
| `402`  | 플랜 제한 초과                                               |
| `403`  | 권한 없음                                                    |
| `404`  | 리소스 없음                                                  |
| `409`  | 중복 이메일, 결제 상태 충돌                                  |
| `502`  | 외부 결제 연동 실패                                          |
| `500`  | 서버 내부 오류                                               |

## 4. Enums

- `Role`: `USER`, `ADMIN`
- `WorkspaceRole`: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`
- `HttpMethod`: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`
- `CheckStatus`: `SUCCESS`, `FAILURE`, `TIMEOUT`, `ERROR`
- `AlertType`: `EMAIL`, `SLACK`
- `PlanType`: `FREE`, `PRO`
- `PaymentStatus`: `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`

## 5. Health

### `GET /health`

- Auth: Public
- Response `200`

```json
{
  "success": true,
  "data": "APIGuard 서버가 정상적으로 구동중입니다."
}
```

### `GET /test-error`

- Auth: Required
- 용도: 예외 핸들러 테스트용

## 6. Auth

### `POST /auth/login`

- Auth: Public

Request

```json
{
  "email": "user@example.com",
  "password": "Password1!"
}
```

Response `200`

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### `POST /auth/refresh`

- Auth: Public

Request

```json
{
  "refreshToken": "eyJ..."
}
```

### `POST /auth/logout`

- Auth: Public

Request

```json
{
  "refreshToken": "eyJ..."
}
```

Response `200`

```json
{
  "success": true
}
```

## 7. User

### `POST /users/signup`

- Auth: Public
- Note: 가입 시 개인 워크스페이스와 FREE 구독이 함께 생성됨

Request

```json
{
  "email": "user@example.com",
  "password": "Password1!",
  "nickname": "홍길동"
}
```

Validation

- `email`: 이메일 형식
- `password`: 8~20자, 대소문자, 숫자, 특수문자 포함
- `nickname`: 2~20자

Response `200`

```json
{
  "success": true,
  "data": 1
}
```

### `GET /users/me`

- Auth: Required

Response `200`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "홍길동",
    "createdAt": "2026-03-09T12:00:00"
  }
}
```

### `PATCH /users/me`

- Auth: Required

Request

```json
{
  "nickname": "새닉네임"
}
```

### `PATCH /users/me/password`

- Auth: Required

Request

```json
{
  "currentPassword": "OldPassword1!",
  "newPassword": "NewPassword1!",
  "newPasswordConfirm": "NewPassword1!"
}
```

### `DELETE /users/me`

- Auth: Required

## 8. Workspace

### `POST /workspaces`

- Auth: Required

Request

```json
{
  "name": "팀 워크스페이스"
}
```

Response item shape

```json
{
  "id": 1,
  "name": "팀 워크스페이스",
  "slug": "team-workspace",
  "role": "OWNER",
  "createdAt": "2026-03-09T12:00:00"
}
```

### `GET /workspaces`

- Auth: Required
- 내 워크스페이스 목록 조회

### `GET /workspaces/{id}`

- Auth: Required
- Permission: workspace member

### `DELETE /workspaces/{id}`

- Auth: Required
- Permission: `OWNER`

### `POST /workspaces/{id}/members`

- Auth: Required
- Permission: `OWNER`, `ADMIN`

Request

```json
{
  "email": "member@example.com"
}
```

Response item shape

```json
{
  "userId": 2,
  "nickname": "member",
  "email": "member@example.com",
  "role": "MEMBER",
  "joinedAt": "2026-03-09T12:10:00"
}
```

### `GET /workspaces/{id}/members`

- Auth: Required
- Permission: workspace member

### `PATCH /workspaces/{id}/members/{userId}/role`

- Auth: Required
- Permission: `OWNER`

Request

```json
{
  "role": "ADMIN"
}
```

### `DELETE /workspaces/{id}/members/{userId}`

- Auth: Required
- Permission: `OWNER`
- Note: `OWNER` 본인 제거 불가

## 9. Project

### `POST /workspaces/{workspaceId}/projects`

- Auth: Required
- Permission: workspace member, 단 `VIEWER` 불가

Request

```json
{
  "name": "API 서버",
  "description": "운영 API 모니터링"
}
```

Response item shape

```json
{
  "id": 1,
  "name": "API 서버",
  "description": "운영 API 모니터링",
  "createdAt": "2026-03-09T12:20:00"
}
```

### `GET /workspaces/{workspaceId}/projects`

- Auth: Required
- Permission: workspace member

### `GET /projects/{id}`

- Auth: Required
- Permission: project owner

### `PATCH /projects/{id}`

- Auth: Required
- Permission:
  - workspace project: project owner 또는 비-`VIEWER` 멤버
  - personal project: project owner

Request

```json
{
  "name": "API 서버 v2",
  "description": "설명 수정"
}
```

### `DELETE /projects/{id}`

- Auth: Required
- Permission: project owner

## 10. Endpoint

### `POST /projects/{projectId}/endpoints`

- Auth: Required
- Permission: project owner

Request

```json
{
  "url": "https://api.example.com/health",
  "httpMethod": "GET",
  "headers": {
    "Authorization": "Bearer xxx"
  },
  "body": null,
  "expectedStatusCode": 200,
  "checkInterval": 300
}
```

Validation / defaults

- `url`: URL 형식
- `expectedStatusCode`: `100` ~ `599`
- `checkInterval`: `1` 이상
- `expectedStatusCode` 미입력 시 기본 `200`
- `checkInterval` 미입력 시 기본 `60`

Response item shape

```json
{
  "id": 1,
  "projectId": 1,
  "url": "https://api.example.com/health",
  "httpMethod": "GET",
  "headers": {
    "Authorization": "Bearer xxx"
  },
  "body": null,
  "expectedStatusCode": 200,
  "checkInterval": 300,
  "active": true,
  "lastCheckedAt": null,
  "createdAt": "2026-03-09T12:30:00"
}
```

### `GET /projects/{projectId}/endpoints`

- Auth: Required
- Permission: project owner

### `GET /endpoints/{id}`

- Auth: Required
- Permission: endpoint owner

### `PUT /endpoints/{id}`

- Auth: Required
- Permission: endpoint owner

Request fields

- `url`
- `httpMethod`
- `headers`
- `body`
- `expectedStatusCode`
- `checkInterval`

모든 필드는 선택이며 전달한 값만 반영됨

### `DELETE /endpoints/{id}`

- Auth: Required
- Permission: endpoint owner

### `PATCH /endpoints/{id}/toggle`

- Auth: Required
- Permission: endpoint owner

## 11. Check

### `POST /endpoints/{id}/test`

- Auth: Required
- Permission: endpoint owner
- Description: 즉시 수동 점검 실행

Response item shape

```json
{
  "id": 1,
  "endpointId": 1,
  "status": "SUCCESS",
  "statusCode": 200,
  "responseTimeMs": 120,
  "errorMessage": null,
  "checkedAt": "2026-03-09T12:35:00"
}
```

### `GET /endpoints/{id}/stats`

- Auth: Required
- Permission: endpoint owner

Response

```json
{
  "success": true,
  "data": {
    "totalChecks": 24,
    "successCount": 23,
    "successRate": 95.8,
    "avgResponseTimeMs": 143.2,
    "since": "2026-03-08T12:35:00"
  }
}
```

### `GET /endpoints/{id}/stats/hourly`

- Auth: Required
- Permission: endpoint owner

Response item shape

```json
{
  "hour": "2026-03-09T11:00:00",
  "checkCount": 6,
  "successCount": 5,
  "avgResponseTimeMs": 140.3
}
```

### `GET /endpoints/{id}/checks?limit=20`

- Auth: Required
- Permission: endpoint owner
- Query:
  - `limit`: 기본값 `20`

### `GET /projects/{id}/stats`

- Auth: Required
- Permission: project owner

Response item shape

```json
{
  "totalEndpoints": 5,
  "upCount": 4,
  "downCount": 1,
  "avgResponseTimeMs": 128.4
}
```

## 12. Alert

### `POST /endpoints/{endpointId}/alerts`

- Auth: Required
- Permission: endpoint owner

Request

```json
{
  "alertType": "EMAIL",
  "target": "ops@example.com",
  "threshold": 3
}
```

Validation / defaults

- `threshold`: `1` 이상
- `threshold` 미입력 시 기본 `3`

Response item shape

```json
{
  "id": 1,
  "endpointId": 1,
  "alertType": "EMAIL",
  "target": "ops@example.com",
  "threshold": 3,
  "active": true,
  "createdAt": "2026-03-09T12:40:00"
}
```

### `GET /endpoints/{endpointId}/alerts`

- Auth: Required
- Permission: endpoint owner

### `PUT /alerts/{id}`

- Auth: Required
- Permission: endpoint owner

Request fields

- `alertType`
- `target`
- `threshold`

### `DELETE /alerts/{id}`

- Auth: Required
- Permission: endpoint owner

### `PATCH /alerts/{id}/toggle`

- Auth: Required
- Permission: endpoint owner

## 13. Subscription & Payment

모든 결제 API는 `/api/workspaces/{workspaceId}` 하위에 있고, 워크스페이스 `OWNER`만 호출할 수 있습니다.

### `GET /api/workspaces/{workspaceId}/subscription`

- Auth: Required
- Permission: workspace `OWNER`

Response

```json
{
  "success": true,
  "data": {
    "planType": "FREE",
    "active": true,
    "expiredAt": null,
    "maxEndpointsPerProject": 5,
    "minCheckIntervalSeconds": 300,
    "maxAlertChannels": 1,
    "maxMembers": 1,
    "dataRetentionDays": 7
  }
}
```

`maxAlertChannels`, `maxMembers`가 `-1`이면 사실상 제한 없음

### `POST /api/workspaces/{workspaceId}/payment/prepare`

- Auth: Required
- Permission: workspace `OWNER`
- Description:
  - 기존 `PENDING` 주문이 있으면 `CANCELLED` 처리
  - 이미 `PRO` active 상태면 `409`

Response

```json
{
  "success": true,
  "data": {
    "orderId": "apiguard-1-abcdef123456",
    "amount": 19900,
    "orderName": "APIGuard PRO 1개월 이용권",
    "clientKey": "test_ck_xxx"
  }
}
```

### `POST /api/workspaces/{workspaceId}/payment/confirm`

- Auth: Required
- Permission: workspace `OWNER`

Request

```json
{
  "paymentKey": "pay_xxx",
  "orderId": "apiguard-1-abcdef123456",
  "amount": 19900
}
```

Validation

- 로컬 주문 존재 여부 확인
- 주문의 워크스페이스 일치 여부 확인
- 주문 상태가 `PENDING`인지 확인
- 요청 금액과 주문 금액 일치 여부 확인
- Toss 응답의 `paymentKey`, `orderId`, `totalAmount` 검증

Response item shape

```json
{
  "id": 1,
  "orderId": "apiguard-1-abcdef123456",
  "paymentKey": "pay_xxx",
  "planType": "PRO",
  "amount": 19900,
  "status": "SUCCESS",
  "paidAt": "2026-03-09T12:50:00"
}
```

### `GET /api/workspaces/{workspaceId}/payment/history`

- Auth: Required
- Permission: workspace `OWNER`

Response item shape

- `PaymentResponse[]`
- `status`: `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`

## 14. Notice

### `GET /notices`

- Auth: Required
- Description: 공지사항 목록 조회

### `GET /notices/{noticeId}`

- Auth: Required

Response item shape

```json
{
  "id": 1,
  "title": "점검 안내",
  "content": "2026-03-10 점검 예정입니다.",
  "pinned": true,
  "createdAt": "2026-03-09T09:00:00",
  "updatedAt": "2026-03-09T09:30:00"
}
```

## 15. Admin

모든 `/admin/**` API는 `ADMIN` 권한이 필요합니다.

### Users

#### `GET /admin/users`

- Auth: Required
- Permission: `ADMIN`

Response item shape

```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "홍길동",
  "role": "USER",
  "createdAt": "2026-03-09T09:00:00",
  "deletedAt": null
}
```

#### `GET /admin/users/{userId}`

- Auth: Required
- Permission: `ADMIN`

#### `PATCH /admin/users/{userId}/role`

- Auth: Required
- Permission: `ADMIN`

Request

```json
{
  "role": "ADMIN"
}
```

허용 값: `USER`, `ADMIN`

#### `DELETE /admin/users/{userId}`

- Auth: Required
- Permission: `ADMIN`

### Notices

#### `POST /admin/notices`

- Auth: Required
- Permission: `ADMIN`
- Response status: `201`

Request

```json
{
  "title": "점검 안내",
  "content": "오늘 22시에 점검합니다.",
  "pinned": true
}
```

#### `PUT /admin/notices/{noticeId}`

- Auth: Required
- Permission: `ADMIN`

#### `DELETE /admin/notices/{noticeId}`

- Auth: Required
- Permission: `ADMIN`
