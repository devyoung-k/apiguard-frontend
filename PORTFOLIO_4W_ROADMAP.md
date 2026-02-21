# APIGuard Portfolio 4-Week Roadmap

## Goal
현재 프로젝트를 단순 CRUD 대시보드에서, 실무형 SaaS 포트폴리오 수준으로 끌어올린다.

핵심 강화 축:
- 멀티테넌시/권한
- 결제/플랜
- 비동기 모니터링 로직
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
- Stripe 구독 연동
- 플랜 모델 추가 (예: Free/Pro)
- 플랜 제한 로직
  - 프로젝트 수 제한
  - 엔드포인트 수 제한
  - 체크 주기 제한
- 결제 상태 화면 및 업그레이드 UX
- Stripe Webhook 처리
  - `checkout.session.completed`
  - `invoice.paid`
  - `customer.subscription.updated`

### Deliverables
- 결제 연동 및 구독 상태 동기화
- 플랜 제한 서버 강제
- UI 제한 안내/업그레이드 유도

### Done Criteria
- 결제 완료 후 플랜이 자동 반영
- 제한 초과 요청은 서버에서 차단
- UI에서 제한 사유가 명확히 표시됨

---

## Week 3: Monitoring Core Complexity

### Scope
- Health Check 비동기 작업 큐 도입
- 재시도/백오프 정책 구현
- Timeout/실패 처리 고도화
- 알림 규칙 엔진 개선
  - 연속 실패 N회
  - 쿨다운(cooldown)
  - 중복 알림 억제
- 감사 로그(audit log) 기록

### Deliverables
- 백그라운드 체크 실행 안정화
- 노이즈 줄인 알림 정책
- 주요 액션 감사 로그

### Done Criteria
- 장애 상황에서 알림 과다 발송 방지
- 동일 장애에 대해 중복 알림 억제 확인
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
4. Week 3 (Advanced monitoring)

> 이유: 채용 임팩트 기준으로 권한/결제/검증 자동화가 가장 빠르게 신뢰도를 올린다.
