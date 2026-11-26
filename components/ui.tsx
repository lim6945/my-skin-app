"use client";

import { useEffect } from "react";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-point focus-visible:ring-offset-2";

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      type="button"
      {...rest}
      className={`h-14 w-full rounded-full bg-point text-[17px] font-semibold text-white transition-opacity disabled:opacity-40 active:opacity-90 ${focusRing} ${className}`}
    />
  );
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      type="button"
      {...rest}
      className={`h-14 w-full rounded-full bg-point-soft text-[17px] font-semibold text-point transition-opacity active:opacity-90 ${focusRing} ${className}`}
    />
  );
}

/**
 * 전체 폭 선택지 행 (높이 58px)
 * - role="radio": 오른쪽 22px 동그라미 (하나만 고르는 문항)
 * - role="checkbox": 오른쪽 22px 네모 체크박스 (여러 개 고르는 문항)
 * 선택지 글자가 그대로 화면 읽기 프로그램용 이름(aria-label)이 됩니다.
 */
export function ChoiceRow({
  label,
  selected,
  onClick,
  role = "radio",
  disabled,
  dimmed,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  role?: "radio" | "checkbox";
  disabled?: boolean;
  /** 더 고를 수 없는 선택지를 흐리게 표시 */
  dimmed?: boolean;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      aria-label={label}
      aria-disabled={dimmed || undefined}
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-[58px] w-full items-center justify-between gap-4 border-b border-line py-3 text-left text-[17px] ${dimmed ? "" : "text-title"} ${focusRing} focus-visible:ring-offset-0 rounded-md ${
        selected ? "font-bold" : "font-normal"
      } ${dimmed ? "text-sub" : ""}`}
    >
      <span>{label}</span>
      <span
        aria-hidden
        className={`flex size-[22px] shrink-0 items-center justify-center border-2 transition-colors ${
          role === "checkbox" ? "rounded-[6px]" : "rounded-full"
        } ${
          selected ? "border-point bg-point" : "border-[#D1D6DB] bg-white"
        }`}
      >
        {selected && (
          role === "checkbox" ? (
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6.2 5 8.5l4.5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="size-2 rounded-full bg-white" />
          )
        )}
      </span>
    </button>
  );
}

/** 상단: 이전 화살표 + "14 / 18" + 3px 진행바 */
export function TopBar({
  onBack,
  backLabel,
  current,
  total,
}: {
  onBack: () => void;
  backLabel: string;
  current: number;
  total: number | null;
}) {
  const progress = total ? Math.min(1, current / total) : 0;
  return (
    <div className="sticky top-0 z-10 bg-white pt-2">
      <div className="flex h-11 items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className={`-ml-3 flex size-11 items-center justify-center rounded-full text-title ${focusRing}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {total ? (
          <span className="text-[14px] font-medium text-sub tabular-nums" aria-label={`${total}문항 중 ${current}번째`}>
            {current} / {total}
          </span>
        ) : null}
      </div>
      <div
        className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total ?? 1}
        aria-valuenow={total ? current : 0}
      >
        <div className="h-full rounded-full bg-point transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 animate-toast rounded-full bg-[#333D4B] px-5 py-3 text-[15px] font-medium text-white shadow-lg"
    >
      {message}
    </div>
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 아래 방법으로 다시 시도 */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
