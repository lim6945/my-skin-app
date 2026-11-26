/**
 * 사용자 흐름 기록 (requirements.md 8번) — Supabase `events` / `results` 테이블에 INSERT합니다.
 * - INSERT가 실패해도 화면은 멈추거나 에러를 보여주지 않습니다. (콘솔에만 기록)
 * - INSERT 뒤에 .select()로 다시 읽지 않습니다. (익명 사용자는 SELECT 권한이 없음)
 */
import { supabase } from "./supabase";

export type EventName =
  | "start"
  | "answer"
  | "complete"
  | "evidence_open"
  | "source_click"
  | "copy_ingredients"
  | "feedback"
  | "restart"
  | "share";

export interface TrackOptions {
  /** 문항 ID (예: "O1", "C1", "gender", "A1") */
  step?: string;
  /** 예: answer 응답값, feedback 응답값, evidence_open·source_click일 때는 성분명 */
  value?: string;
}

/* database/schema.sql의 길이 제한과 같게 맞춥니다. 넘치면 잘라서 보냅니다. */
const MAX_STEP_LENGTH = 50;
const MAX_VALUE_LENGTH = 500;
const MAX_RESULT_NAME_LENGTH = 50;

/* ─────────────── session_id · attempt_no ─────────────── */

const SESSION_KEY = "skin_check_session_id";
const ATTEMPT_KEY = "skin_check_attempt_no";
let memorySessionId: string | null = null;
let memoryAttemptNo: number | null = null;

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 브라우저에서 만든 임의 ID (개인 식별 정보 아님). 탭을 닫으면 새로 만들어집니다. */
export function getSessionId(): string {
  if (memorySessionId) return memorySessionId;
  try {
    const saved = window.sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      memorySessionId = saved;
      return saved;
    }
    const id = createId();
    window.sessionStorage.setItem(SESSION_KEY, id);
    memorySessionId = id;
    return id;
  } catch {
    memorySessionId = createId();
    return memorySessionId;
  }
}

/** 같은 session_id 안에서 몇 번째 시도인지 (1부터 시작) */
export function getAttemptNo(): number {
  if (memoryAttemptNo) return memoryAttemptNo;
  try {
    const saved = Number(window.sessionStorage.getItem(ATTEMPT_KEY));
    memoryAttemptNo = Number.isInteger(saved) && saved >= 1 ? saved : 1;
  } catch {
    memoryAttemptNo = 1;
  }
  return memoryAttemptNo;
}

/** [다시 하기]를 누를 때 호출 — attempt_no를 1 올립니다. */
export function nextAttempt(): number {
  const next = getAttemptNo() + 1;
  memoryAttemptNo = next;
  try {
    window.sessionStorage.setItem(ATTEMPT_KEY, String(next));
  } catch {
    /* 저장소를 못 써도 메모리 값으로 계속 진행 */
  }
  return next;
}

/* ─────────────── INSERT ─────────────── */

const clip = (s: string | undefined, max: number) => (s === undefined ? null : s.slice(0, max));

/** 화면을 막지 않도록 기다리지 않고 보내며, 실패는 콘솔에만 남깁니다. */
function insertSafely(table: "events" | "results", row: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    supabase
      .from(table)
      .insert(row)
      .then(
        ({ error }) => {
          if (error) console.error(`[track] ${table} INSERT 실패:`, error.message);
        },
        (err: unknown) => console.error(`[track] ${table} INSERT 실패:`, err),
      );
  } catch (err) {
    console.error(`[track] ${table} INSERT 실패:`, err);
  }
}

/** events 테이블 한 행: session_id, attempt_no, event_name, step, value */
export function track(eventName: EventName, options: TrackOptions = {}): void {
  insertSafely("events", {
    session_id: getSessionId(),
    attempt_no: getAttemptNo(),
    event_name: eventName,
    step: clip(options.step, MAX_STEP_LENGTH),
    value: clip(options.value, MAX_VALUE_LENGTH),
  });
}

/** results 테이블 한 행. H1 응답은 여기에 넣지 않습니다. */
export interface ResultRecord {
  session_id: string;
  gender: "female" | "male" | "unspecified";
  age_group: "under19" | "20s" | "30s" | "40plus" | "unspecified";
  result_name: string;
  oil_type: "oily" | "combination" | "low_oil";
  moisture_level: "lacking" | "enough";
  sensitivity_level: "sensitive" | "slightly_sensitive" | "resilient";
  /** "trouble" | "dullness" | "dryness" | "wrinkle" ("특별히 없어요"는 빈 배열) */
  concerns: string[];
  /** 축별 비율 (0~1) */
  scores: { tzone: number; cheek: number; moisture: number; sensitivity: number };
  borderline_count: number;
}

export function saveResult(record: ResultRecord): void {
  insertSafely("results", {
    ...record,
    attempt_no: getAttemptNo(),
    result_name: record.result_name.slice(0, MAX_RESULT_NAME_LENGTH),
  });
}
