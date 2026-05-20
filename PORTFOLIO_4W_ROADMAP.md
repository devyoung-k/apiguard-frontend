# APIGuard Portfolio 4-Week Roadmap

## Goal
현재 프로젝트를 단순 CRUD/상태 체크 대시보드가 아니라, 외부 API 장애와 계약 변경을 감지하는 실무형 SaaS 포트폴리오로 끌어올린다.

핵심 강화 축:
- 멀티테넌시/권한
- 결제/플랜
- Reliability 체크와 Incident lifecycle
- OpenAPI Contract Change Detection
- Redis cooldown 기반 알림 피로도 제어
- 테스트/운영 신뢰성

---

## Week 1: Multi-tenant + RBAC + Admin Foundation

### Scope
- Workspace(조직) 모델 도입
- Role 기반 권한 체계 추가
  - `owner`, `admin`, `member`, `viewer`
- 멤버 초대/조회/역할 변경 UI
- 관리자 기본 페이지(멤버 관리)

### Deliverables
- 워크스페이스 단위 데이터 접근 제어
- 권한 체크 서버 가드
- 관리자 화면 진입/액션 권한 분리

### Done Criteria
- 권한 없는 사용자는 서버에서 `403` 응답
- `owner/admin`만 멤버 역할 변경 가능
- `member/viewer`는 관리자 액션 버튼 비노출 + 서버 차단

---

## Week 2: Billing + Subscription Plans

### Scope
- Toss Payments 결제 연동
- 플랜 모델 추가 (예: Free/Pro)
- 플랜 제한 로직
  - 프로젝트 수 제한
  - 엔드포인트 수 제한
  - 체크 주기 제한
- 결제 상태 화면 및 업그레이드 UX
- 결제 성공/실패 콜백 처리
  - 결제 준비 주문 생성
  - 결제 승인 검증
  - 구독 상태 반영

### Deliverables
- 결제 연동 및 구독 상태 동기화
- 플랜 제한 서버 강제
- UI 제한 안내/업그레이드 유도

### Done Criteria
- 결제 완료 후 플랜이 자동 반영
- 제한 초과 요청은 서버에서 차단
- UI에서 제한 사유가 명확히 표시됨

---

## Week 3: Reliability & Contract Change Detection Core

### Scope
- Health Check 병렬 실행 안정화
- 재시도/백오프 정책 구현
- Timeout/실패 처리 고도화
- Incident open/resolved lifecycle 검증
- 알림 규칙 엔진 개선
  - 연속 실패 N회
  - 쿨다운(cooldown)
  - 중복 알림 억제
- OpenAPI breaking change rule 보강
  - path/method 삭제
  - required parameter/body 추가
  - response field 삭제/type 변경
- 감사 로그(audit log) 기록

### Deliverables
- 백그라운드 체크 실행 안정화
- 노이즈 줄인 알림 정책
- 계약 변경 감지 이력과 Incident 연결
- 주요 액션 감사 로그

### Done Criteria
- 장애 상황에서 알림 과다 발송 방지
- 동일 장애에 대해 중복 알림 억제 확인
- API가 살아 있어도 breaking change가 있으면 별도 이력으로 확인 가능
- 관리자 액션 로그 추적 가능

---

## Week 4: Reliability + Portfolio Packaging

### Scope
- E2E 테스트
  - 로그인
  - 언어 전환
  - 권한 시나리오
  - 결제 플로우
  - 엔드포인트 CRUD
  - OpenAPI breaking change 감지 플로우
- 통합 테스트
  - RBAC 가드
  - 플랜 제한
  - 웹훅 처리
- CI 파이프라인
  - `lint`
  - `tsc`
  - `test`
  - `build`
- 문서/데모 마감
  - 아키텍처 다이어그램
  - 트레이드오프 설명
  - 3~5분 시연 영상

### Deliverables
- 자동화된 품질 게이트
- 재현 가능한 데모/문서
- 채용 제출용 패키지

### Done Criteria
- PR 기준 자동 검증 통과
- 배포 링크 + 테스트 계정 + 데모 영상 준비 완료
- README에서 설계 선택 이유를 설명 가능

---

## Submission Package Checklist

- 배포 URL
- 테스트 계정 2종 (`owner`, `member`)
- 관리자 페이지 스크린샷
- 결제/플랜 제한 시나리오 영상
- CI 배지 + 테스트 결과
- 아키텍처 1장 다이어그램

---

## Priority (if time is tight)

1. Week 1 (RBAC)  
2. Week 2 (Billing/Plans)  
3. Week 4 (Tests/CI)  
4. Week 3 (Reliability/Contract core)

> 이유: 채용 임팩트 기준으로 권한/결제/검증 자동화가 가장 빠르게 신뢰도를 올린다.

---

## Progress Log

### 2026-05-20

- 기능 보강을 진행했습니다.
  - 워크스페이스 초대 시 `MEMBER`, `VIEWER`, 조건부 `ADMIN` 역할 선택 지원
  - 알림 채널에 `WEBHOOK` 추가, 테스트 발송과 발송 성공/실패 이력 화면 추가
  - OpenAPI 스펙 소스 수정, 삭제, 활성화 토글 지원
  - Status Page에 공개 엔드포인트 선택 기능 추가
  - Billing 화면에서 PRO 구독 해지 지원
- API 문서를 최신화했습니다.
  - 알림 발송 이력, 스펙 소스 관리, Status Page 엔드포인트 선택, 구독 해지, 초대 역할 계약 반영
- 검증: 백엔드 `./gradlew test`, `./gradlew bootJar`, 프론트 `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm exec playwright test` 통과.
- 프론트 운영 환경을 Node 24 + pnpm 11.1.3으로 맞추고, Next.js 16 production build는 Node 24에서 안정적인 Webpack 모드로 고정했습니다.
- Pretendard variable font를 로컬 self-host로 적용해 빌드와 런타임이 외부 폰트 네트워크에 의존하지 않도록 정리했습니다.
- Oracle 서버에 프론트 standalone Docker 배포를 추가하고, Caddy에서 기존 API 도메인을 프론트/백엔드 경로별로 라우팅하도록 구성했습니다.

### 2026-05-18

- 제품 메시지를 `API Reliability & Contract Change Detection SaaS`로 통일했습니다.
- README에 Problem, Key Scenarios, Positioning 섹션을 추가해 외부 API 장애·응답 지연·계약 변경 감지 SaaS임을 먼저 설명하도록 바꿨습니다.
- 화면 문구를 보강했습니다.
  - Sidebar tagline: `Reliability & Contracts`
  - Dashboard: 외부 API 장애, 응답 지연, 계약 변경 신호 추적
  - Spec Changes: `API Contract Changes`
  - Alerts: 연속 실패 기반 알림과 cooldown 중복 알림 제어
- 로그인/회원가입/사이드바의 방패 아이콘을 `Activity` 아이콘으로 교체해 보안 제품처럼 보이는 인상을 줄였습니다.
- 프론트 플랜 표시를 백엔드 정책과 맞췄습니다.
  - Free: 7-day history
  - Pro: 50 endpoints per project, 1-minute check interval
- API Spec에서 제품 목적을 추가하고 `CONTRACT_CHANGE` incident 설명 위치를 Incidents 섹션으로 옮겼습니다.
- 검증: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` 통과.
