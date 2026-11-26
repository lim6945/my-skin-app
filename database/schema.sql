-- ─────────────────────────────────────────────────────────────
--  내 피부 성분 찾기 — 테이블 · 보안 정책
--  Supabase 대시보드 > SQL Editor에 통째로 붙여 넣고 [Run] 하세요.
--
--  CHECK 제약의 값은 앱 코드와 정확히 같아야 합니다.
--    gender            : lib/data.ts  GENDER_OPTIONS
--    age_group         : lib/data.ts  AGE_QUESTION.options
--    oil_type 등       : lib/data.ts  OilType / MoistureLevel / SensitivityLevel
--    concerns          : lib/data.ts  CONCERN_QUESTION ("none"은 저장하지 않고 빈 배열로 저장)
--    event_name        : lib/track.ts EventName
--  텍스트 길이 제한은 lib/track.ts의 MAX_*_LENGTH와 같습니다.
-- ─────────────────────────────────────────────────────────────

-- ─────────────── results: 테스트 완료 시 1행 (H1 응답은 저장하지 않음) ───────────────
create table if not exists public.results (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  session_id        text        not null check (char_length(session_id) between 8 and 64),
  attempt_no        integer     not null default 1 check (attempt_no between 1 and 1000),
  gender            text        not null check (gender in ('female', 'male', 'unspecified')),
  age_group         text        not null check (age_group in ('under19', '20s', '30s', '40plus', 'unspecified')),
  result_name       text        not null check (char_length(result_name) between 1 and 50),
  oil_type          text        not null check (oil_type in ('oily', 'combination', 'low_oil')),
  moisture_level    text        not null check (moisture_level in ('lacking', 'enough')),
  sensitivity_level text        not null check (sensitivity_level in ('sensitive', 'slightly_sensitive', 'resilient')),
  concerns          text[]      not null default '{}'
                    check (
                      cardinality(concerns) <= 2
                      and concerns <@ array['trouble', 'dullness', 'dryness', 'wrinkle']::text[]
                    ),
  scores            jsonb       not null
                    check (jsonb_typeof(scores) = 'object' and pg_column_size(scores) <= 1000),
  borderline_count  integer     not null check (borderline_count between 0 and 3)
);

comment on table public.results is '테스트 완료 결과. H1(피부 질환 진단 여부)은 저장하지 않음.';
comment on column public.results.scores is '축별 비율 0~1: {tzone, cheek, moisture, sensitivity}';
comment on column public.results.attempt_no is '같은 session_id에서 [다시 하기]를 누를 때마다 1씩 증가';

create index if not exists results_session_attempt_idx on public.results (session_id, attempt_no);
create index if not exists results_created_at_idx on public.results (created_at);

-- ─────────────── events: 사용자 흐름 기록 ───────────────
create table if not exists public.events (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  session_id  text        not null check (char_length(session_id) between 8 and 64),
  attempt_no  integer     not null default 1 check (attempt_no between 1 and 1000),
  event_name  text        not null check (event_name in (
                'start', 'answer', 'complete', 'evidence_open', 'source_click',
                'copy_ingredients', 'feedback', 'restart', 'share'
              )),
  step        text        check (step is null or char_length(step) <= 50),
  value       text        check (value is null or char_length(value) <= 500)
);

comment on column public.events.step is '문항 ID (gender, O1~S6, C1, H1, A1)';
comment on column public.events.value is 'answer 응답값, feedback 값(good/partial/bad), evidence_open·source_click은 성분명 등. H1 answer는 값 없이 기록';

create index if not exists events_session_attempt_idx on public.events (session_id, attempt_no);
create index if not exists events_name_idx on public.events (event_name);

-- ─────────────── 보안: RLS 켜기 + 익명 사용자는 INSERT만 ───────────────
alter table public.results enable row level security;
alter table public.events  enable row level security;

-- 익명 사용자 권한도 INSERT만 남깁니다. (SELECT·UPDATE·DELETE 정책은 만들지 않음)
revoke all on table public.results from anon;
revoke all on table public.events  from anon;
grant insert on table public.results to anon;
grant insert on table public.events  to anon;

drop policy if exists "anon can insert results" on public.results;
create policy "anon can insert results"
  on public.results
  for insert
  to anon
  with check (true);

drop policy if exists "anon can insert events" on public.events;
create policy "anon can insert events"
  on public.events
  for insert
  to anon
  with check (true);

-- 참고: 운영자는 대시보드(Table Editor / SQL Editor)에서 행 개수와 내용을 볼 수 있습니다.
--       SQL Editor는 관리자 권한으로 실행되므로 RLS와 관계없이 database/analysis.sql을 돌릴 수 있습니다.
