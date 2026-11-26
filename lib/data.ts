/**
 * ─────────────────────────────────────────────────────────────
 *  내 피부 성분 찾기 — 콘텐츠 데이터 (이 파일만 고치면 내용이 바뀝니다)
 * ─────────────────────────────────────────────────────────────
 *  1. 화면 문구 (TEXT)
 *  2. 성별 · 응답 척도
 *  3. 문항 (공통 + 성별 경로별)
 *  4. 고민(C1) · 확인(H1) · 나이(A1) 문항
 *  5. 판정 기준값 (THRESHOLDS)
 *  6. 판정 결과 이름 · 요약 문장
 *  7. 근거 수준 표시
 *  8. 근거 문장 · 출처 (EVIDENCE)
 *  9. 성분 목록 (INGREDIENTS)
 * 10. 결과별 성분 · 주의할 점 규칙 (RULES)
 *
 *  ※ 문구 규칙: 치료, 진정, 항염, 항균, 재생, 여드름 개선, 완치, 100%, 부작용 없음 은 쓰지 않습니다.
 *  ※ 근거 수준이 'unchecked'인 설명은 화면에 나오지 않습니다. 확인 후 'verified' 또는 'limited'로 바꾸면 노출됩니다.
 */

/* ─────────────── 1. 화면 문구 ─────────────── */

export const TEXT = {
  home: {
    label: "피부 성향 체크",
    title: "내 피부에 맞는\n성분 찾기",
    intro:
      "몇 가지 질문에 답하면 내 피부 성향과, 화장품 전성분에서 찾아볼 성분을 알려드려요.",
    info: [
      { label: "소요 시간", value: "약 3분 · 19문항" },
      { label: "알려드리는 것", value: "피부 성향 · 찾아볼 성분 · 주의할 점" },
      { label: "개인정보", value: "수집하지 않아요" },
    ],
    startButton: "시작하기",
    footer: "피부과 진단이 아닌 참고 정보예요",
  },
  gender: {
    question: "성별을 알려주세요",
    note: "생활 습관에 맞춰 질문 몇 개가 달라져요",
  },
  concern: {
    nextButton: "다음",
    maxNote: "최대 2개까지 고를 수 있어요",
  },
  age: {
    resultButton: "결과 보기",
  },
  quiz: {
    backLabel: "이전 문항으로",
  },
  result: {
    label: "내 피부 성향",
    consultTitle: "전문의 상담을 먼저 권해요",
    consultBody:
      "피부과에서 피부 질환을 관리 중이라면, 이 결과보다 담당 전문의의 안내를 먼저 따라 주세요. 새 성분을 쓰기 전에 상담해 보세요.",
    ingredientsTitle: "내 피부에 맞는 성분",
    ingredientsSub: "쇼핑할 때 전성분에서 이 이름을 찾아보세요",
    copyButton: "성분명 복사",
    copied: "복사했어요",
    copyFailed: "복사하지 못했어요. 성분명을 길게 눌러 복사해 주세요",
    ingredientsEmpty: "이 결과에 맞는 성분 정보를 확인하고 있어요",
    ingredientsHint:
      "눌러 보면 근거와 출처를 볼 수 있어요. 번호는 내 결과와 맞는 정도 순이고, 근거 표시는 추천 순위가 아니에요.",
    evidenceTitle: "근거",
    sourceLink: "출처 보기",
    sourceLabel: "출처",
    cautionTitle: "주의할 점",
    whyTitle: "왜 이런 결과가 나왔을까요",
    whySub: "답한 내용을 축별로 나눠 봤어요. 점은 칸 안에서 내 응답이 어디쯤인지 보여줘요.",
    feedbackTitle: "결과가 내 피부와 맞나요?",
    feedbackThanks: "알려주셔서 고마워요",
    restartButton: "다시 하기",
    shareButton: "결과 공유하기",
    shareTitle: "내 피부 성분 찾기",
    shareText: (resultName: string) =>
      `내 피부 성향은 "${resultName}"이래요. 나에게 맞는 성분도 찾아보세요.`,
    linkCopied: "링크를 복사했어요",
    disclaimer:
      "자가 응답을 바탕으로 한 참고 정보이며 피부과 진단이 아니에요. 특정 제품을 추천하지 않아요. 피부 질환이 있거나 증상이 계속되면 전문의와 상담하세요.",
    clearConfidence: "응답이 뚜렷해요.",
    // {axes} 자리에 "T존 유분은", "T존 유분과 수분은"처럼 경계 축 이름이 들어갑니다.
    borderConfidence: "{axes} 경계에 있어요. 계절이나 컨디션에 따라 달라질 수 있어요.",
    activeTestTag: "예민한 피부라면 테스트 후 저농도부터",
  },
} as const;

/* ─────────────── 2. 성별 · 응답 척도 ─────────────── */

export type Gender = "female" | "male" | "unspecified";

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
  { value: "unspecified", label: "답하지 않을래요" },
];

/** 4점 척도. "해당 없어요"는 점수 계산에서 빠집니다. */
export const SCALE: { label: string; score: number }[] = [
  { label: "전혀 아니에요", score: 0 },
  { label: "가끔 그래요", score: 1 },
  { label: "자주 그래요", score: 2 },
  { label: "거의 항상 그래요", score: 3 },
];
export const MAX_SCORE_PER_QUESTION = 3;

/* ─────────────── 3. 문항 ─────────────── */

export type Axis = "tzone" | "cheek" | "moisture" | "sensitivity";
export type StageKey = "gender" | "oil" | "moisture" | "sensitivity" | "concern" | "check" | "age";

export const STAGE_LABELS: Record<StageKey, string> = {
  gender: "시작",
  oil: "유분",
  moisture: "수분",
  sensitivity: "민감도",
  concern: "고민",
  check: "확인",
  age: "나이 (선택)",
};

export interface QuestionVariant {
  text: string;
  /** 있으면 "해당 없어요" 버튼이 생깁니다. 이유까지 문장으로 적어 주세요. */
  notApplicableLabel?: string;
}

export interface QuestionDef {
  id: string;
  axis: Axis;
  stage: StageKey;
  /** 공통 문항 문장 */
  text?: string;
  /** 성별 경로별 문장. 적지 않은 성별(또는 null)은 이 문항을 건너뜁니다. */
  variants?: Partial<Record<Gender, QuestionVariant | null>>;
}

/** 화면에 나오는 순서대로 적습니다. */
export const QUESTIONS: QuestionDef[] = [
  // 유분 · T존 (O1~O3)
  { id: "O1", axis: "tzone", stage: "oil", text: "세안 후 아무것도 바르지 않고 2~3시간 지나면 이마·코가 번들거려요" },
  {
    id: "O2",
    axis: "tzone",
    stage: "oil",
    variants: {
      female: {
        text: "오후가 되면 이마·코의 메이크업이나 선크림이 유분에 밀려 무너져요",
        notApplicableLabel: "메이크업이나 선크림을 안 발라서 해당 없어요",
      },
      male: { text: "오후가 되면 이마·코가 번들거려 닦아내고 싶어져요" },
      unspecified: { text: "오후가 되면 이마·코가 번들거려 닦아내고 싶어져요" },
    },
  },
  { id: "O3", axis: "tzone", stage: "oil", text: "이마·코에 기름종이를 대면 기름이 묻어나요" },
  // 유분 · 볼 (O4~O5)
  { id: "O4", axis: "cheek", stage: "oil", text: "세안 후 2~3시간 지나면 볼도 번들거려요" },
  { id: "O5", axis: "cheek", stage: "oil", text: "볼에 기름종이를 대면 기름이 묻어나요" },
  // 수분 (W1~W4)
  { id: "W1", axis: "moisture", stage: "moisture", text: "세안 후 아무것도 안 바르면 30분 안에 얼굴이 당겨요" },
  { id: "W2", axis: "moisture", stage: "moisture", text: "냉난방이 켜진 실내에 1~2시간 있으면 피부가 당기거나 푸석해져요" },
  { id: "W3", axis: "moisture", stage: "moisture", text: "볼이나 입가에 하얗게 각질이 일어나요" },
  {
    id: "W4",
    axis: "moisture",
    stage: "moisture",
    variants: {
      female: {
        text: "메이크업이 각질 때문에 들뜨거나 갈라져요",
        notApplicableLabel: "메이크업을 안 해서 해당 없어요",
      },
      male: {
        text: "면도 후 얼굴이 당기거나 건조해져요",
        notApplicableLabel: "면도를 안 해서 해당 없어요",
      },
      unspecified: null,
    },
  },
  // 민감도 (S1~S6)
  { id: "S1", axis: "sensitivity", stage: "sensitivity", text: "새 화장품을 처음 바르면 따갑거나 화끈거려요" },
  { id: "S2", axis: "sensitivity", stage: "sensitivity", text: "기온이 갑자기 바뀌거나 찬바람을 맞으면 얼굴이 붉어져요" },
  { id: "S3", axis: "sensitivity", stage: "sensitivity", text: "특별한 이유 없이 얼굴이 가렵거나 따끔거려요" },
  { id: "S4", axis: "sensitivity", stage: "sensitivity", text: "향이 강하거나 알코올(에탄올)이 많은 제품을 쓰면 자극이 느껴져요" },
  { id: "S5", axis: "sensitivity", stage: "sensitivity", text: "각질 제거 제품(필링, 스크럽)을 쓰면 붉어지거나 따가워요" },
  {
    id: "S6",
    axis: "sensitivity",
    stage: "sensitivity",
    variants: {
      female: {
        text: "클렌징·메이크업 리무버를 쓴 뒤 따갑거나 붉어져요",
        notApplicableLabel: "메이크업 리무버를 안 써서 해당 없어요",
      },
      male: {
        text: "면도 후 따갑거나 붉어지거나 오돌토돌해져요",
        notApplicableLabel: "면도를 안 해서 해당 없어요",
      },
      unspecified: null,
    },
  },
];

/* ─────────────── 4. 고민 · 확인 · 나이 문항 ─────────────── */

export type ConcernKey = "trouble" | "dullness" | "dryness" | "wrinkle" | "none";

export const CONCERN_QUESTION = {
  id: "C1",
  stage: "concern" as StageKey,
  text: "요즘 가장 신경 쓰이는 고민을 골라 주세요",
  maxSelect: 2,
  options: [
    { value: "trouble", label: "트러블·모공" },
    { value: "dullness", label: "칙칙함·잡티" },
    { value: "dryness", label: "건조·각질" },
    { value: "wrinkle", label: "잔주름·탄력" },
    { value: "none", label: "특별히 없어요" },
  ] as { value: ConcernKey; label: string }[],
  /** 이 값을 고르면 다른 선택이 풀립니다. */
  exclusiveValue: "none" as ConcernKey,
};

/** H1 — 응답은 저장하지 않습니다. 결과 화면 맨 위 상담 안내에만 씁니다. */
export const CHECK_QUESTION = {
  id: "H1",
  stage: "check" as StageKey,
  text: "피부과에서 피부 질환(아토피피부염, 지루피부염, 주사 등) 진단을 받고 관리 중인가요?",
  options: [
    { value: true, label: "예" },
    { value: false, label: "아니오" },
  ],
};

export type AgeGroup = "under19" | "20s" | "30s" | "40plus" | "unspecified";

/** A1 — 선택 문항. 결과에는 영향을 주지 않습니다. */
export const AGE_QUESTION = {
  id: "A1",
  stage: "age" as StageKey,
  text: "연령대를 알려주세요",
  subText: "만 나이 기준",
  note: "서비스 개선을 위한 통계에만 쓰여요. 결과는 달라지지 않아요.",
  options: [
    { value: "under19", label: "19세 이하" },
    { value: "20s", label: "20대" },
    { value: "30s", label: "30대" },
    { value: "40plus", label: "40세 이상" },
    { value: "unspecified", label: "답하지 않을래요" },
  ] as { value: AgeGroup; label: string }[],
};

/* ─────────────── 5. 판정 기준값 ─────────────── */
/*  비율 = 획득 점수 ÷ (답한 문항 수 × 3). "해당 없어요"는 분모·분자 모두에서 빠집니다.
 *  T존·볼·수분: high 이상 = 높음(수분은 '부족'), border 이상 = 경계, 그 아래 = 낮음(수분은 '충분')
 *    → 경계는 경계 구간의 가운데를 기준으로 가까운 쪽 유형으로 판정하고 "경계"를 표시합니다.
 *  민감도: high 이상 = 예민, mid 이상 = 약간 예민, 그 아래 = 튼튼 (민감도에는 경계 표시가 없습니다)
 */
export const THRESHOLDS = {
  tzone: { high: 0.5, border: 0.3 },
  cheek: { high: 0.5, border: 0.3 },
  moisture: { high: 0.5, border: 0.3 },
  sensitivity: { high: 0.6, mid: 0.3 },
};

/** 남성 경로에서 면도 문항(W4 또는 S6)이 이 점수 이상이면 면도 관련 안내를 붙입니다. (2 = "자주 그래요") */
export const SHAVING_TRIGGER_SCORE = 2;

/** 결과 화면에 보여줄 성분 최대 개수 */
export const MAX_INGREDIENTS = 5;

/* ─────────────── 6. 판정 결과 이름 · 요약 ─────────────── */

export type OilType = "oily" | "combination" | "low_oil";
export type MoistureLevel = "lacking" | "enough";
export type SensitivityLevel = "sensitive" | "slightly_sensitive" | "resilient";

/** 결과 눈금(3칸)의 축 이름과 칸 이름 — 왼쪽부터 */
export const AXIS_DISPLAY: Record<Axis, { name: string; cells: [string, string, string] }> = {
  tzone: { name: "T존 유분", cells: ["낮음", "경계", "높음"] },
  cheek: { name: "볼 유분", cells: ["낮음", "경계", "높음"] },
  moisture: { name: "수분", cells: ["충분", "경계", "부족"] },
  sensitivity: { name: "민감도", cells: ["튼튼", "약간 예민", "예민"] },
};

/** 경계일 때 "○○ 쪽에 가까워요" 표시에 쓰는 말 */
export const BORDER_LEAN_TEXT = (nearCell: string) => `${nearCell}에 가까워요`;

export const OIL_TYPE_LABEL: Record<OilType, string> = {
  oily: "지성",
  combination: "복합성",
  low_oil: "유분 적음",
};

/** 피부 성향 이름 (유분 × 수분) */
export const SKIN_TYPE_NAME: Record<OilType, Record<MoistureLevel, { name: string; nickname?: string }>> = {
  oily: {
    lacking: { name: "수분 부족 지성", nickname: "수부지" },
    enough: { name: "지성" },
  },
  combination: {
    lacking: { name: "수분 부족 복합성", nickname: "수부지" },
    enough: { name: "복합성" },
  },
  low_oil: {
    lacking: { name: "건성" },
    enough: { name: "중성" },
  },
};

/** 결과 타입명 앞에 붙는 민감도 말 — "{민감도} {피부 성향 이름}" */
export const SENSITIVITY_PREFIX: Record<SensitivityLevel, string> = {
  sensitive: "예민한",
  slightly_sensitive: "약간 예민한",
  resilient: "튼튼한",
};

/** 결과 상단 쉬운 말 요약 */
export const SUMMARY = {
  oil: {
    oily: "T존과 볼 모두 유분이 많은 편이에요.",
    combinationTzone: "T존은 유분이 많고, 볼은 덜한 편이에요.",
    combinationCheek: "볼에 유분이 더 많고, T존은 덜한 편이에요.",
    low_oil: "얼굴 전체에 유분이 적은 편이에요.",
  },
  moisture: {
    lacking: "세안 후나 냉난방 환경에서 당김을 자주 느껴서, 수분을 붙잡아 주는 성분이 잘 맞아요.",
    enough: "당김은 크지 않은 편이에요.",
    /** 수분이 경계인데 부족 쪽에 가까울 때 */
    borderLacking: "당김을 느끼는 때가 꽤 있는 편이라, 수분을 붙잡아 주는 성분이 도움이 될 수 있어요.",
    /** 수분이 경계인데 충분 쪽에 가까울 때 */
    borderEnough: "당김이 크지는 않지만 가끔 느끼는 편이에요.",
  },
  sensitivity: {
    sensitive: "자극에 예민하게 반응하는 편이라 새 제품은 조금씩 테스트해 보는 게 좋아요.",
    slightly_sensitive: "가끔 자극을 느끼는 편이라 새 제품은 조금씩 테스트해 보는 게 좋아요.",
    resilient: "자극에 비교적 덜 반응하는 편이라 고민에 맞는 기능성 성분을 시도해 볼 수 있어요.",
  },
};

/* ─────────────── 7. 근거 수준 표시 ─────────────── */

export type EvidenceLevel = "verified" | "limited" | "unchecked";

/** 화면에 보이는 근거 수준. unchecked는 화면에 나오지 않으므로 표시 문구가 없습니다. */
export const EVIDENCE_LEVEL_DISPLAY: Record<"verified" | "limited", { label: string; description: string }> = {
  verified: {
    label: "연구·고시 확인",
    description: "연구 또는 식약처 고시로 확인한 설명이에요.",
  },
  limited: {
    label: "연구 적음",
    description: "연구는 있지만 비교군이 없는 등 근거가 약한 설명이에요.",
  },
};

/* ─────────────── 8. 근거 문장 · 출처 ─────────────── */

export interface EvidenceSource {
  source: string;
  /** 링크가 없으면 출처 이름만 보여줍니다. */
  url?: string;
}

export interface Evidence extends EvidenceSource {
  text: string;
  /** 출처가 두 개 이상이면 나머지를 여기에 적습니다. */
  moreSources?: EvidenceSource[];
}

export const EVIDENCE: Record<string, Evidence> = {
  niacinamide: {
    text: "2% 나이아신아마이드를 4주간 바른 연구에서 피지 분비가 줄었어요. 식약처 미백 기능성 고시 성분이에요.",
    source: "Draelos 외 2006",
    url: "https://pubmed.ncbi.nlm.nih.gov/16766489/",
  },
  salicylicAcid: {
    text: "여드름성 피부 완화에 도움을 주는 씻어내는 기능성화장품에 가장 많이 쓰이는 주성분이에요.",
    source: "식약처",
    url: "https://www.mfds.go.kr/brd/m_768/view.do?seq=3659",
  },
  glycerin: {
    text: "냉난방 환경에서 수분이 쉽게 빠지는 피부를 대상으로 한 연구에서 글리세린 제품이 가장 빨리 수분을 되돌렸어요.",
    source: "대한화장품학회지 2020",
    url: "https://koreascience.kr/article/JAKO202019962558995.pdf",
  },
  sensitive2025: {
    text: "민감 피부 대상 연구에서 붉은기와 피부 장벽 지표가 나아졌어요. 다만 비교군 없는 연구라 근거는 제한적이에요.",
    source: "J Cosmet Dermatol 2025",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12274965/",
  },
  whitening: {
    text: "식약처 미백 기능성 고시 성분이에요.",
    source: "식약처 고시",
    url: "https://www.mfds.go.kr/brd/m_207/view.do?seq=15120",
  },
  wrinkle: {
    text: "식약처 주름개선 기능성 고시 성분이에요.",
    source: "식약처 고시",
    url: "https://www.mfds.go.kr/brd/m_207/view.do?seq=15120",
  },
  ceramideNP: {
    text: "세라마이드가 든 보습제를 4주간 바른 무작위·이중맹검 연구에서 피부 수분이 늘고 수분 손실이 줄었어요. 다만 세라마이드만 따로 시험한 건 아니에요.",
    source: "Dermatol Ther 2019",
    url: "https://pubmed.ncbi.nlm.nih.gov/31585489/",
  },
  panthenol: {
    text: "판테놀(덱스판테놀)은 피부 각질층 수분을 높이고 수분 손실을 줄이는 보습 성분으로 정리돼 있어요. 자극받은 피부에서 성분이 없는 크림보다 장벽 회복이 빨랐다는 연구도 있어요.",
    source: "Am J Clin Dermatol 2002",
    url: "https://pubmed.ncbi.nlm.nih.gov/12113650/",
    moreSources: [{ source: "J Dermatolog Treat 2002", url: "https://pubmed.ncbi.nlm.nih.gov/19753737/" }],
  },
  sodiumHyaluronate: {
    text: "히알루론산 세럼을 6주 바른 연구에서 피부 수분이 늘었어요. 다만 비교군이 없고 제조사가 지원한 연구라 근거는 제한적이에요.",
    source: "Dermatol Ther 2021",
    url: "https://link.springer.com/article/10.1007/s13555-021-00566-0",
  },
  aha: {
    text: "4주 사용 후 자외선에 의한 붉어짐 민감도가 18% 높아졌다는 연구가 있어요 (사용을 멈추면 회복).",
    source: "FDA",
    url: "https://www.fda.gov/cosmetics/ingredients/alpha-hydroxy-acids",
  },
  shaving: {
    text: "남성 340명 설문에서 면도 후 가장 흔한 피부 문제는 자극과 건조였어요.",
    source: "J Cosmet Dermatol 2021",
    url: "https://pubmed.ncbi.nlm.nih.gov/34254359/",
  },
};

/* ─────────────── 9. 성분 목록 ─────────────── */
/*  name: 화면에 보이는 이름(전성분 표기명)
 *  copyNames: [성분명 복사] 때 들어갈 이름 (없으면 name)
 *  note: 카드에 항상 보이는 짧은 안내
 *  active: AHA·BHA·레티놀 — 민감도가 "예민"·"약간 예민"이면 "테스트 후 저농도부터"를 붙입니다.
 *  적힌 순서는 다른 조건이 모두 같을 때의 마지막 정렬 기준입니다.
 */
export interface Ingredient {
  name: string;
  copyNames?: string[];
  note?: string;
  active?: boolean;
}

export const INGREDIENTS: Record<string, Ingredient> = {
  niacinamide: { name: "나이아신아마이드" },
  glycerin: { name: "글리세린" },
  salicylicAcid: {
    name: "살리실릭애씨드",
    note: "스킨케어가 아니라 씻어내는 기능성 클렌저에서 찾아보세요",
    active: true,
  },
  adenosine: { name: "아데노신" },
  retinol: { name: "레티놀", active: true },
  arbutin: { name: "알부틴" },
  ascorbylGlucoside: { name: "아스코빌글루코사이드", note: "비타민C 유도체예요" },
  panthenol: { name: "판테놀" },
  ceramideNP: { name: "세라마이드엔피" },
  centella: {
    name: "병풀추출물·마데카소사이드",
    copyNames: ["병풀추출물", "마데카소사이드"],
  },
  squalane: { name: "스쿠알란" },
  sheaButter: { name: "시어버터" },
  sodiumHyaluronate: { name: "소듐하이알루로네이트" },
  allantoin: { name: "알란토인" },
};

/* ─────────────── 10. 결과별 성분 · 주의할 점 규칙 ─────────────── */

export type RuleCondition =
  | { type: "oil"; value: OilType }
  | { type: "moisture"; value: MoistureLevel }
  | { type: "sensitivity"; values: SensitivityLevel[] }
  | { type: "concern"; value: ConcernKey }
  | { type: "oilAndConcern"; oil: OilType; concern: ConcernKey }
  /** 남성 경로 + 면도 문항(W4 또는 S6)이 SHAVING_TRIGGER_SCORE 이상 */
  | { type: "shaving" };

export interface RuleItem {
  ingredient: keyof typeof INGREDIENTS;
  /** 카드에 보이는 "맞는 이유" 한 줄 */
  reason: string;
  /** 근거 수준은 "성분 + 이 설명" 한 쌍에 붙습니다. */
  level: EvidenceLevel;
  evidence?: keyof typeof EVIDENCE;
  /** limited일 때 펼친 영역에 보여줄 "연구 적음"의 이유. 없으면 기본 설명을 씁니다. */
  levelNote?: string;
}

export interface Caution {
  text: string;
  evidence?: keyof typeof EVIDENCE;
}

export interface Rule {
  id: string;
  /** 같은 그룹은 "여러 결과에 함께 걸리는지" 셀 때 하나로 봅니다. 고민 규칙은 "concern:"으로 시작합니다. */
  group: string;
  /** "○○와 ○○에 함께 맞아요"에 들어가는 이름 */
  label: string;
  when: RuleCondition;
  items: RuleItem[];
  /** 주의할 점은 근거 수준과 관계없이 항상 보여줍니다. */
  cautions: Caution[];
}

export const RULES: Rule[] = [
  {
    id: "oily",
    group: "oil",
    label: "지성 피부",
    when: { type: "oil", value: "oily" },
    items: [
      { ingredient: "niacinamide", reason: "피지 관리에 도움을 줄 수 있어요", level: "verified", evidence: "niacinamide" },
    ],
    cautions: [{ text: "유분이 많은 오일·밤 제형은 양을 조절해 주세요." }],
  },
  {
    id: "oily_trouble",
    group: "oil",
    label: "지성 피부",
    when: { type: "oilAndConcern", oil: "oily", concern: "trouble" },
    items: [
      {
        ingredient: "salicylicAcid",
        reason: "\"여드름성 피부 완화\" 기능성 클렌저의 주성분이에요",
        level: "verified",
        evidence: "salicylicAcid",
      },
    ],
    cautions: [],
  },
  {
    id: "combination",
    group: "oil",
    label: "복합성 피부",
    when: { type: "oil", value: "combination" },
    items: [
      { ingredient: "niacinamide", reason: "T존 피지 관리에 도움을 줄 수 있어요", level: "verified", evidence: "niacinamide" },
    ],
    cautions: [{ text: "부위별로 바르는 양을 다르게 해 주세요." }],
  },
  {
    id: "low_oil",
    group: "oil",
    label: "유분이 적은 피부",
    when: { type: "oil", value: "low_oil" },
    items: [
      { ingredient: "ceramideNP", reason: "수분 유지·장벽에 도움을 줄 수 있어요", level: "verified", evidence: "ceramideNP" },
      // 단독 성분 연구를 찾지 못해 노출하지 않음 (2026-11-26 리서치)
      { ingredient: "squalane", reason: "유분 보충에 도움을 줄 수 있어요", level: "unchecked" },
      { ingredient: "sheaButter", reason: "유분 보충에 도움을 줄 수 있어요", level: "unchecked" },
    ],
    cautions: [{ text: "에탄올이 많은 제품은 바른 뒤 건조감이 없는지 확인해 주세요." }],
  },
  {
    id: "moisture_lacking",
    group: "moisture",
    label: "수분이 부족한 피부",
    when: { type: "moisture", value: "lacking" },
    items: [
      { ingredient: "glycerin", reason: "수분 유지에 도움을 줄 수 있어요", level: "verified", evidence: "glycerin" },
      { ingredient: "panthenol", reason: "보습·장벽에 도움을 줄 수 있어요", level: "verified", evidence: "panthenol" },
      {
        ingredient: "sodiumHyaluronate",
        reason: "보습에 도움을 줄 수 있다는 연구가 있어요",
        level: "limited",
        evidence: "sodiumHyaluronate",
        levelNote: "비교군이 없고 제조사가 지원한 연구라 근거가 약해요.",
      },
    ],
    cautions: [
      { text: "냉난방이 켜진 곳에서는 수시로 덧발라 주세요." },
      { text: "잦은 각질 제거는 줄여 주세요." },
    ],
  },
  {
    id: "sensitive",
    group: "sensitivity",
    label: "예민한 피부",
    when: { type: "sensitivity", values: ["sensitive", "slightly_sensitive"] },
    items: [
      {
        ingredient: "panthenol",
        reason: "예민한 피부의 붉은기·장벽에 도움을 줄 수 있다는 연구가 있어요",
        level: "limited",
        evidence: "sensitive2025",
      },
      {
        ingredient: "ceramideNP",
        reason: "예민한 피부의 붉은기·장벽에 도움을 줄 수 있다는 연구가 있어요",
        level: "limited",
        evidence: "sensitive2025",
      },
      {
        ingredient: "centella",
        reason: "예민한 피부의 붉은기·장벽에 도움을 줄 수 있다는 연구가 있어요",
        level: "limited",
        evidence: "sensitive2025",
      },
    ],
    cautions: [
      {
        text: "향료·에탄올이 많은 제품, 고농도 AHA·BHA·레티놀은 팔 안쪽에 먼저 테스트한 뒤 저농도부터 써 보세요.",
      },
    ],
  },
  {
    id: "resilient",
    group: "sensitivity",
    label: "튼튼한 피부",
    when: { type: "sensitivity", values: ["resilient"] },
    items: [],
    cautions: [{ text: "산·레티놀 성분은 자외선 차단제와 함께 써 주세요." }],
  },
  {
    id: "shaving",
    group: "shaving",
    label: "면도 후 피부",
    when: { type: "shaving" },
    items: [
      {
        ingredient: "panthenol",
        reason: "자극받은 피부의 장벽 회복에 도움을 줄 수 있다는 연구가 있어요",
        level: "limited",
        evidence: "panthenol",
        levelNote: "면도가 아닌 실험적 자극 연구라 면도에 그대로 적용하기엔 한계가 있어요.",
      },
      // 보습·자극 완화 근거가 부족하다는 리뷰가 있어 노출하지 않음 (2026-11-26 리서치)
      { ingredient: "allantoin", reason: "면도 후 자극 관리에 도움을 줄 수 있어요", level: "unchecked" },
    ],
    cautions: [
      {
        text: "면도 직후에는 AHA·BHA·레티놀 제품과 향이 강한 애프터셰이브를 피해 주세요.",
        evidence: "shaving",
      },
    ],
  },
  {
    id: "concern_dullness",
    group: "concern:dullness",
    label: "칙칙함·잡티 고민",
    when: { type: "concern", value: "dullness" },
    items: [
      { ingredient: "niacinamide", reason: "식약처 미백 기능성 고시 성분이에요", level: "verified", evidence: "niacinamide" },
      { ingredient: "arbutin", reason: "식약처 미백 기능성 고시 성분이에요", level: "verified", evidence: "whitening" },
      { ingredient: "ascorbylGlucoside", reason: "식약처 미백 기능성 고시 성분이에요", level: "verified", evidence: "whitening" },
    ],
    cautions: [{ text: "자외선 차단이 먼저예요. 낮에는 자외선 차단제를 꼭 발라 주세요." }],
  },
  {
    id: "concern_wrinkle",
    group: "concern:wrinkle",
    label: "잔주름·탄력 고민",
    when: { type: "concern", value: "wrinkle" },
    items: [
      { ingredient: "adenosine", reason: "식약처 주름개선 기능성 고시 성분이에요", level: "verified", evidence: "wrinkle" },
      { ingredient: "retinol", reason: "식약처 주름개선 기능성 고시 성분이에요", level: "verified", evidence: "wrinkle" },
    ],
    cautions: [{ text: "레티놀은 저녁에 바르고, 낮에는 자외선 차단제와 함께 써 주세요." }],
  },
  {
    id: "concern_dryness",
    group: "concern:dryness",
    label: "건조·각질 고민",
    when: { type: "concern", value: "dryness" },
    items: [
      { ingredient: "glycerin", reason: "수분 유지에 도움을 줄 수 있어요", level: "verified", evidence: "glycerin" },
      { ingredient: "ceramideNP", reason: "수분 유지·장벽에 도움을 줄 수 있어요", level: "verified", evidence: "ceramideNP" },
    ],
    cautions: [
      {
        text: "각질 제거 산(AHA)은 피부가 튼튼할 때만 쓰고, 자외선 민감도를 높일 수 있어 자외선 차단제를 꼭 함께 써 주세요.",
        evidence: "aha",
      },
    ],
  },
  {
    id: "concern_trouble",
    group: "concern:trouble",
    label: "트러블·모공 고민",
    when: { type: "concern", value: "trouble" },
    items: [
      { ingredient: "niacinamide", reason: "피지 관리에 도움을 줄 수 있어요", level: "verified", evidence: "niacinamide" },
      {
        ingredient: "salicylicAcid",
        reason: "\"여드름성 피부 완화\" 기능성 클렌저의 주성분이에요",
        level: "verified",
        evidence: "salicylicAcid",
      },
    ],
    cautions: [{ text: "각질 제거 제품을 여러 개 겹쳐 쓰지 않는 게 좋아요." }],
  },
];
