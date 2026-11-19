# iRMS 업데이트 App

배포 설정 · 배포 상태 조회 앱 (경로 `/update/`). 엔진류는 GitLab CI → autoflow → postmark,
패턴류는 ptnbuild · bdupdate → postmark 로 배포되는데, 그 상태를 보고 배포 시각 · 배포 대상 · 패턴 수동 요청을 넣는다.
API 는 BE `update_service`(`/api/update/*`).

## 화면

| 메뉴 | 경로 | 내용 | 버튼 권한 |
| --- | --- | --- | --- |
| 배포 현황 | `/update/status` | 한 화면 두 칸. 왼쪽 엔진: 엔진별 현재 배포 태그, 시그널 목록(READY · TAKEN · DONE · FAILED, FIRST 구분), 실패 사유. 오른쪽 패턴: 정기 배포 시각 · 오늘 배포 여부, [빌드 · 배포 요청](force 선택), 요청별 진행(진행 중이면 새 요청 막고 15초마다 새로 읽음) | `pattern_request` |
| 배포 기록 | `/update/logs` | postmark 배포 기록(정시 · 시그널 · 수동, 결과, 사유). 행을 누르면 들어간 입력(inputs)을 key/value 로 | - |
| 배포 대상 | `/update/targets` | 엔진류 배포 대상 추가 · 수정 · 켜고 끄기. 끌 때 READY 신호 실패 경고 | `settings` |
| 배포 시각 | `/update/schedule` | 패턴류 정기 배포 시각 추가 · 수정 · 삭제. QA 수집(12:00) 뒤 · 오늘 한 번 더 배포 경고 | `settings` |
| 데몬 정책 | `/update/policies` | photon-db `policy_daemon` 데몬 6개(156: ptnbuild · postmark · bdupdate / 250: regimal · sigext · clusmal) 키별 편집. 범위 · 형식 · 짝 값을 입력 칸과 BE 에서 막고, 코드 상수와 짝인 값(🔒)은 보기만. 바뀐 값 확인 창 뒤 저장 | `policy_daemon` |

메뉴는 `view` 권한으로 보인다. 처음 권한: view · pattern_request Member 이상, settings Lead 이상.

## 개발

```bash
npm install
npm run dev
npm test        # vitest (utils: inputs 풀이 · 배포 시각 경고 · 오류 문구 · 데몬 정책 검사)
```

기본 포트: 3009, 경로: `/update/`
