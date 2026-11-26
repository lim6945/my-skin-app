"use client";

import { useCallback, useState } from "react";
import { TEXT, type Evidence } from "@/lib/data";
import type { AxisResult, IngredientResult, SkinResult } from "@/lib/quiz";
import { track } from "@/lib/track";
import { PrimaryButton, SecondaryButton, Toast, copyText } from "./ui";

const FEEDBACK_OPTIONS = [
  { value: "good", label: "잘 맞아요" },
  { value: "partial", label: "일부 맞아요" },
  { value: "bad", label: "안 맞아요" },
] as const;

export default function ResultView({
  result,
  showConsult,
  onRestart,
}: {
  result: SkinResult;
  showConsult: boolean;
  onRestart: () => void;
}) {
  const t = TEXT.result;
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const hasIngredients = result.ingredients.length > 0;

  const copyIngredients = async () => {
    const names = result.ingredients.flatMap((i) => i.copyNames).join(", ");
    const ok = await copyText(names);
    track("copy_ingredients", { value: names });
    setToast(ok ? t.copied : t.copyFailed);
  };

  const share = async () => {
    track("share", { value: result.name });
    const url = window.location.origin;
    const text = t.shareText(result.name);
    if (navigator.share) {
      try {
        await navigator.share({ title: t.shareTitle, text, url });
        return;
      } catch {
        // 사용자가 공유 창을 닫은 경우 등 — 아무것도 하지 않음
        return;
      }
    }
    const ok = await copyText(`${text}\n${url}`);
    setToast(ok ? t.linkCopied : t.copyFailed);
  };

  return (
    <main className="mx-auto max-w-md pb-12 animate-fade-in">
      {/* 1. 상담 우선 안내 (H1 = 예) */}
      {showConsult && (
        <section className="mx-7 mt-6 rounded-2xl border border-line bg-surface px-5 py-4" aria-label={t.consultTitle}>
          <h2 className="text-[15px] font-bold text-title">{t.consultTitle}</h2>
          <p className="mt-1 text-[14px] leading-[1.6] text-body">{t.consultBody}</p>
        </section>
      )}

      {/* 2. 결과 타입명 + 요약 */}
      <section className={`bg-point-soft px-7 pb-8 pt-10 ${showConsult ? "mt-6" : ""}`}>
        <p className="text-[14px] font-semibold text-point">{t.label}</p>
        <h1 className="mt-2 text-[28px] font-bold leading-[1.35] tracking-[-0.03em] text-title">
          {result.name}
          {result.nickname && (
            <span className="ml-2 align-middle text-[16px] font-semibold text-point">({result.nickname})</span>
          )}
        </h1>
        <p className="mt-4 text-[16px] leading-[1.65] text-body">{result.summary}</p>
        <p
          className={`mt-3 text-[14px] font-medium leading-[1.6] ${
            result.borderlineCount > 0 ? "text-caution" : "text-sub"
          }`}
        >
          {result.confidence}
        </p>
      </section>

      <div className="px-7">
        {/* 3. 내 피부에 맞는 성분 (핵심) */}
        <section className="pt-9" aria-labelledby="ingredients-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="ingredients-title" className="text-[18px] font-bold text-title">
              {t.ingredientsTitle}
              {hasIngredients && <span className="ml-1.5 text-point tabular-nums">{result.ingredients.length}</span>}
            </h2>
            {hasIngredients && (
              <button
                type="button"
                onClick={copyIngredients}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-point-soft px-3.5 text-[14px] font-semibold text-point outline-none focus-visible:ring-2 focus-visible:ring-point focus-visible:ring-offset-2"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="8" y="8" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" stroke="currentColor" strokeWidth="2" />
                </svg>
                {t.copyButton}
              </button>
            )}
          </div>

          {hasIngredients ? (
            <>
              <p className="mt-1.5 text-[14px] leading-[1.6] text-sub">{t.ingredientsSub}</p>
              <ol className="mt-5 flex flex-col gap-3">
                {result.ingredients.map((ing, i) => (
                  <IngredientCard
                    key={ing.id}
                    index={i}
                    ingredient={ing}
                    open={openId === ing.id}
                    onToggle={() => {
                      const willOpen = openId !== ing.id;
                      setOpenId(willOpen ? ing.id : null);
                      if (willOpen) track("evidence_open", { value: ing.name });
                    }}
                  />
                ))}
              </ol>
              <p className="mt-4 text-[13px] leading-[1.6] text-sub">{t.ingredientsHint}</p>
            </>
          ) : (
            <p className="mt-4 rounded-2xl bg-surface px-5 py-5 text-[15px] leading-[1.65] text-body">
              {t.ingredientsEmpty}
            </p>
          )}
        </section>

        {/* 4. 주의할 점 */}
        {result.cautions.length > 0 && (
          <section className="mt-8 rounded-2xl bg-caution-bg px-5 py-5" aria-labelledby="caution-title">
            <h2 id="caution-title" className="text-[16px] font-bold text-caution">
              {t.cautionTitle}
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {result.cautions.map((c) => (
                <li key={c.text} className="flex gap-2 text-[15px] leading-[1.6] text-[#4E3A17]">
                  <span aria-hidden className="mt-[0.6em] size-1 shrink-0 rounded-full bg-caution" />
                  <span>
                    {c.text}
                    {c.evidence && <CautionEvidence evidence={c.evidence} />}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 5. 왜 이런 결과가 나왔을까요 */}
        <section className="mt-12" aria-labelledby="why-title">
          <h2 id="why-title" className="text-[18px] font-bold text-title">
            {t.whyTitle}
          </h2>
          <p className="mt-1.5 text-[14px] leading-[1.6] text-sub">{t.whySub}</p>
          <div className="mt-6 flex flex-col gap-7">
            {result.axes.map((a) => (
              <Gauge key={a.axis} axis={a} />
            ))}
          </div>
        </section>

        {/* 6. 피드백 */}
        <section className="mt-12 border-t border-line pt-8" aria-labelledby="feedback-title">
          <h2 id="feedback-title" className="text-[18px] font-bold text-title">
            {t.feedbackTitle}
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="feedback-title">
            {FEEDBACK_OPTIONS.map((o) => {
              const selected = feedback === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={o.label}
                  onClick={() => {
                    setFeedback(o.value);
                    track("feedback", { value: o.value });
                  }}
                  className={`h-12 rounded-xl text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-point focus-visible:ring-offset-2 ${
                    selected ? "bg-point font-semibold text-white" : "bg-surface font-medium text-title"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          {feedback && (
            <p className="mt-3 text-[14px] text-sub" aria-live="polite">
              {t.feedbackThanks}
            </p>
          )}
        </section>

        {/* 7. 버튼 + 안내 문구 */}
        <section className="mt-10 grid grid-cols-2 gap-2">
          <SecondaryButton onClick={onRestart}>{t.restartButton}</SecondaryButton>
          <PrimaryButton onClick={share}>{t.shareButton}</PrimaryButton>
        </section>
        <p className="mt-8 text-[13px] leading-[1.6] text-sub">{t.disclaimer}</p>
      </div>

      <Toast message={toast} onDone={clearToast} />
    </main>
  );
}

/* ─────────────── 성분 카드 ─────────────── */

function IngredientCard({
  index,
  ingredient,
  open,
  onToggle,
}: {
  index: number;
  ingredient: IngredientResult;
  open: boolean;
  onToggle: () => void;
}) {
  const first = index === 0;
  const panelId = `evidence-${ingredient.id}`;

  return (
    <li
      className={`rounded-2xl ${
        first ? "border-[1.5px] border-point bg-white" : "border-[1.5px] border-transparent bg-surface"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-start gap-3 rounded-2xl p-[18px] text-left outline-none focus-visible:ring-2 focus-visible:ring-point"
      >
        <span
          aria-hidden
          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[14px] font-bold tabular-nums ${
            first ? "bg-point text-white" : "bg-white text-title"
          }`}
        >
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="sr-only">{index + 1}번 성분 </span>
          <span className="block text-[19px] font-bold leading-[1.35] text-title">{ingredient.name}</span>
          <span className="mt-1 block text-[15px] leading-[1.55] text-body">{ingredient.reason}</span>
          {ingredient.note && <span className="mt-1 block text-[13px] leading-[1.5] text-sub">{ingredient.note}</span>}
          {ingredient.testTag && (
            <span className="mt-2 inline-block rounded-md bg-caution-bg px-2 py-0.5 text-[13px] font-medium text-caution">
              {ingredient.testTag}
            </span>
          )}
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`mt-1 shrink-0 text-sub transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div id={panelId} className="px-[18px] pb-[18px] pl-[58px]">
          <div className={`rounded-xl px-4 py-4 ${first ? "bg-surface" : "bg-white"}`}>
            <ul className="flex flex-col gap-2">
              {ingredient.claims.map((c) => (
                <li key={`${c.ruleId}-${c.reason}`} className="text-[14px] leading-[1.6] text-body">
                  <span
                    className={`mr-1.5 font-semibold ${c.level === "verified" ? "text-verified" : "text-limited"}`}
                  >
                    {c.levelLabel}
                  </span>
                  <span className="text-title">
                    {c.ruleLabel} — {c.reason}
                  </span>
                  {c.level === "limited" && (
                    <span className="mt-0.5 block text-[13px] text-sub">{c.levelDescription}</span>
                  )}
                </li>
              ))}
            </ul>
            {ingredient.evidences.length > 0 && (
              <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
                {ingredient.evidences.map((e) => (
                  <EvidenceBlock key={e.text} evidence={e} ingredientName={ingredient.name} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function EvidenceBlock({ evidence, ingredientName }: { evidence: Evidence; ingredientName: string }) {
  const t = TEXT.result;
  return (
    <div>
      <p className="text-[14px] leading-[1.6] text-body">{evidence.text}</p>
      {evidence.url ? (
        <a
          href={evidence.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("source_click", { value: ingredientName })}
          className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-point underline-offset-4 hover:underline focus-visible:underline outline-none"
        >
          {t.sourceLink} · {evidence.source}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sr-only">(새 창)</span>
        </a>
      ) : (
        <p className="mt-1 text-[13px] text-sub">
          {t.sourceLabel} · {evidence.source}
        </p>
      )}
    </div>
  );
}

function CautionEvidence({ evidence }: { evidence: Evidence }) {
  return (
    <span className="mt-1 block text-[13px] leading-[1.55] text-caution">
      {evidence.text}{" "}
      {evidence.url ? (
        <a
          href={evidence.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("source_click", { value: evidence.source })}
          className="font-semibold underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-point"
        >
          {TEXT.result.sourceLink}
          <span className="sr-only"> ({evidence.source}, 새 창)</span>
        </a>
      ) : (
        <span>({evidence.source})</span>
      )}
    </span>
  );
}

/* ─────────────── 3칸 눈금 (% 숫자 없음) ─────────────── */

function Gauge({ axis }: { axis: AxisResult }) {
  const border = axis.isBorder;
  // 점이 칸 끝에 붙지 않도록 칸 안에서 8%~92% 사이로 둡니다.
  const posInCell = 0.08 + axis.position * 0.84;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-title">{axis.name}</h3>
        <p className={`text-[15px] font-bold ${border ? "text-caution" : "text-point"}`}>
          {axis.judgment}
          {axis.leanText && <span className="ml-1 text-[13px] font-medium">· {axis.leanText}</span>}
        </p>
      </div>
      <div className="relative mt-3 grid grid-cols-3 gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`relative h-2 rounded-full ${
              i === axis.cell ? (border ? "bg-border-fill" : "bg-point") : "bg-line"
            }`}
          >
            {i === axis.cell && (
              <span
                className={`absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] bg-white ${
                  border ? "border-border-dot" : "border-point"
                }`}
                style={{ left: `${posInCell * 100}%` }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-[12px] text-sub">
        {axis.cells.map((c, i) => (
          <span
            key={c}
            className={`text-center ${i === axis.cell ? (border ? "font-semibold text-caution" : "font-semibold text-point") : ""}`}
          >
            {c}
          </span>
        ))}
      </div>
      <p className="sr-only">
        {axis.name}: {axis.judgment}
        {axis.leanText ? `, ${axis.leanText}` : ""}
      </p>
    </div>
  );
}
