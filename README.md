# iRMS 업데이트 App

배포 설정 · 배포 상태 조회 앱 (경로 `/update/`). 엔진류는 GitLab CI → autoflow → postmark,
패턴류는 ptnbuild · bdupdate → postmark 로 배포되는데, 그 상태를 보고 배포 시각 · 배포 대상 · 패턴 수동 요청을 넣는다.
API 는 BE `update_service`(`/api/update/*`).

## 화면

| 메뉴 | 경로 | 내용 | 버튼 권한 |
| --- | --- | --- | --- |
| 배포 시그널 | `/update/signals` | 엔진별 현재 배포 태그, 시그널 목록(READY · TAKEN · DONE · FAILED, FIRST 구분), 실패 사유, GitLab 태그 · 파이프라인 링크. 조회만 | - |
| 배포 기록 | `/update/logs` | postmark 배포 기록(정시 · 시그널 · 수동, 결과, 사유). 행을 누르면 들어간 입력(inputs)을 key/value 로 | - |
| 패턴 수동 요청 | `/update/requests` | [빌드 · 배포 요청](force 선택), 요청별 진행. 진행 중이면 새 요청 막고 15초마다 새로 읽음 | `pattern_request` |
| 배포 대상 | `/update/targets` | 엔진류 배포 대상 추가 · 수정 · 켜고 끄기. 끌 때 READY 신호 실패 경고 | `settings` |
| 배포 시각 | `/update/schedule` | 패턴류 정기 배포 시각 추가 · 수정 · 삭제. QA 수집(12:00) 뒤 · 오늘 한 번 더 배포 경고 | `settings` |

메뉴는 `view` 권한으로 보인다. 처음 권한: view · pattern_request Member 이상, settings Lead 이상.

## 개발

```bash
npm install
npm run dev
npm test        # vitest (utils: GitLab 링크 · inputs 풀이 · 배포 시각 경고)
```

기본 포트: 3009, 경로: `/update/`
