/**
 * 문항 구성 · 판정 · 결과 만들기 로직.
 * 내용(문항, 기준값, 성분, 근거)은 모두 lib/data.ts에 있고, 이 파일은 계산만 합니다.
 */
import {
  AXIS_DISPLAY,
  BORDER_LEAN_TEXT,
  EVIDENCE,
  EVIDENCE_LEVEL_DISPLAY,
  INGREDIENTS,
  MAX_INGREDIENTS,
  MAX_SCORE_PER_QUESTION,
  QUESTIONS,
  RULES,
  SENSITIVITY_PREFIX,
  SHAVING_TRIGGER_SCORE,
  SKIN_TYPE_NAME,
  SUMMARY,
  TEXT,
  THRESHOLDS,
  type Axis,
  type Caution,
  type ConcernKey,
  type Evidence,
  type Gender,
  type MoistureLevel,
  type OilType,
  type Rule,
  type RuleCondition,
  type SensitivityLevel,
  type StageKey,
} from "./data";

/* ─────────────── 문항 ─────────────── */

export const NOT_APPLICABLE = "na" as const;
export type AnswerValue = number | typeof NOT_APPLICABLE;
export type Answers = Record<string, AnswerValue>;

export interface Question {
  id: string;
  axis: Axis;
  stage: StageKey;
  text: string;
  notApplicableLabel?: string;
}

/** 성별 경로에 맞는 점수 문항 목록 */
export function getQuestions(gender: Gender): Question[] {
  const list: Question[] = [];
  for (const q of QUESTIONS) {
    if (q.variants) {
      const v = q.variants[gender];
      if (!v) continue;
      list.push({ id: q.id, axis: q.axis, stage: q.stage, text: v.text, notApplicableLabel: v.notApplicableLabel });
    } else if (q.text) {
      list.push({ id: q.id, axis: q.axis, stage: q.stage, text: q.text });
    }
  }
  return list;
}

/** 성별 경로에서 따로 바뀌는 문항 ID (성별을 바꾸면 이 응답은 지웁니다) */
export const PATH_QUESTION_IDS = QUESTIONS.filter((q) => q.variants).map((q) => q.id);

/* ─────────────── 한국어 조사 ─────────────── */

function hasFinalConsonant(word: string): boolean {
  const trimmed = word.replace(/[^가-힣A-Za-z0-9]+$/, "");
  const code = trimmed.charCodeAt(trimmed.length - 1);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  return false;
}

export function josa(word: string, withFinal: string, withoutFinal: string): string {
  return word + (hasFinalConsonant(word) ? withFinal : withoutFinal);
}

/** ["A","B","C"] → "A, B와 C" */
export function joinWithAnd(words: string[]): string {
  if (words.length <= 1) return words[0] ?? "";
  const head = words.slice(0, -1);
  const last = words[words.length - 1];
  const front = head.slice(0, -1).map((w) => `${w}, `).join("");
  return `${front}${josa(head[head.length - 1], "과", "와")} ${last}`;
}

/* ─────────────── 판정 ─────────────── */

/** 비율 = 획득 점수 ÷ 답한 문항의 최대 점수. "해당 없어요"는 뺍니다. 답한 문항이 없으면 0. */
export function axisRatio(questions: Question[], answers: Answers, axis: Axis): number {
  let got = 0;
  let max = 0;
  for (const q of questions) {
    if (q.axis !== axis) continue;
    const a = answers[q.id];
    if (a === undefined || a === NOT_APPLICABLE) continue;
    got += a;
    max += MAX_SCORE_PER_QUESTION;
  }
  if (max === 0) return 0;
  // 0.1 + 0.2 = 0.30000000000000004 같은 소수 오차로 기준값 경계에서 판정이 바뀌지 않도록 반올림합니다.
  return Math.round((got / max) * 1e6) / 1e6;
}

export interface AxisResult {
  axis: Axis;
  name: string;
  ratio: number;
  /** 0 | 1 | 2 — 왼쪽부터 칸 번호 */
  cell: 0 | 1 | 2;
  cells: [string, string, string];
  /** 칸 안에서의 위치 (0~1) */
  position: number;
  isBorder: boolean;
  /** 경계일 때 가까운 쪽이 높은 쪽(오른쪽)인지 */
  leansHigh: boolean;
  /** 오른쪽 위 판정 글자 */
  judgment: string;
  /** 경계일 때 "높음에 가까워요" */
  leanText?: string;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function judgeTwoSided(axis: "tzone" | "cheek" | "moisture", ratio: number): AxisResult {
  const t = THRESHOLDS[axis];
  const { name, cells } = AXIS_DISPLAY[axis];
  if (ratio >= t.high) {
    return {
      axis, name, ratio, cells, cell: 2, isBorder: false, leansHigh: true,
      position: clamp01((ratio - t.high) / (1 - t.high || 1)),
      judgment: cells[2],
    };
  }
  if (ratio >= t.border) {
    const leansHigh = ratio >= (t.high + t.border) / 2;
    return {
      axis, name, ratio, cells, cell: 1, isBorder: true, leansHigh,
      position: clamp01((ratio - t.border) / (t.high - t.border)),
      judgment: cells[1],
      leanText: BORDER_LEAN_TEXT(leansHigh ? cells[2] : cells[0]),
    };
  }
  return {
    axis, name, ratio, cells, cell: 0, isBorder: false, leansHigh: false,
    position: clamp01(ratio / t.border),
    judgment: cells[0],
  };
}

function judgeSensitivity(ratio: number): { result: AxisResult; level: SensitivityLevel } {
  const t = THRESHOLDS.sensitivity;
  const { name, cells } = AXIS_DISPLAY.sensitivity;
  let cell: 0 | 1 | 2;
  let position: number;
  let level: SensitivityLevel;
  if (ratio >= t.high) {
    cell = 2; level = "sensitive"; position = (ratio - t.high) / (1 - t.high || 1);
  } else if (ratio >= t.mid) {
    cell = 1; level = "slightly_sensitive"; position = (ratio - t.mid) / (t.high - t.mid);
  } else {
    cell = 0; level = "resilient"; position = ratio / t.mid;
  }
  return {
    level,
    result: {
      axis: "sensitivity", name, ratio, cells, cell, isBorder: false, leansHigh: cell === 2,
      position: clamp01(position), judgment: cells[cell],
    },
  };
}

/* ─────────────── 결과 ─────────────── */

export interface Claim {
  ruleId: string;
  ruleLabel: string;
  group: string;
  reason: string;
  level: "verified" | "limited";
  levelLabel: string;
  levelDescription: string;
}

export interface IngredientResult {
  id: string;
  name: string;
  copyNames: string[];
  /** 카드에 항상 보이는 이유 한 줄 */
  reason: string;
  note?: string;
  /** 예민한 피부 + AHA·BHA·레티놀일 때 붙는 표시 */
  testTag?: string;
  claims: Claim[];
  evidences: Evidence[];
}

export interface CautionResult {
  text: string;
  evidence?: Evidence;
}

export interface SkinResult {
  name: string;
  nickname?: string;
  oilType: OilType;
  moistureLevel: MoistureLevel;
  sensitivityLevel: SensitivityLevel;
  summary: string;
  confidence: string;
  borderlineCount: number;
  axes: AxisResult[];
  ingredients: IngredientResult[];
  cautions: CautionResult[];
  scores: { tzone: number; cheek: number; moisture: number; sensitivity: number };
}

interface MatchContext {
  gender: Gender;
  answers: Answers;
  concerns: ConcernKey[];
  oilType: OilType;
  moistureLevel: MoistureLevel;
  sensitivityLevel: SensitivityLevel;
}

function matches(cond: RuleCondition, ctx: MatchContext): boolean {
  switch (cond.type) {
    case "oil":
      return ctx.oilType === cond.value;
    case "moisture":
      return ctx.moistureLevel === cond.value;
    case "sensitivity":
      return cond.values.includes(ctx.sensitivityLevel);
    case "concern":
      return ctx.concerns.includes(cond.value);
    case "oilAndConcern":
      return ctx.oilType === cond.oil && ctx.concerns.includes(cond.concern);
    case "shaving": {
      if (ctx.gender !== "male") return false;
      return ["W4", "S6"].some((id) => {
        const a = ctx.answers[id];
        return typeof a === "number" && a >= SHAVING_TRIGGER_SCORE;
      });
    }
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildResult(input: {
  gender: Gender;
  answers: Answers;
  concerns: ConcernKey[];
}): SkinResult {
  const questions = getQuestions(input.gender);
  const { answers } = input;

  const tzone = judgeTwoSided("tzone", axisRatio(questions, answers, "tzone"));
  const cheek = judgeTwoSided("cheek", axisRatio(questions, answers, "cheek"));
  const moisture = judgeTwoSided("moisture", axisRatio(questions, answers, "moisture"));
  const sens = judgeSensitivity(axisRatio(questions, answers, "sensitivity"));

  // 유분 유형 — 경계는 가까운 쪽으로
  const tHigh = tzone.leansHigh;
  const cHigh = cheek.leansHigh;
  const oilType: OilType = tHigh && cHigh ? "oily" : tHigh || cHigh ? "combination" : "low_oil";
  const moistureLevel: MoistureLevel = moisture.leansHigh ? "lacking" : "enough";
  const sensitivityLevel = sens.level;

  const skinType = SKIN_TYPE_NAME[oilType][moistureLevel];
  const name = `${SENSITIVITY_PREFIX[sensitivityLevel]} ${skinType.name}`;

  // 요약
  const oilSummary =
    oilType === "combination"
      ? tHigh ? SUMMARY.oil.combinationTzone : SUMMARY.oil.combinationCheek
      : SUMMARY.oil[oilType];
  // 수분이 경계면 "충분/부족"으로 단정하지 않는 문장을 씁니다.
  const moistureSummary = moisture.isBorder
    ? moisture.leansHigh ? SUMMARY.moisture.borderLacking : SUMMARY.moisture.borderEnough
    : SUMMARY.moisture[moistureLevel];
  const summary = [oilSummary, moistureSummary, SUMMARY.sensitivity[sensitivityLevel]].join(" ");

  const axes = [tzone, cheek, moisture, sens.result];
  const borderAxes = axes.filter((a) => a.isBorder);
  const confidence =
    borderAxes.length === 0
      ? TEXT.result.clearConfidence
      : TEXT.result.borderConfidence.replace(
          "{axes}",
          josa(joinWithAnd(borderAxes.map((a) => a.name)), "은", "는"),
        );

  // 성분 · 주의할 점
  const concerns = input.concerns.filter((c) => c !== "none");
  const ctx: MatchContext = { gender: input.gender, answers, concerns, oilType, moistureLevel, sensitivityLevel };
  const matched: Rule[] = RULES.filter((r) => matches(r.when, ctx));

  const claimMap = new Map<string, { rule: Rule; reason: string; level: "verified" | "limited"; evidence?: string }[]>();
  for (const rule of matched) {
    for (const item of rule.items) {
      if (item.level === "unchecked") continue; // 확인하지 않은 설명은 보여주지 않음
      const list = claimMap.get(item.ingredient) ?? [];
      list.push({ rule, reason: item.reason, level: item.level, evidence: item.evidence });
      claimMap.set(item.ingredient, list);
    }
  }

  const isSensitive = sensitivityLevel === "sensitive" || sensitivityLevel === "slightly_sensitive";
  const ingredientOrder = Object.keys(INGREDIENTS);

  const ingredients: IngredientResult[] = [...claimMap.entries()]
    .map(([id, raw]) => {
      const ing = INGREDIENTS[id];
      const labels = [...new Set(raw.map((c) => c.rule.label))];
      const reason =
        labels.length > 1 ? `${joinWithAnd(labels)}에 함께 맞아요` : raw[0].reason;
      const evidenceIds = [...new Set(raw.map((c) => c.evidence).filter((e): e is string => !!e))];
      const claims: Claim[] = [];
      const seen = new Set<string>();
      for (const c of raw) {
        const key = `${c.rule.label}|${c.reason}|${c.level}`;
        if (seen.has(key)) continue;
        seen.add(key);
        claims.push({
          ruleId: c.rule.id,
          ruleLabel: c.rule.label,
          group: c.rule.group,
          reason: c.reason,
          level: c.level,
          levelLabel: EVIDENCE_LEVEL_DISPLAY[c.level].label,
          levelDescription: EVIDENCE_LEVEL_DISPLAY[c.level].description,
        });
      }
      return {
        id,
        name: ing.name,
        copyNames: ing.copyNames ?? [ing.name],
        reason,
        note: ing.note,
        testTag: isSensitive && ing.active ? TEXT.result.activeTestTag : undefined,
        claims,
        evidences: evidenceIds.map((e) => EVIDENCE[e]).filter(Boolean),
      };
    })
    .sort((a, b) => {
      // ① 여러 결과에 함께 걸리는 성분 먼저
      const ga = new Set(a.claims.map((c) => c.group)).size;
      const gb = new Set(b.claims.map((c) => c.group)).size;
      if (ga !== gb) return gb - ga;
      // ② 고민 선택에서 나온 성분 먼저
      const ca = a.claims.some((c) => c.group.startsWith("concern:")) ? 1 : 0;
      const cb = b.claims.some((c) => c.group.startsWith("concern:")) ? 1 : 0;
      if (ca !== cb) return cb - ca;
      // ③ verified → limited
      const va = a.claims.some((c) => c.level === "verified") ? 1 : 0;
      const vb = b.claims.some((c) => c.level === "verified") ? 1 : 0;
      if (va !== vb) return vb - va;
      // ④ data.ts에 적힌 순서
      return ingredientOrder.indexOf(a.id) - ingredientOrder.indexOf(b.id);
    })
    .slice(0, MAX_INGREDIENTS);

  const cautionSeen = new Set<string>();
  const cautions: CautionResult[] = [];
  for (const rule of matched) {
    for (const c of rule.cautions as Caution[]) {
      if (cautionSeen.has(c.text)) continue;
      cautionSeen.add(c.text);
      cautions.push({ text: c.text, evidence: c.evidence ? EVIDENCE[c.evidence] : undefined });
    }
  }

  return {
    name,
    nickname: skinType.nickname,
    oilType,
    moistureLevel,
    sensitivityLevel,
    summary,
    confidence,
    borderlineCount: borderAxes.length,
    axes,
    ingredients,
    cautions,
    scores: {
      tzone: round2(tzone.ratio),
      cheek: round2(cheek.ratio),
      moisture: round2(moisture.ratio),
      sensitivity: round2(sens.result.ratio),
    },
  };
}
