# APIGuard Backend API Specification

## 1. Overview

APIGuard는 외부 API 의존성이 있는 개발팀을 위한 **API Reliability & Contract Change Detection SaaS**입니다.
이 API는 외부 API 장애/응답 지연 감지, 연속 실패 기반 Incident 관리, Redis cooldown 기반 알림 제어, OpenAPI snapshot 비교를 통한 breaking change 감지를 지원합니다.

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
- `GET /status/{slug}`
- `GET /error`
- `GET /swagger-ui/**` (dev)
- `GET /v3/api-docs/**` (dev)

### Protected endpoints

- 위 화이트리스트 외 모든 API는 인증 필요
- `/admin/**` 경로는 `ADMIN` 권한 필요

### Authorization notes

- Workspace API는 워크스페이스 멤버십/역할 기반 권한을 사용
- Payment API는 워크스페이스 `OWNER`만 호출 가능
- Project/Endpoint/Check/Alert/OpenAPI/Status Page API는 워크스페이스 멤버십과 역할 권한을 기준으로 검사
  - `VIEWER`는 조회 중심, 쓰기 작업은 `MEMBER` 이상
  - 삭제성 작업은 도메인별로 `ADMIN` 이상 또는 소유자 권한을 요구

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
- `AlertType`: `EMAIL`, `SLACK`, `WEBHOOK`
- `AlertDeliveryStatus`: `SUCCESS`, `FAILED`
- `IncidentStatus`: `OPEN`, `RESOLVED`
- `IncidentType`: `AVAILABILITY`, `PERFORMANCE`, `CONTRACT_CHANGE`
- `BreakingChangeRule`: `PATH_REMOVED`, `METHOD_REMOVED`, `REQUIRED_PARAMETER_ADDED`, `REQUIRED_REQUEST_BODY_ADDED`, `REQUEST_BODY_REQUIRED_FIELD_ADDED`, `RESPONSE_FIELD_REMOVED`, `RESPONSE_FIELD_TYPE_CHANGED`
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
  "email": "member@example.com",
  "role": "MEMBER"
}
```

Notes

- `role` 생략 시 `MEMBER`로 초대됩니다.
- 초대 요청으로 `OWNER`는 지정할 수 없습니다.
- `ADMIN`은 `MEMBER` 또는 `VIEWER`만 초대할 수 있고, `OWNER`만 `ADMIN` 초대가 가능합니다.

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
  "description": "외부 API Reliability 체크"
}
```

Response item shape

```json
{
  "id": 1,
  "name": "API 서버",
  "description": "외부 API Reliability 체크",
  "createdAt": "2026-03-09T12:20:00"
}
```

### `GET /workspaces/{workspaceId}/projects`

- Auth: Required
- Permission: workspace member

### `GET /projects/{id}`

- Auth: Required
- Permission: workspace member or personal project owner

### `PATCH /projects/{id}`

- Auth: Required
- Permission:
  - workspace project: `MEMBER` 이상
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
- Permission: workspace `ADMIN` or above, or personal project owner

## 10. Endpoint

### `POST /projects/{projectId}/endpoints`

- Auth: Required
- Permission: workspace `MEMBER` or above, or personal project owner

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
  "isActive": true,
  "lastCheckedAt": null,
  "createdAt": "2026-03-09T12:30:00"
}
```

### `GET /projects/{projectId}/endpoints`

- Auth: Required
- Permission: workspace member or personal project owner

### `GET /endpoints/{id}`

- Auth: Required
- Permission: workspace member or personal project owner

### `PUT /endpoints/{id}`

- Auth: Required
- Permission: workspace `MEMBER` or above, or personal project owner

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
- Permission: workspace `ADMIN` or above, or personal project owner

### `PATCH /endpoints/{id}/toggle`

- Auth: Required
- Permission: workspace `MEMBER` or above, or personal project owner

## 11. Check

### `POST /endpoints/{id}/test`

- Auth: Required
- Permission: workspace `MEMBER` or above, or personal project owner
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
- Permission: workspace member or personal project owner

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
- Permission: workspace member or personal project owner

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
- Permission: workspace member or personal project owner
- Query:
  - `limit`: 기본값 `20`

### `GET /projects/{id}/stats`

- Auth: Required
- Permission: workspace member or personal project owner

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
- Permission: workspace `MEMBER` or above, or personal project owner

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
- `alertType`: `EMAIL`, `SLACK`, `WEBHOOK`
- 성공 발송은 Redis cooldown으로 중복 발송을 억제하고, 성공/실패 이력은 별도 저장됩니다.

Response item shape

```json
{
  "id": 1,
  "endpointId": 1,
  "alertType": "EMAIL",
  "target": "ops@example.com",
  "threshold": 3,
  "isActive": true,
  "createdAt": "2026-03-09T12:40:00"
}
```

### `GET /endpoints/{endpointId}/alerts`

- Auth: Required
- Permission: workspace member or personal project owner

### `PUT /alerts/{id}`

- Auth: Required
- Permission: workspace `MEMBER` or above, or personal project owner

Request fields

- `alertType`
- `target`
- `threshold`

### `DELETE /alerts/{id}`

- Auth: Required
- Permission: workspace `MEMBER` or above, or personal project owner

### `PATCH /alerts/{id}/toggle`

- Auth: Required
- Permission: workspace `MEMBER` or above, or personal project owner

### `POST /alerts/{id}/test`

- Auth: Required
- Permission: workspace `MEMBER` or above, or personal project owner
- Description: 알림 대상 채널로 테스트 메시지를 보내고 `testDelivery=true` 발송 이력을 저장합니다.

### `GET /alerts/{id}/deliveries?limit=20`

- Auth: Required
- Permission: workspace member or personal project owner
- Query:
  - `limit`: 기본값 `20`, 최대 `100`

Response item shape

```json
{
  "id": 10,
  "alertId": 1,
  "endpointId": 1,
  "alertType": "WEBHOOK",
  "target": "https://hooks.example.com/apiguard",
  "status": "SUCCESS",
  "testDelivery": true,
  "errorMessage": null,
  "triggeredAt": "2026-05-20T10:00:00"
}
```

## 13. Subscription & Payment

결제 API는 `/api/workspaces/{workspaceId}` 하위에 있습니다. 조회성 API는 워크스페이스 멤버가 호출할 수 있고, 결제 준비/승인/구독 해지는 워크스페이스 `OWNER`만 호출할 수 있습니다.

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
    "maxProjects": 3,
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
- Permission: workspace member

Response item shape

- `PaymentResponse[]`
- `status`: `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`

### `POST /api/workspaces/{workspaceId}/subscription/cancel`

- Auth: Required
- Permission: workspace member
- Description: 활성 PRO 구독을 해지하고 FREE 플랜 상태를 반환합니다. 활성 PRO 구독이 없으면 `409`를 반환합니다.

Response

```json
{
  "success": true,
  "data": {
    "planType": "FREE",
    "active": true,
    "expiredAt": null,
    "maxProjects": 3,
    "maxEndpointsPerProject": 5,
    "minCheckIntervalSeconds": 300,
    "maxAlertChannels": 1,
    "maxMembers": 1,
    "dataRetentionDays": 7
  }
}
```

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

## 16. Incidents

### `GET /projects/{projectId}/incidents`

- Auth: Required
- Query: `status=OPEN|RESOLVED` optional

### `GET /endpoints/{endpointId}/incidents`

- Auth: Required

Response item shape

```json
{
  "id": 1,
  "endpointId": 1,
  "projectId": 1,
  "endpointUrl": "https://api.example.com/health",
  "type": "AVAILABILITY",
  "status": "OPEN",
  "severity": "CRITICAL",
  "title": "Endpoint availability incident",
  "description": "최근 3회 연속 상태 체크가 실패했습니다.",
  "detectedCount": 3,
  "startedAt": "2026-05-13T10:00:00",
  "lastDetectedAt": "2026-05-13T10:02:00",
  "resolvedAt": null
}
```

For `CONTRACT_CHANGE` incidents, `endpointId` and `endpointUrl` are `null` because the event belongs to the OpenAPI spec source and project, not to a single endpoint.

## 17. OpenAPI Spec Changes

### `POST /projects/{projectId}/spec-sources`

- Auth: Required

```json
{
  "name": "Payments API",
  "specUrl": "https://api.example.com/openapi.json"
}
```

### `GET /projects/{projectId}/spec-sources`

- Auth: Required

Response item shape

```json
{
  "id": 1,
  "projectId": 1,
  "name": "Payments API",
  "specUrl": "https://api.example.com/openapi.json",
  "active": true,
  "lastCheckedAt": "2026-05-20T10:00:00",
  "createdAt": "2026-05-13T10:00:00"
}
```

### `PUT /spec-sources/{sourceId}`

- Auth: Required

Request

```json
{
  "name": "Payments API v2",
  "specUrl": "https://api.example.com/openapi-v2.json",
  "active": true
}
```

모든 필드는 선택이며 전달한 값만 반영됩니다.

### `DELETE /spec-sources/{sourceId}`

- Auth: Required

### `PATCH /spec-sources/{sourceId}/toggle`

- Auth: Required

### `POST /spec-sources/{sourceId}/check`

- Auth: Required
- Stores a snapshot and compares it with the previous snapshot.
- Creates or updates an open `CONTRACT_CHANGE` incident when breaking changes are detected.
- 비활성 스펙 소스는 체크할 수 없습니다.

### `GET /spec-sources/{sourceId}/diffs`

- Auth: Required

### `GET /spec-diffs/{diffId}`

- Auth: Required

Response shape

```json
{
  "id": 1,
  "specSourceId": 1,
  "baseSnapshotId": 1,
  "headSnapshotId": 2,
  "breaking": true,
  "breakingChangeCount": 1,
  "summary": "Detected 1 breaking change(s).",
  "checkedAt": "2026-05-13T10:00:00",
  "changes": [
    {
      "id": 1,
      "rule": "METHOD_REMOVED",
      "location": "/users DELETE",
      "description": "기존 method가 삭제되었습니다."
    }
  ]
}
```

## 18. Status Page

### `GET /status/{slug}`

- Auth: Public
- Description: 공개 상태 페이지 조회
- `allEndpoints=true`이면 워크스페이스의 모든 활성 엔드포인트를 노출합니다.
- `allEndpoints=false`이면 `endpointIds`에 포함된 활성 엔드포인트만 노출합니다.
- `allEndpoints=false`와 `endpointIds=[]`를 함께 사용하면 엔드포인트를 노출하지 않습니다.

Response shape

```json
{
  "title": "APIGuard Status",
  "description": "External API dependency status",
  "overallStatus": "OPERATIONAL",
  "endpoints": [
    {
      "url": "https://api.example.com/health",
      "httpMethod": "GET",
      "status": "UP",
      "uptimePercent": 99.9,
      "avgResponseTimeMs": 120.5,
      "lastCheckedAt": "2026-05-20T10:00:00"
    }
  ]
}
```

### `POST /workspaces/{workspaceId}/status-page`

- Auth: Required
- Permission: workspace member, 단 `VIEWER` 불가
- Response status: `201`

Request

```json
{
  "title": "APIGuard Status",
  "description": "External API dependency status",
  "slug": "apiguard-status",
  "allEndpoints": false,
  "endpointIds": [1, 2]
}
```

### `GET /workspaces/{workspaceId}/status-page`

- Auth: Required
- Permission: workspace member

### `PUT /workspaces/{workspaceId}/status-page`

- Auth: Required
- Permission: workspace member, 단 `VIEWER` 불가

Request

```json
{
  "title": "APIGuard Public Status",
  "description": "Selected external API status",
  "isPublic": true,
  "allEndpoints": false,
  "endpointIds": [1]
}
```

### `DELETE /workspaces/{workspaceId}/status-page`

- Auth: Required
- Permission: workspace member, 단 `VIEWER` 불가

Response item shape

```json
{
  "id": 1,
  "slug": "apiguard-status",
  "title": "APIGuard Status",
  "description": "External API dependency status",
  "isPublic": true,
  "createdAt": "2026-05-20T10:00:00",
  "allEndpoints": false,
  "endpointIds": [1, 2]
}
```
