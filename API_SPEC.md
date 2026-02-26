# ApiGuard API 명세서

## 공통

### Base URL

```
http://localhost:8080
```

### 인증

JWT Bearer 토큰 방식. 로그인 후 발급받은 `accessToken`을 요청 헤더에 포함합니다.

```
Authorization: Bearer {accessToken}
```

> `/auth/**`, `/users/signup`, `/health` 엔드포인트는 인증 불필요.

### 공통 응답 형식

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

오류 시:

```json
{
  "success": false,
  "data": null,
  "message": "오류 메시지"
}
```

### HTTP 상태 코드

| 코드 | 의미                              |
| ---- | --------------------------------- |
| 200  | 성공                              |
| 400  | 잘못된 요청 (유효성 검사 실패 등) |
| 401  | 인증 실패 (토큰 없음 / 만료)      |
| 403  | 권한 없음                         |
| 404  | 리소스 없음                       |
| 402  | 플랜 제한 초과                    |
| 409  | 중복 (이메일 등)                  |
| 502  | 외부 결제 API 오류                |
| 500  | 서버 내부 오류                    |

---

## 1. 인증 (Auth)

### 로그인

```
POST /auth/login
```

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** `200`

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### 토큰 재발급

```
POST /auth/refresh
```

**Request Body**

```json
{
  "refreshToken": "eyJ..."
}
```

**Response** `200`

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### 로그아웃

```
POST /auth/logout
```

**Request Body**

```json
{
  "refreshToken": "eyJ..."
}
```

**Response** `200`

```json
{ "success": true }
```

---

## 2. 사용자 (User)

### 회원가입

```
POST /users/signup
```

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "홍길동"
}
```

**Response** `200`

```json
{
  "success": true,
  "data": 1
}
```

> 회원가입 시 개인 워크스페이스와 FREE 구독이 자동 생성됩니다.

---

### 내 정보 조회

```
GET /users/me
```

🔒 인증 필요

**Response** `200`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "홍길동",
    "createdAt": "2024-01-01T00:00:00"
  }
}
```

---

### 닉네임 변경

```
PATCH /users/me
```

🔒 인증 필요

**Request Body**

```json
{
  "nickname": "새닉네임"
}
```

**Response** `200`

```json
{ "success": true }
```

---

### 비밀번호 변경

```
PATCH /users/me/password
```

🔒 인증 필요

**Request Body**

```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword",
  "newPasswordConfirm": "newPassword"
}
```

**Response** `200`

```json
{ "success": true }
```

---

### 회원 탈퇴

```
DELETE /users/me
```

🔒 인증 필요

**Response** `200`

```json
{ "success": true }
```

---

## 3. 워크스페이스 (Workspace)

> 워크스페이스 역할: `OWNER` > `ADMIN` > `MEMBER` > `VIEWER`

### 워크스페이스 목록 조회

```
GET /workspaces
```

🔒 인증 필요

**Response** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "홍길동의 워크스페이스",
      "slug": "홍길동-1",
      "role": "OWNER",
      "createdAt": "2024-01-01T00:00:00"
    }
  ]
}
```

---

### 워크스페이스 생성

```
POST /workspaces
```

🔒 인증 필요

**Request Body**

```json
{
  "name": "팀 워크스페이스"
}
```

**Response** `200`

```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "팀 워크스페이스",
    "slug": "팀-워크스페이스-1",
    "role": "OWNER",
    "createdAt": "2024-01-01T00:00:00"
  }
}
```

---

### 워크스페이스 상세 조회

```
GET /workspaces/{workspaceId}
```

🔒 인증 필요 (멤버만 조회 가능)

**Response** `200`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "홍길동의 워크스페이스",
    "slug": "홍길동-1",
    "role": "OWNER",
    "createdAt": "2024-01-01T00:00:00"
  }
}
```

---

### 워크스페이스 삭제

```
DELETE /workspaces/{workspaceId}
```

🔒 인증 필요 (OWNER만 가능)

**Response** `200`

```json
{ "success": true }
```

---

### 멤버 목록 조회

```
GET /workspaces/{workspaceId}/members
```

🔒 인증 필요 (멤버만 조회 가능)

**Response** `200`

```json
{
  "success": true,
  "data": [
    {
      "userId": 1,
      "nickname": "홍길동",
      "email": "user@example.com",
      "role": "OWNER",
      "joinedAt": "2024-01-01T00:00:00"
    }
  ]
}
```

---

### 멤버 초대

```
POST /workspaces/{workspaceId}/members
```

🔒 인증 필요 (ADMIN 이상만 가능)

> FREE 플랜은 멤버 초대 불가 (402 응답)

**Request Body**

```json
{
  "email": "invite@example.com"
}
```

**Response** `200`

```json
{
  "success": true,
  "data": {
    "userId": 2,
    "nickname": "김철수",
    "email": "invite@example.com",
    "role": "MEMBER",
    "joinedAt": "2024-01-01T00:00:00"
  }
}
```

---

### 멤버 역할 변경

```
PATCH /workspaces/{workspaceId}/members/{userId}/role
```

🔒 인증 필요 (OWNER만 가능)

**Request Body**

```json
{
  "role": "ADMIN"
}
```

> `role` 가능 값: `OWNER` | `ADMIN` | `MEMBER` | `VIEWER`

**Response** `200`

```json
{
  "success": true,
  "data": {
    "userId": 2,
    "nickname": "김철수",
    "email": "invite@example.com",
    "role": "ADMIN",
    "joinedAt": "2024-01-01T00:00:00"
  }
}
```

---

### 멤버 제거

```
DELETE /workspaces/{workspaceId}/members/{userId}
```

🔒 인증 필요 (OWNER만 가능)

**Response** `200`

```json
{ "success": true }
```

---

## 4. 구독 & 결제 (Subscription & Payment)

### 구독 상태 조회

```
GET /api/workspaces/{workspaceId}/subscription
```

🔒 인증 필요 (멤버 전체)

**Response** `200`

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
    "maxMembers": -1,
    "dataRetentionDays": 7
  }
}
```

> `maxAlertChannels`, `maxMembers`가 `-1`이면 무제한입니다.

| 항목                  | FREE            | PRO        |
| --------------------- | --------------- | ---------- |
| 프로젝트당 엔드포인트 | 5개             | 50개       |
| 최소 점검 주기        | 300초 (5분)     | 60초 (1분) |
| 알림 채널             | 1개             | 무제한     |
| 멤버 수               | 1명 (초대 불가) | 무제한     |
| 데이터 보관           | 7일             | 90일       |

---

### 결제 준비

```
POST /api/workspaces/{workspaceId}/payment/prepare
```

🔒 인증 필요 (OWNER만 가능)

> 이미 PRO 플랜 구독 중이면 400 응답

**Response** `200`

```json
{
  "success": true,
  "data": {
    "orderId": "apiguard-1-a1b2c3d4e5f6",
    "amount": 19900,
    "orderName": "ApiGuard PRO 플랜 (1개월)",
    "clientKey": "test_ck_docs_Ovk5rk1EwkEbP0W43n07xlzm"
  }
}
```

**프론트엔드 결제 플로우**

1. `POST /payment/prepare` 호출 → `orderId`, `clientKey`, `amount` 수신
2. 토스페이먼츠 SDK로 결제창 표시 (`clientKey`, `orderId`, `amount`, `orderName` 전달)
3. 결제 완료 후 토스가 `successUrl`로 리다이렉트 (`paymentKey`, `orderId`, `amount` 쿼리스트링)
4. `POST /payment/confirm` 호출하여 승인 처리

---

### 결제 승인

```
POST /api/workspaces/{workspaceId}/payment/confirm
```

🔒 인증 필요 (OWNER만 가능)

**Request Body**

```json
{
  "paymentKey": "토스에서_받은_paymentKey",
  "orderId": "apiguard-1-a1b2c3d4e5f6",
  "amount": 19900
}
```

**Response** `200`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderId": "apiguard-1-a1b2c3d4e5f6",
    "paymentKey": "토스에서_받은_paymentKey",
    "planType": "PRO",
    "amount": 19900,
    "status": "SUCCESS",
    "paidAt": "2024-01-01T00:00:00"
  }
}
```

---

### 결제 이력 조회

```
GET /api/workspaces/{workspaceId}/payment/history
```

🔒 인증 필요 (멤버 전체)

**Response** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderId": "apiguard-1-a1b2c3d4e5f6",
      "paymentKey": "...",
      "planType": "PRO",
      "amount": 19900,
      "status": "SUCCESS",
      "paidAt": "2024-01-01T00:00:00"
    }
  ]
}
```

> `status` 가능 값: `PENDING` | `SUCCESS` | `FAILED`

---

## 5. 프로젝트 (Project)

### 프로젝트 목록 조회

```
GET /workspaces/{workspaceId}/projects
```

🔒 인증 필요 (멤버만 조회 가능)

**Response** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "프로덕션",
      "description": "메인 서비스",
      "createdAt": "2024-01-01T00:00:00"
    }
  ]
}
```

---

### 프로젝트 생성

```
POST /workspaces/{workspaceId}/projects
```

🔒 인증 필요 (VIEWER 제외)

**Request Body**

```json
{
  "name": "프로덕션",
  "description": "메인 서비스"
}
```

**Response** `200`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "프로덕션",
    "description": "메인 서비스",
    "createdAt": "2024-01-01T00:00:00"
  }
}
```

---

### 프로젝트 상세 조회

```
GET /projects/{id}
```

🔒 인증 필요

**Response** `200`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "프로덕션",
    "description": "메인 서비스",
    "createdAt": "2024-01-01T00:00:00"
  }
}
```

---

### 프로젝트 수정

```
PATCH /projects/{id}
```

🔒 인증 필요 (VIEWER 제외)

**Request Body**

```json
{
  "name": "수정된 이름",
  "description": "수정된 설명"
}
```

**Response** `200`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "수정된 이름",
    "description": "수정된 설명",
    "createdAt": "..."
  }
}
```

---

### 프로젝트 삭제

```
DELETE /projects/{id}
```

🔒 인증 필요 (VIEWER 제외)

**Response** `200`

```json
{ "success": true }
```

---

## 6. 엔드포인트 (Endpoint)

### 엔드포인트 목록 조회

```
GET /projects/{projectId}/endpoints
```

🔒 인증 필요

**Response** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "projectId": 1,
      "url": "https://api.example.com/health",
      "httpMethod": "GET",
      "headers": { "Authorization": "Bearer token" },
      "body": null,
      "expectedStatusCode": 200,
      "checkInterval": 300,
      "isActive": true,
      "lastCheckedAt": "2024-01-01T00:00:00",
      "createdAt": "2024-01-01T00:00:00"
    }
  ]
}
```

---

### 엔드포인트 생성

```
POST /projects/{projectId}/endpoints
```

🔒 인증 필요 (VIEWER 제외)

> FREE 플랜 5개, PRO 플랜 50개 제한. 초과 시 402 응답.

**Request Body**

```json
{
  "url": "https://api.example.com/health",
  "httpMethod": "GET",
  "headers": { "Authorization": "Bearer token" },
  "body": null,
  "expectedStatusCode": 200,
  "checkInterval": 300
}
```

> `httpMethod` 가능 값: `GET` | `POST` | `PUT` | `PATCH` | `DELETE` | `HEAD` | `OPTIONS`
> `checkInterval` 단위: 초 (FREE 최소 300, PRO 최소 60)

**Response** `200`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "projectId": 1,
    "url": "https://api.example.com/health",
    "httpMethod": "GET",
    "headers": { "Authorization": "Bearer token" },
    "body": null,
    "expectedStatusCode": 200,
    "checkInterval": 300,
    "isActive": true,
    "lastCheckedAt": null,
    "createdAt": "2024-01-01T00:00:00"
  }
}
```

---

### 엔드포인트 상세 조회

```
GET /endpoints/{id}
```

🔒 인증 필요

**Response** `200` — 엔드포인트 생성 응답과 동일한 형식

---

### 엔드포인트 수정

```
PUT /endpoints/{id}
```

🔒 인증 필요 (VIEWER 제외)

**Request Body** — 생성 요청과 동일한 형식 (전체 필드 전송)

**Response** `200` — 수정된 엔드포인트 정보

---

### 엔드포인트 삭제

```
DELETE /endpoints/{id}
```

🔒 인증 필요 (VIEWER 제외)

**Response** `200`

```json
{ "success": true }
```

---

### 엔드포인트 활성화/비활성화 토글

```
PATCH /endpoints/{id}/toggle
```

🔒 인증 필요 (VIEWER 제외)

**Response** `200` — 변경된 엔드포인트 정보 (`isActive` 값 반전)

---

## 7. 알림 설정 (Alert)

### 알림 목록 조회

```
GET /endpoints/{endpointId}/alerts
```

🔒 인증 필요

**Response** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "endpointId": 1,
      "alertType": "EMAIL",
      "target": "alert@example.com",
      "threshold": 3,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00"
    }
  ]
}
```

---

### 알림 생성

```
POST /endpoints/{endpointId}/alerts
```

🔒 인증 필요 (VIEWER 제외)

> FREE 플랜 1개, PRO 무제한. 초과 시 402 응답.

**Request Body**

```json
{
  "alertType": "EMAIL",
  "target": "alert@example.com",
  "threshold": 3
}
```

> `alertType` 가능 값: `EMAIL` | `SLACK`
> `target`: EMAIL이면 이메일 주소, SLACK이면 Webhook URL
> `threshold`: 연속 실패 횟수 (이 횟수 이상 실패 시 알림 발송)

**Response** `200`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "endpointId": 1,
    "alertType": "EMAIL",
    "target": "alert@example.com",
    "threshold": 3,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00"
  }
}
```

---

### 알림 수정

```
PUT /alerts/{id}
```

🔒 인증 필요 (VIEWER 제외)

**Request Body**

```json
{
  "alertType": "SLACK",
  "target": "https://hooks.slack.com/...",
  "threshold": 5
}
```

**Response** `200` — 수정된 알림 정보

---

### 알림 삭제

```
DELETE /alerts/{id}
```

🔒 인증 필요 (VIEWER 제외)

**Response** `200`

```json
{ "success": true }
```

---

### 알림 활성화/비활성화 토글

```
PATCH /alerts/{id}/toggle
```

🔒 인증 필요 (VIEWER 제외)

**Response** `200` — 변경된 알림 정보 (`isActive` 값 반전)

---

## 8. 점검 결과 & 통계 (Check)

### 엔드포인트 즉시 테스트

```
POST /endpoints/{id}/test
```

🔒 인증 필요

**Response** `200`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "endpointId": 1,
    "status": "SUCCESS",
    "statusCode": 200,
    "responseTimeMs": 142,
    "errorMessage": null,
    "checkedAt": "2024-01-01T00:00:00"
  }
}
```

> `status` 가능 값: `SUCCESS` | `FAILURE` | `TIMEOUT` | `ERROR`

---

### 엔드포인트 통계 조회

```
GET /endpoints/{id}/stats
```

🔒 인증 필요

**Response** `200`

```json
{
  "success": true,
  "data": {
    "totalChecks": 1440,
    "successCount": 1435,
    "successRate": 99.65,
    "avgResponseTimeMs": 135.2,
    "since": "2024-01-01T00:00:00"
  }
}
```

---

### 시간대별 통계 조회 (최근 24시간)

```
GET /endpoints/{id}/stats/hourly
```

🔒 인증 필요

**Response** `200`

```json
{
  "success": true,
  "data": [
    {
      "hour": "2024-01-01T00:00:00",
      "checkCount": 12,
      "successCount": 12,
      "avgResponseTimeMs": 130.5
    }
  ]
}
```

---

### 최근 점검 이력 조회

```
GET /endpoints/{id}/checks?limit=20
```

🔒 인증 필요

| 파라미터 | 타입    | 기본값 | 설명             |
| -------- | ------- | ------ | ---------------- |
| `limit`  | integer | 20     | 조회할 최대 건수 |

**Response** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "endpointId": 1,
      "status": "SUCCESS",
      "statusCode": 200,
      "responseTimeMs": 142,
      "errorMessage": null,
      "checkedAt": "2024-01-01T00:00:00"
    }
  ]
}
```

---

### 프로젝트 전체 통계 조회

```
GET /projects/{id}/stats
```

🔒 인증 필요

**Response** `200`

```json
{
  "success": true,
  "data": {
    "totalEndpoints": 5,
    "upCount": 4,
    "downCount": 1,
    "avgResponseTimeMs": 150.3
  }
}
```

---

## 부록

### 리소스 계층 구조

```
Workspace
└── Project
    └── Endpoint
        ├── AlertConfig (알림 설정)
        └── CheckResult (점검 결과)

Workspace
├── WorkspaceMember (역할: OWNER / ADMIN / MEMBER / VIEWER)
└── Subscription (FREE / PRO)
    └── Payment (결제 이력)
```

### 자동 점검 스케줄러

- 각 엔드포인트의 `checkInterval`(초) 주기마다 자동 점검 실행
- 점검 실패 시 `threshold` 이상 연속 실패하면 알림 발송
- 매일 새벽 3시: 플랜 보관 기간 초과 점검 결과 자동 삭제

### 플랜별 제한 요약

| 항목                  | FREE  | PRO         |
| --------------------- | ----- | ----------- |
| 프로젝트당 엔드포인트 | 5개   | 50개        |
| 최소 점검 주기        | 300초 | 60초        |
| 알림 채널             | 1개   | 무제한      |
| 워크스페이스 멤버     | 1명   | 무제한      |
| 점검 결과 보관        | 7일   | 90일        |
| 가격                  | 무료  | 19,900원/월 |
