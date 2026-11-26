"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AGE_QUESTION,
  CHECK_QUESTION,
  CONCERN_QUESTION,
  GENDER_OPTIONS,
  SCALE,
  STAGE_LABELS,
  TEXT,
  type AgeGroup,
  type ConcernKey,
  type Gender,
  type StageKey,
} from "@/lib/data";
import {
  NOT_APPLICABLE,
  PATH_QUESTION_IDS,
  buildResult,
  getQuestions,
  type Answers,
  type AnswerValue,
  type Question,
  type SkinResult,
} from "@/lib/quiz";
import { getSessionId, nextAttempt, saveResult, track } from "@/lib/track";
import { ChoiceRow, PrimaryButton, TopBar } from "./ui";
import ResultView from "./ResultView";

type Step =
  | { type: "gender" }
  | { type: "question"; question: Question }
  | { type: "concern" }
  | { type: "check" }
  | { type: "age" };

const ADVANCE_DELAY_MS = 300;

function stageOf(step: Step): StageKey {
  switch (step.type) {
    case "gender":
      return "gender";
    case "question":
      return step.question.stage;
    case "concern":
      return "concern";
    case "check":
      return "check";
    case "age":
      return "age";
  }
}

export default function SkinCheckApp() {
  const [screen, setScreen] = useState<"home" | "flow" | "result">("home");
  const [stepIndex, setStepIndex] = useState(0);
  const [gender, setGender] = useState<Gender | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [concerns, setConcerns] = useState<ConcernKey[]>([]);
  const [hasCondition, setHasCondition] = useState<boolean | null>(null); // H1 — 저장하지 않음
  const [age, setAge] = useState<AgeGroup | null>(null);
  const [result, setResult] = useState<SkinResult | null>(null);
  const [locked, setLocked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps: Step[] = useMemo(() => {
    const qs = getQuestions(gender ?? "unspecified");
    return [
      { type: "gender" },
      ...qs.map((question) => ({ type: "question" as const, question })),
      { type: "concern" },
      { type: "check" },
      { type: "age" },
    ];
  }, [gender]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen, stepIndex]);

  const finish = useCallback(
    (ageValue: AgeGroup) => {
      const g = gender ?? "unspecified";
      const r = buildResult({ gender: g, answers, concerns });
      setResult(r);
      track("complete", { value: r.name });
      saveResult({
        session_id: getSessionId(),
        gender: g,
        age_group: ageValue,
        result_name: r.name,
        oil_type: r.oilType,
        moisture_level: r.moistureLevel,
        sensitivity_level: r.sensitivityLevel,
        concerns: concerns.filter((c) => c !== "none"),
        scores: r.scores,
        borderline_count: r.borderlineCount,
      });
      setScreen("result");
    },
    [gender, answers, concerns],
  );

  /**
   * 빠르게 두 번 누르면 화면이 다시 그려지기 전에 두 번째 클릭이 들어와 문항을 건너뛸 수 있어서,
   * state가 아니라 ref로 즉시 잠급니다. 잠겨 있으면 false를 돌려주고 응답을 무시합니다.
   */
  const lockRef = useRef(false);
  const tryLock = useCallback(() => {
    if (lockRef.current) return false;
    lockRef.current = true;
    setLocked(true);
    return true;
  }, []);

  /** 선택 후 0.3초 뒤 다음 화면으로 (tryLock()이 true일 때만 호출) */
  const advanceLater = useCallback(() => {
    timer.current = setTimeout(() => {
      setStepIndex((i) => i + 1);
      lockRef.current = false;
      setLocked(false);
    }, ADVANCE_DELAY_MS);
  }, []);

  const goBack = () => {
    if (lockRef.current) return;
    if (stepIndex === 0) setScreen("home");
    else setStepIndex((i) => i - 1);
  };

  const start = () => {
    track("start");
    setScreen("flow");
    setStepIndex(0);
  };

  const restart = () => {
    if (timer.current) clearTimeout(timer.current);
    lockRef.current = false;
    setLocked(false);
    track("restart"); // 끝낸 시도의 attempt_no로 기록한 뒤
    nextAttempt(); // 다음 시도부터 attempt_no + 1
    setGender(null);
    setAnswers({});
    setConcerns([]);
    setHasCondition(null);
    setAge(null);
    setResult(null);
    setStepIndex(0);
    setScreen("home");
  };

  if (screen === "home") return <HomeScreen onStart={start} />;

  if (screen === "result" && result) {
    return <ResultView result={result} showConsult={hasCondition === true} onRestart={restart} />;
  }

  const step = steps[Math.min(stepIndex, steps.length - 1)];
  // 성별을 고르기 전에는 전체 문항 수가 정해지지 않아 숫자를 숨깁니다.
  const total = gender ? steps.length : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-7 pb-10">
      <TopBar onBack={goBack} backLabel={TEXT.quiz.backLabel} current={stepIndex + 1} total={total} />
      <div key={stepIndex} className="flex flex-1 flex-col animate-fade-in pt-8">
        <p className="text-[14px] font-semibold text-point">{STAGE_LABELS[stageOf(step)]}</p>

        {step.type === "gender" && (
          <>
            <h1 className="mt-2 text-[24px] font-bold leading-[1.45] tracking-[-0.03em] text-title">
              {TEXT.gender.question}
            </h1>
            <p className="mt-2 text-[15px] leading-[1.65] text-body">{TEXT.gender.note}</p>
            <div role="radiogroup" aria-label={TEXT.gender.question} className="mt-8">
              {GENDER_OPTIONS.map((o) => (
                <ChoiceRow
                  key={o.value}
                  label={o.label}
                  selected={gender === o.value}
                  disabled={locked}
                  onClick={() => {
                    if (!tryLock()) return;
                    if (gender && gender !== o.value) {
                      // 경로가 바뀌면 경로별 문항 응답은 지웁니다.
                      setAnswers((prev) => {
                        const next = { ...prev };
                        PATH_QUESTION_IDS.forEach((id) => delete next[id]);
                        return next;
                      });
                    }
                    setGender(o.value);
                    track("answer", { step: "gender", value: o.value });
                    advanceLater();
                  }}
                />
              ))}
            </div>
          </>
        )}

        {step.type === "question" && (
          <QuestionBlock
            question={step.question}
            value={answers[step.question.id]}
            disabled={locked}
            onAnswer={(v) => {
              if (!tryLock()) return;
              setAnswers((prev) => ({ ...prev, [step.question.id]: v }));
              track("answer", { step: step.question.id, value: String(v) });
              advanceLater();
            }}
          />
        )}

        {step.type === "concern" && (
          <ConcernBlock
            selected={concerns}
            onChange={setConcerns}
            onNext={() => {
              track("answer", { step: CONCERN_QUESTION.id, value: concerns.join(",") });
              setStepIndex((i) => i + 1);
            }}
          />
        )}

        {step.type === "check" && (
          <>
            <h1 className="mt-2 text-[24px] font-bold leading-[1.45] tracking-[-0.03em] text-title">
              {CHECK_QUESTION.text}
            </h1>
            <div role="radiogroup" aria-label={CHECK_QUESTION.text} className="mt-8">
              {CHECK_QUESTION.options.map((o) => (
                <ChoiceRow
                  key={o.label}
                  label={o.label}
                  selected={hasCondition === o.value}
                  disabled={locked}
                  onClick={() => {
                    if (!tryLock()) return;
                    setHasCondition(o.value);
                    // H1 응답값은 기록하지 않고, 어느 문항까지 왔는지만 남깁니다.
                    track("answer", { step: CHECK_QUESTION.id });
                    advanceLater();
                  }}
                />
              ))}
            </div>
          </>
        )}

        {step.type === "age" && (
          <>
            <h1 className="mt-2 text-[24px] font-bold leading-[1.45] tracking-[-0.03em] text-title">
              {AGE_QUESTION.text}
              <span className="ml-2 align-middle text-[15px] font-medium text-sub">{AGE_QUESTION.subText}</span>
            </h1>
            <p className="mt-2 text-[15px] leading-[1.65] text-body">{AGE_QUESTION.note}</p>
            <div role="radiogroup" aria-label={AGE_QUESTION.text} className="mt-8">
              {AGE_QUESTION.options.map((o) => (
                <ChoiceRow
                  key={o.value}
                  label={o.label}
                  selected={age === o.value}
                  onClick={() => setAge(age === o.value ? null : o.value)}
                />
              ))}
            </div>
            <div className="mt-auto pt-10">
              <PrimaryButton
                onClick={() => {
                  const value = age ?? "unspecified";
                  track("answer", { step: AGE_QUESTION.id, value });
                  finish(value);
                }}
              >
                {TEXT.age.resultButton}
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

/* ─────────────── 홈 ─────────────── */

function HomeScreen({ onStart }: { onStart: () => void }) {
  const t = TEXT.home;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-7 pb-10 pt-16 animate-fade-in">
      <p className="text-[14px] font-semibold text-point">{t.label}</p>
      <h1 className="mt-3 whitespace-pre-line text-[34px] font-bold leading-[1.3] tracking-[-0.03em] text-title">
        {t.title}
      </h1>
      <p className="mt-4 text-[16px] leading-[1.65] text-body">{t.intro}</p>

      <dl className="mt-10 border-t border-line">
        {t.info.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 border-b border-line py-4">
            <dt className="text-[14px] text-sub">{row.label}</dt>
            <dd className="text-right text-[15px] font-semibold text-title">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-auto pt-12">
        <PrimaryButton onClick={onStart}>{t.startButton}</PrimaryButton>
        <p className="mt-4 text-center text-[13px] text-sub">{t.footer}</p>
      </div>
    </main>
  );
}

/* ─────────────── 4점 척도 문항 ─────────────── */

function QuestionBlock({
  question,
  value,
  disabled,
  onAnswer,
}: {
  question: Question;
  value: AnswerValue | undefined;
  disabled: boolean;
  onAnswer: (v: AnswerValue) => void;
}) {
  return (
    <>
      <h1 className="mt-2 text-[24px] font-bold leading-[1.45] tracking-[-0.03em] text-title">{question.text}</h1>
      {/* "해당 없어요"도 같은 선택지 묶음(radiogroup) 안에 둡니다. */}
      <div role="radiogroup" aria-label={question.text} className="mt-8 flex flex-col">
        {SCALE.map((s) => (
          <ChoiceRow
            key={s.score}
            label={s.label}
            selected={value === s.score}
            disabled={disabled}
            onClick={() => onAnswer(s.score)}
          />
        ))}
      {question.notApplicableLabel && (
        <button
          type="button"
          role="radio"
          aria-checked={value === NOT_APPLICABLE}
          aria-label={question.notApplicableLabel}
          disabled={disabled}
          onClick={() => onAnswer(NOT_APPLICABLE)}
          className={`mt-6 self-center rounded-full px-4 py-2 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-point ${
            value === NOT_APPLICABLE ? "bg-point-soft font-semibold text-point" : "text-sub underline underline-offset-4"
          }`}
        >
          {question.notApplicableLabel}
        </button>
      )}
      </div>
    </>
  );
}

/* ─────────────── 고민 선택 (최대 2개) ─────────────── */

function ConcernBlock({
  selected,
  onChange,
  onNext,
}: {
  selected: ConcernKey[];
  onChange: (next: ConcernKey[]) => void;
  onNext: () => void;
}) {
  const q = CONCERN_QUESTION;
  const toggle = (v: ConcernKey) => {
    if (selected.includes(v)) return onChange(selected.filter((s) => s !== v));
    if (v === q.exclusiveValue) return onChange([v]);
    const withoutNone = selected.filter((s) => s !== q.exclusiveValue);
    if (withoutNone.length >= q.maxSelect) return; // 이미 2개
    onChange([...withoutNone, v]);
  };
  const full = selected.filter((s) => s !== q.exclusiveValue).length >= q.maxSelect;

  return (
    <>
      <h1 className="mt-2 text-[24px] font-bold leading-[1.45] tracking-[-0.03em] text-title">{q.text}</h1>
      <p className="mt-2 text-[15px] leading-[1.65] text-body" aria-live="polite">
        {TEXT.concern.maxNote}
      </p>
      <div role="group" aria-label={q.text} className="mt-8">
        {q.options.map((o) => (
          <ChoiceRow
            key={o.value}
            role="checkbox"
            label={o.label}
            selected={selected.includes(o.value)}
            dimmed={full && !selected.includes(o.value) && o.value !== q.exclusiveValue}
            onClick={() => toggle(o.value)}
          />
        ))}
      </div>
      <div className="mt-auto pt-10">
        <PrimaryButton disabled={selected.length === 0} onClick={onNext}>
          {TEXT.concern.nextButton}
        </PrimaryButton>
      </div>
    </>
  );
}
