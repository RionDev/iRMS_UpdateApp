# iRMS 업데이트 App

업데이트 앱 — 배포 설정 · 배포 상태 조회. API 는 BE `update_service`(`/api/update/*`).

## 책임

- 배포 현황(왼쪽 엔진: 현재 태그 · 시그널 / 오른쪽 패턴: 정기 배포 · 수동 요청) · 배포 기록 조회, 배포 대상 · 배포 시각 편집, 패턴 수동 빌드 · 배포 요청
- 엔진 배포 자체는 하지 않는다 — GitLab(master 머지 → CI · qc job) → autoflow → postmark 가 한다. **시그널 재시도 버튼은 두지 않는다** (2026-11-18 결정, 다시 내보내려면 GitLab 에서 새로 릴리스)

## 고유 규칙

- 독립 실행 시 Vite dev server 포트 3009 사용
- 게이트웨이 경로: `/update/`
- 화면 틀은 `components/PageShell`(앱 권한 + 메뉴), 목록은 `components/PagedTable` + common `usePagedNav`
- 상태값 라벨 · 색은 `src/constants.ts` 한 곳 (숫자 뜻은 iRMS_DB `14-deploy.sql` COMMENT)
- FIRST 행(`is_first`)은 회색 FIRST 표 + 흐린 행으로 autoflow 시그널과 구분
- GitLab 링크 · 다운로드 링크는 두지 않는다(프로젝트가 비공개라 GitLab 로그인 없이는 안 열림, 2026-11-19 결정). 상태만 보여 준다
- 배포 현황은 한 화면 두 칸(`pages/StatusPage` = `panels/EnginePanel` + `panels/PatternPanel`). 칸이 좁아 문제가 되면 화면을 나눈다
- 배포 대상 끄기 · module_name 변경 · 배포 시각 변경은 postmark 가 바로 반영하므로 확인 모달에 영향(READY 신호 실패, 오늘 한 번 더 배포)을 적는다

- 데몬 정책 화면(`pages/PoliciesPage`)은 BE 가 주는 키 명세(범위 · 정규식 · 읽기 전용 이유 · 짝)로 칸을 그리고 `utils/policy.ts` 로 먼저 검사한다. 규칙의 정본은 BE `policy_spec.py` — FE 에 키 목록을 따로 두지 않는다

## 앱·기능 권한 (필수)

- 페이지 진입은 `useAppAccess("/update")`, **API 를 부르는 메뉴·버튼은 모두 `useFeatures("/update").can(<기능 키>)` 로 숨긴다**
- 역할(`user.role === ...`)로 직접 분기하지 않는다 — 직위·팀 제한은 관리자가 admin 앱 → 앱 상세 → 기능 권한에서 정한다
- 기능 키는 `src/features.ts` 에 두고 BE 서비스 `src/features.py` 와 같은 값을 쓴다. 새 기능이면 BE 에 먼저 추가한다
- FE 는 숨기기만 한다. 실제 차단은 BE `feature_dependency` 가 JWT·API 키 모두 같은 규칙으로 한다 (403). 상세: `common/docs/auth.md` "useFeatures"
