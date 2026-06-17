---
name: manual-harness-orchestrator
description: |
  PTLPSM 소스코드에서 사용자 매뉴얼·문서를 자동 생성하는 문서화 하네스의 오케스트레이터.
  4개 분석기(frontend/api/backend/database) → 지식 합성 → 문서 생성 → 품질 검증 파이프라인을
  조율한다. 다음 요청 시 반드시 이 스킬을 사용할 것: "매뉴얼 생성/자동생성", "문서 생성/갱신/업데이트",
  "엔티티 관계도·상태흐름도·API 문서·비즈니스 규칙 문서 만들기", "코드베이스 분석해서 문서화",
  그리고 후속 요청 — "매뉴얼 다시 생성/재생성", "문서 업데이트", "OO 섹션만 다시", "이전 결과 보완/개선",
  "검증만 다시". 단순 도메인 질문(상태흐름 한 줄 확인 등)은 직접 응답 가능.
---

# 문서화 하네스 오케스트레이터

PTLPSM(출하관리시스템) 소스코드 → 사용자 매뉴얼/문서 자동 생성 파이프라인을 조율한다.
개별 에이전트가 "무엇을 어떻게" 하는지 정의한다면, 이 오케스트레이터는 "누가 언제 어떤 순서로"를 정의한다.

---

## 실행 모드: 서브 에이전트 (fan-out → fan-in → pipeline)

이 하네스는 **파일 기반 ETL 파이프라인**이다. 4개 분석기는 서로 독립적으로 코드를 읽고(read-only),
산출물을 YAML 파일로 넘긴다. 실시간 상호 조율·토론이 구조적으로 불필요하므로 **에이전트 팀이 아니라
서브 에이전트 패턴**을 사용한다(팀 통신 오버헤드가 이득보다 큼). 데이터는 `.claude/shared/data/`의
약속된 파일 경로로 전달한다.

```
[오케스트레이터]
   ├─ (fan-out, 병렬) frontend / api / backend / database analyzer  →  *-analysis.yaml
   ├─ (fan-in, 배리어) knowledge-synthesizer  →  synthesized-knowledge.yaml
   ├─ (pipeline) document-generator  →  docs/generated/*
   └─ (pipeline) quality-validator  →  validation-report.yaml
```

**모델 정책:** 모든 Agent 호출 시 `model: "opus"` 를 명시한다.

---

## 구성 요소

| 단계 | 에이전트(subagent_type) | 사용 스킬 | 입력 | 출력 |
|------|------------------------|-----------|------|------|
| 1. 분석(병렬) | frontend-analyzer, api-analyzer, backend-analyzer, database-analyzer | code-analysis | 소스코드, knowledge-base/*.yaml | `shared/data/{frontend,api,backend,database}-analysis.yaml` |
| 2. 합성 | knowledge-synthesizer | — | 1의 산출물 + knowledge-base/*.yaml | `shared/data/synthesized-knowledge.yaml` |
| 3. 생성 | document-generator | document-templates, manual-generator | 2의 산출물 | `docs/generated/*` |
| 4. 검증 | quality-validator | validation-rules, user-manual-updater | 3의 산출물 + knowledge-base | `shared/data/validation-report.yaml` |

> 에이전트 정의: `.claude/agents/`. 지식베이스(권위 소스): `.claude/knowledge-base/{terminology,status-mappings,domain-rules}.yaml`.

---

## Phase 0: 컨텍스트 확인 (초기/후속/부분 재실행 판별)

워크플로우 시작 시 기존 산출물을 확인하여 실행 모드를 정한다.

1. `.claude/shared/data/` 와 `docs/generated/` 존재 여부 확인
2. 분기:
   - **산출물 없음** → **초기 실행** (Phase 1부터 전체)
   - **산출물 있음 + 사용자가 부분 수정 요청**("OO 섹션만", "Transport 상태흐름만") → **부분 재실행**
     (해당 단계 에이전트만 재호출, 나머지 산출물 재사용)
   - **산출물 있음 + 새 입력/전체 갱신 요청**("처음부터 다시", 코드 대폭 변경) → **새 실행**
     (기존 `shared/data/`를 `shared/data_prev/`로 이동 후 Phase 1부터)
   - **검증만 요청** → Phase 4만 실행
3. 부분 재실행 시: 변경 단계의 하위(downstream) 단계도 함께 재실행한다
   (예: 합성 변경 → 생성·검증도 재실행. 분석 변경 → 합성·생성·검증 재실행).

---

## Phase 1: 분석 (fan-out, 병렬)

4개 분석기를 `Agent` 도구로 **병렬 호출**한다(`run_in_background: true`, `model: "opus"`).
backend/database analyzer는 현재 스텁 — 코드/스키마 소스가 없으면 knowledge-base를 fallback으로 쓰고
스텁 산출물을 남긴다(실패 아님).

- 각 분석기는 `code-analysis` 스킬의 패턴으로 코드를 스캔한다.
- 한글 용어는 `terminology.yaml`을 참조한다(코드에 없으면 영문 유지).
- 4개 산출물이 모두 나올 때까지 대기(배리어).

## Phase 2: 합성 (fan-in)

`knowledge-synthesizer`를 호출한다. 4개 `*-analysis.yaml` + knowledge-base를 병합한다.
충돌 해결 우선순위: **terminology.yaml > status-mappings.yaml > domain-rules.yaml > 코드 분석**.
출력: `synthesized-knowledge.yaml` (관계 그래프 + 워크플로우 + 비즈니스 규칙 + 갭 분석).

## Phase 3: 생성 (pipeline)

`document-generator`를 호출한다. `document-templates` 스킬의 템플릿으로 `synthesized-knowledge.yaml`을
문서로 변환한다. 출력: `docs/generated/`(USER_MANUAL, API_DOCUMENTATION, STATUS_FLOWS, BUSINESS_RULES,
ENTITY_RELATIONSHIPS, entities/*.md, index.md).

## Phase 4: 검증 (pipeline)

`quality-validator`를 호출한다. `validation-rules` 스킬로 완전성·일관성·정확성·가독성을 검사하고,
`user-manual-updater` 스킬의 도메인 사실(상태전이·금액계산·서명규칙)과 대조한다.
출력: `validation-report.yaml`. ERROR가 auto_fixable면 해당 단계(생성)를 1회 재호출하여 보완한다.

---

## 데이터 전달 프로토콜

- **파일 기반(주)**: `.claude/shared/data/*.yaml` — 단계 간 산출물 전달. 중간 파일은 보존(감사 추적).
- **반환값 기반(보조)**: 각 서브 에이전트는 산출물 경로 + 요약(처리 엔티티 수, 갭, 경고)을 메인에 반환.
- **최종 산출물**: `docs/generated/`. 사용자에게는 생성 파일 목록 + 품질 점수 + 미해결 갭을 보고.

파일명 컨벤션은 기존 그대로 유지: `{단계}-analysis.yaml`, `synthesized-knowledge.yaml`,
`validation-report.yaml`.

---

## 에러 핸들링

| 상황 | 처리 |
|------|------|
| 분석기 1회 실패 | 1회 재시도 → 재실패 시 해당 산출물 없이 진행, 보고서에 누락 명시(파이프라인 중단 금지) |
| 분석 소스 없음(backend/db) | 스텁 산출물 + knowledge-base fallback (정상 흐름) |
| 합성 시 정의 충돌 | 삭제 금지 — 우선순위 규칙 적용 + 출처 병기, 로그 기록 |
| 생성 ERROR(검증 적발) | auto_fixable면 생성 1회 재호출, 아니면 보고서에 수동보완 항목으로 표기 |
| knowledge-base 파일 손상/누락 | 경고 후 코드 분석 결과만으로 진행, 신뢰도 점수 하향 |

핵심 원칙: **1회 재시도 후 누락 명시하며 진행**, **상충 데이터는 삭제하지 않고 출처 병기**.

---

## 테스트 시나리오

**정상 흐름:**
1. 사용자: "출하관리 시스템 사용자 매뉴얼 자동 생성해줘"
2. Phase 0: 산출물 없음 → 초기 실행
3. Phase 1: 4 분석기 병렬 → `*-analysis.yaml` 4개
4. Phase 2: 합성 → `synthesized-knowledge.yaml`
5. Phase 3: 생성 → `docs/generated/*`
6. Phase 4: 검증 → `validation-report.yaml`(품질점수)
7. 결과 보고: 생성 파일 목록 + 점수 + 미해결 갭

**에러 흐름(부분 재실행):**
1. 사용자: "Transport 엔티티 상태흐름도만 다시 생성해줘"
2. Phase 0: 산출물 있음 + 부분 수정 → 부분 재실행
3. `synthesized-knowledge.yaml` 재사용, document-generator만 해당 섹션 재생성
4. quality-validator로 해당 문서만 재검증
5. 결과 보고: 갱신된 파일 + 변경 요약

---

## 후속 작업 지원

- 후속 키워드(재생성/업데이트/OO만 다시/보완/검증만)는 위 description에 포함됨.
- 부분 재실행 시 변경 단계의 downstream을 함께 재실행하여 정합성 유지.
- 각 에이전트는 이전 산출물이 있으면 읽고 개선점을 반영한다(덮어쓰기 전 비교).

## 참고: 레거시 커맨드

`.claude/commands/`의 `analyze-codebase`, `generate-manual`, `generate-section`, `validate-docs`는
이 하네스 이전부터 쓰이던 수동 진입점이다. 현재 하네스 규약은 신규 커맨드 생성을 권장하지 않으나,
기존 커맨드는 사용자 편의를 위해 보존한다. 동일 파이프라인을 호출하므로 이 오케스트레이터와 병행 가능.
