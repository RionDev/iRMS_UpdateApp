# iRMS 업데이트 App

배포 설정 · 배포 상태 조회 앱 (경로 `/update/`). 엔진류는 GitLab CI → autoflow → postmark,
패턴류는 ptnbuild · bdupdate → postmark 로 배포되는데, 그 상태를 보고 배포 대상 · 데몬 정책(정기 배포 시각 포함) · 패턴 수동 요청을 넣는다.
API 는 BE `update_service`(`/api/update/*`).

## 화면

| 메뉴 | 경로 | 내용 | 버튼 권한 |
| --- | --- | --- | --- |
| 배포 현황 | `/update/status` | 한 화면 두 칸. 왼쪽 엔진: 엔진별 현재 배포 태그 · 최근 master 파이프라인 성공 · 실패(실패면 버전, 마우스를 올리면 실패 job), 시그널 목록(READY · TAKEN · DONE · FAILED, FIRST 구분), 실패 사유. 오른쪽 패턴: 정기 배포 시각(NpPostmark.DEPLOY_TIME) · 오늘 배포 여부, [빌드 · 배포 요청](force 없음 — 전량 예외 청크는 156 에서 ptnbuild build --force), 요청별 진행(진행 중이면 새 요청 막고 15초마다 새로 읽음) | `pattern_request` |
| 배포 기록 | `/update/logs` | postmark 배포 기록(정시 · 시그널 · 수동, 결과, 사유). 행을 누르면 들어간 입력(inputs)을 key/value 로 | - |
| 배포 대상 | `/update/targets` | 엔진류 배포 대상 추가(꺼진 채로) · 수정 · 켜고 끄기. 켤 때 GitLab 에서 버전 · zip · 모듈 파일을 먼저 받아 보고 통과해야 켜짐(틀리면 postmark 배포 전체가 멈춤). 끌 때 READY 신호 실패 경고 | `settings` |
| 데몬 정책 | `/update/policies` | photon-db `policy_daemon` 배포 데몬 3개(156: ptnbuild · postmark · bdupdate) 키별 편집. 범위 · 형식을 입력 칸과 BE 에서 막고, 다른 데몬 코드 상수와 같아야 하는 값(🔒)은 보기만. 정기 배포 시각(DEPLOY_TIME)은 QA 12:00 뒤 · 빌드 시각과 2시간 미만 · 오늘 한 번 더 경고. 바뀐 값 확인 창 뒤 저장 | `settings` |

메뉴는 `view` 권한으로 보인다. 처음 권한: view · pattern_request Member 이상, settings Lead 이상.

## 개발

```bash
npm install
npm run dev
npm test        # vitest (utils: inputs 풀이 · 정기 배포 시각 경고 · 오류 문구 · 데몬 정책 검사)
```

기본 포트: 3009, 경로: `/update/`
