-- ─────────────────────────────────────────────────────────────
--  내 피부 성분 찾기 — 분석 쿼리 (requirements.md 9번)
--
--  사용법
--  · Supabase 대시보드 > SQL Editor에 붙여 넣고, 보고 싶은 쿼리 블록 하나만 드래그해 선택한 뒤 [Run] 하세요.
--    (전체를 한 번에 실행하면 마지막 쿼리 결과만 보입니다)
--  · 기본은 첫 시도(attempt_no = 1)만 셉니다. [다시 하기]로 다시 한 결과까지 보려면
--    해당 쿼리의 "attempt_no = 1" 조건을 지우세요. (지우면 한 사람이 여러 번 세어질 수 있어요)
--  · 모든 결과에 인원 수(n)를 함께 보여줍니다. note 칸에 "표본 적음"이 뜨면(n < 30)
--    결론 대신 "경향"으로만 읽고, 가정과 다르게 나와도 그대로 기록하세요.
--  · 체감 일치율은 진단 정확도가 아니라 사용자가 느낀 일치도입니다.
--
--  값 이름 (앱 코드와 같음)
--    feedback : good(잘 맞아요) / partial(일부 맞아요) / bad(안 맞아요)
--    answer   : "0"~"3" 점수, "na"(해당 없어요), C1은 "trouble,dullness"처럼 쉼표로 연결, "none"(특별히 없어요)
--    H1 answer는 값 없이 기록됩니다.
-- ─────────────────────────────────────────────────────────────


-- ═════════════════════════════════════════════════════════════
-- 1-1. 시작 → 완료 전환율 (전체 + 성별 경로별)
--      성별 화면에서 이탈한 사람은 성별이 없어 "(성별 화면 이탈)"로 묶입니다.
-- ═════════════════════════════════════════════════════════════
with s as (
  select
    session_id,
    bool_or(event_name = 'start')    as started,
    bool_or(event_name = 'complete') as completed
  from events
  where attempt_no = 1
  group by session_id
),
g as (
  select distinct on (session_id) session_id, value as gender
  from events
  where attempt_no = 1 and event_name = 'answer' and step = 'gender'
  order by session_id, created_at desc
)
select
  case when grouping(coalesce(g.gender, '(성별 화면 이탈)')) = 1 then '전체'
       else coalesce(g.gender, '(성별 화면 이탈)') end                       as segment,
  count(*)                                                                    as n_start,
  count(*) filter (where s.completed)                                         as n_complete,
  round(100.0 * count(*) filter (where s.completed) / nullif(count(*), 0), 1) as conversion_pct,
  case when count(*) < 30 then '표본 적음 — 경향으로만' else '' end            as note
from s
left join g using (session_id)
where s.started
group by grouping sets ((), (coalesce(g.gender, '(성별 화면 이탈)')))
order by grouping(coalesce(g.gender, '(성별 화면 이탈)')) desc, 1;


-- ═════════════════════════════════════════════════════════════
-- 1-2. 이탈 지점 — 시작했지만 완료하지 않은 사람이 "가장 멀리 답한 문항"
--      예: last_answered_step = 'W2' → W2까지 답하고 다음 화면(W3 또는 다음 문항)에서 떠남
--      (이전 버튼으로 돌아갔다가 떠난 경우도 가장 멀리 간 문항 기준)
-- ═════════════════════════════════════════════════════════════
with step_order as (
  select array['gender','O1','O2','O3','O4','O5','W1','W2','W3','W4',
               'S1','S2','S3','S4','S5','S6','C1','H1','A1'] as steps
),
s as (
  select session_id
  from events
  where attempt_no = 1
  group by session_id
  having bool_or(event_name = 'start') and not bool_or(event_name = 'complete')
),
furthest as (
  select e.session_id, max(array_position(o.steps, e.step)) as pos
  from events e
  join s using (session_id)
  cross join step_order o
  where e.attempt_no = 1 and e.event_name = 'answer'
  group by e.session_id
)
select
  coalesce(o.steps[f.pos], '(아무것도 답하지 않음 — 성별 화면에서 이탈)')  as last_answered_step,
  coalesce(f.pos, 0)                                                        as step_position,
  count(*)                                                                  as n_dropout,
  round(100.0 * count(*) / nullif(sum(count(*)) over (), 0), 1)             as pct_of_dropouts,
  sum(count(*)) over ()                                                     as n_total_dropouts
from s
left join furthest f using (session_id)
cross join step_order o
group by 1, 2
order by 2;


-- ═════════════════════════════════════════════════════════════
-- 2. 체감 일치율 — complete 대비 feedback "잘 맞아요 + 일부 맞아요" 비율
--    전체 / 성별별 / 연령대별. 같은 사람이 피드백을 바꿨다면 마지막 값을 씁니다.
--    match_pct_of_complete : 완료한 사람 전체 기준 (명세 정의)
--    match_pct_of_feedback : 피드백을 남긴 사람 기준 (참고)
-- ═════════════════════════════════════════════════════════════
with r as (
  select distinct on (session_id) *
  from results
  where attempt_no = 1
  order by session_id, created_at
),
fb as (
  select distinct on (session_id) session_id, value
  from events
  where attempt_no = 1 and event_name = 'feedback'
  order by session_id, created_at desc
)
select
  case when grouping(r.gender) = 0 then '성별'
       when grouping(r.age_group) = 0 then '연령대'
       else '전체' end                                                          as dimension,
  coalesce(r.gender, r.age_group, '전체')                                       as segment,
  count(*)                                                                      as n_complete,
  count(fb.value)                                                               as n_feedback,
  count(*) filter (where fb.value = 'good')                                     as n_good,
  count(*) filter (where fb.value = 'partial')                                  as n_partial,
  count(*) filter (where fb.value = 'bad')                                      as n_bad,
  round(100.0 * count(*) filter (where fb.value in ('good','partial')) / nullif(count(*), 0), 1)        as match_pct_of_complete,
  round(100.0 * count(*) filter (where fb.value in ('good','partial')) / nullif(count(fb.value), 0), 1) as match_pct_of_feedback,
  case when count(*) < 30 then '표본 적음 — 경향으로만' else '' end              as note
from r
left join fb using (session_id)
group by grouping sets ((), (r.gender), (r.age_group))
order by grouping(r.gender) + grouping(r.age_group) desc, 1, 2;


-- ═════════════════════════════════════════════════════════════
-- 3-1. 근거 열람률 · 출처 클릭률
--      open_pct            : 완료한 사람 중 성분 카드를 1번 이상 펼친 비율
--      click_pct_of_opened : 펼친 사람 중 출처 링크를 1번 이상 누른 비율
--      (주의할 점 아래 출처 링크는 카드를 펼치지 않고도 누를 수 있어 n_clicked_any에 따로 셉니다)
-- ═════════════════════════════════════════════════════════════
with r as (
  select distinct on (session_id) session_id
  from results
  where attempt_no = 1
  order by session_id, created_at
),
e as (
  select
    session_id,
    bool_or(event_name = 'evidence_open') as opened,
    bool_or(event_name = 'source_click')  as clicked
  from events
  where attempt_no = 1
  group by session_id
)
select
  count(*)                                                                         as n_complete,
  count(*) filter (where e.opened)                                                 as n_opened,
  round(100.0 * count(*) filter (where e.opened) / nullif(count(*), 0), 1)         as open_pct,
  count(*) filter (where e.opened and e.clicked)                                   as n_clicked_among_opened,
  round(100.0 * count(*) filter (where e.opened and e.clicked)
        / nullif(count(*) filter (where e.opened), 0), 1)                          as click_pct_of_opened,
  count(*) filter (where e.clicked)                                                as n_clicked_any,
  case when count(*) < 30 then '표본 적음 — 경향으로만' else '' end                 as note
from r
left join e using (session_id);


-- ═════════════════════════════════════════════════════════════
-- 3-2. 근거를 펼쳐 본 사람 vs 안 본 사람의 체감 일치율 · 공유율
--      인과가 아니라 상관입니다. 표본이 작으면 우연일 수 있어요.
-- ═════════════════════════════════════════════════════════════
with r as (
  select distinct on (session_id) session_id
  from results
  where attempt_no = 1
  order by session_id, created_at
),
e as (
  select
    session_id,
    bool_or(event_name = 'evidence_open') as opened,
    bool_or(event_name = 'share')         as shared
  from events
  where attempt_no = 1
  group by session_id
),
fb as (
  select distinct on (session_id) session_id, value
  from events
  where attempt_no = 1 and event_name = 'feedback'
  order by session_id, created_at desc
)
select
  case when coalesce(e.opened, false) then '근거 펼쳐 봄' else '근거 안 봄' end      as segment,
  count(*)                                                                          as n_complete,
  count(fb.value)                                                                   as n_feedback,
  round(100.0 * count(*) filter (where fb.value in ('good','partial')) / nullif(count(*), 0), 1) as match_pct_of_complete,
  round(100.0 * count(*) filter (where e.shared) / nullif(count(*), 0), 1)          as share_pct,
  case when count(*) < 30 then '표본 적음 — 경향으로만' else '' end                  as note
from r
left join e  using (session_id)
left join fb using (session_id)
group by 1
order by 1;


-- ═════════════════════════════════════════════════════════════
-- 4. 성분명 복사율 · 결과 공유율 (완료한 사람 기준)
-- ═════════════════════════════════════════════════════════════
with r as (
  select distinct on (session_id) session_id
  from results
  where attempt_no = 1
  order by session_id, created_at
),
e as (
  select
    session_id,
    bool_or(event_name = 'copy_ingredients') as copied,
    bool_or(event_name = 'share')            as shared
  from events
  where attempt_no = 1
  group by session_id
)
select
  count(*)                                                                  as n_complete,
  count(*) filter (where e.copied)                                          as n_copied,
  round(100.0 * count(*) filter (where e.copied) / nullif(count(*), 0), 1)  as copy_pct,
  count(*) filter (where e.shared)                                          as n_shared,
  round(100.0 * count(*) filter (where e.shared) / nullif(count(*), 0), 1)  as share_pct,
  case when count(*) < 30 then '표본 적음 — 경향으로만' else '' end          as note
from r
left join e using (session_id);


-- ═════════════════════════════════════════════════════════════
-- 5-1. "해당 없어요" 응답 비율 — 상황 문항(O2, W4, S6) × 성별 경로
--      한 문항에 답을 바꿨다면 마지막 답을 씁니다. 완료 여부와 관계없이 그 문항에 답한 사람 기준.
--      (남성 O2, "답하지 않을래요"의 O2에는 해당 없어요 선택지가 없습니다)
--      비율이 높으면 상황 문항 문장을 고쳐 보세요.
-- ═════════════════════════════════════════════════════════════
with g as (
  select distinct on (session_id) session_id, value as gender
  from events
  where attempt_no = 1 and event_name = 'answer' and step = 'gender'
  order by session_id, created_at desc
),
a as (
  select distinct on (session_id, step) session_id, step, value
  from events
  where attempt_no = 1 and event_name = 'answer' and step in ('O2', 'W4', 'S6')
  order by session_id, step, created_at desc
)
select
  a.step,
  g.gender,
  count(*)                                                                    as n_answered,
  count(*) filter (where a.value = 'na')                                      as n_not_applicable,
  round(100.0 * count(*) filter (where a.value = 'na') / nullif(count(*), 0), 1) as not_applicable_pct,
  case when count(*) < 30 then '표본 적음 — 경향으로만' else '' end            as note
from a
join g using (session_id)
group by a.step, g.gender
order by a.step, g.gender;


-- ═════════════════════════════════════════════════════════════
-- 5-2. 경계형 비율 — borderline_count ≥ 1 (T존 유분·볼 유분·수분 중 하나 이상이 경계)
--      축별 경계 비율은 scores 값으로 다시 계산합니다.
--      ※ 0.3 / 0.5는 lib/data.ts THRESHOLDS와 같아야 합니다. 기준값을 바꾸면 여기도 고치세요.
--      비율이 높으면 판정 기준값 조정을 검토하세요.
-- ═════════════════════════════════════════════════════════════
with r as (
  select distinct on (session_id) *
  from results
  where attempt_no = 1
  order by session_id, created_at
)
select
  count(*)                                                                               as n_complete,
  count(*) filter (where borderline_count >= 1)                                          as n_borderline,
  round(100.0 * count(*) filter (where borderline_count >= 1) / nullif(count(*), 0), 1)  as borderline_pct,
  round(100.0 * count(*) filter (where (scores->>'tzone')::numeric    >= 0.3 and (scores->>'tzone')::numeric    < 0.5) / nullif(count(*), 0), 1) as tzone_border_pct,
  round(100.0 * count(*) filter (where (scores->>'cheek')::numeric    >= 0.3 and (scores->>'cheek')::numeric    < 0.5) / nullif(count(*), 0), 1) as cheek_border_pct,
  round(100.0 * count(*) filter (where (scores->>'moisture')::numeric >= 0.3 and (scores->>'moisture')::numeric < 0.5) / nullif(count(*), 0), 1) as moisture_border_pct,
  case when count(*) < 30 then '표본 적음 — 경향으로만' else '' end                       as note
from r;


-- ═════════════════════════════════════════════════════════════
-- 6. 보듬 타깃 가정 검증
--    가정: "보듬의 핵심 고객은 수부지·속건조 피부의 2030이다"
--    수부지 = 수분 부족 지성 · 수분 부족 복합성 (oil_type in oily/combination AND moisture_level = lacking)
--    모든 비율 옆에 구간별 인원 수(n)를 함께 보고, 적으면 "경향"으로만 표현하세요.
-- ═════════════════════════════════════════════════════════════

-- 6-1. 연령대별 수부지 판정 비율 — 20대·30대 vs 다른 연령대 (묶음 + 연령대별 상세)
with r as (
  select distinct on (session_id)
    *,
    (oil_type in ('oily', 'combination') and moisture_level = 'lacking') as is_subuji,
    case when age_group in ('20s', '30s')         then '20대·30대'
         when age_group in ('under19', '40plus')  then '그 외 연령대'
         else '연령 미응답' end                                          as age_bucket
  from results
  where attempt_no = 1
  order by session_id, created_at
)
select
  case when grouping(age_group) = 0 then '연령대 상세' else '연령 묶음' end   as dimension,
  coalesce(age_group, age_bucket)                                            as segment,
  count(*)                                                                   as n,
  count(*) filter (where is_subuji)                                          as n_subuji,
  round(100.0 * count(*) filter (where is_subuji) / nullif(count(*), 0), 1)  as subuji_pct,
  case when count(*) < 30 then '표본 적음 — 경향으로만' else '' end           as note
from r
group by grouping sets ((age_bucket), (age_group))
order by dimension desc, segment;

-- 6-2. 수부지 판정자 중 "건조·각질" 고민 선택 비율 · 약간 예민·예민 비율 (전체 + 연령 묶음별)
with r as (
  select distinct on (session_id)
    *,
    case when age_group in ('20s', '30s')         then '20대·30대'
         when age_group in ('under19', '40plus')  then '그 외 연령대'
         else '연령 미응답' end                                          as age_bucket
  from results
  where attempt_no = 1
  order by session_id, created_at
)
select
  coalesce(age_bucket, '전체 수부지')                                                    as segment,
  count(*)                                                                               as n_subuji,
  count(*) filter (where 'dryness' = any (concerns))                                     as n_dryness_concern,
  round(100.0 * count(*) filter (where 'dryness' = any (concerns)) / nullif(count(*), 0), 1) as dryness_concern_pct,
  count(*) filter (where sensitivity_level in ('sensitive', 'slightly_sensitive'))       as n_sensitive,
  round(100.0 * count(*) filter (where sensitivity_level in ('sensitive', 'slightly_sensitive'))
        / nullif(count(*), 0), 1)                                                        as sensitive_pct,
  case when count(*) < 30 then '표본 적음 — 경향으로만' else '' end                       as note
from r
where oil_type in ('oily', 'combination') and moisture_level = 'lacking'
group by grouping sets ((), (age_bucket))
order by grouping(age_bucket) desc, 1;
