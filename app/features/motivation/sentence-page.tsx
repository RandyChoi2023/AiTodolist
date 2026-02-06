// sentence-page.tsx
import * as React from "react";

type Sentence = {
  id: string;
  ko: string;
  en?: string;
  tag?: "focus" | "courage" | "habit" | "confidence";
};

const SENTENCES: Sentence[] = [
  { id: "s1", ko: "오늘의 1%가, 1년 뒤의 너를 바꾼다.", en: "Today’s 1% changes who you are in a year.", tag: "habit" },
  { id: "s2", ko: "완벽하지 않아도 돼. 멈추지만 않으면 돼.", en: "You don’t have to be perfect. Just don’t stop.", tag: "courage" },
  { id: "s3", ko: "작게 시작해도 돼. 중요한 건 계속하는 거야.", en: "Start small. What matters is continuing.", tag: "habit" },
  { id: "s4", ko: "두려움은 방향을 알려줘. 그쪽이 성장의 입구야.", en: "Fear shows the direction—where growth begins.", tag: "courage" },
  { id: "s5", ko: "지금 하는 건 ‘증명’이 아니라 ‘쌓기’야.", en: "You’re not proving—you're building.", tag: "focus" },
  { id: "s6", ko: "오늘 한 줄이, 내일의 자신감을 만든다.", en: "One line today becomes confidence tomorrow.", tag: "confidence" },
  { id: "s7", ko: "포기하고 싶은 날이, 실력이 쌓이는 날이다.", en: "The day you want to quit is the day you grow.", tag: "habit" },
  { id: "s8", ko: "너는 이미 시작했고, 그게 제일 어렵다.", en: "You already started—the hardest part.", tag: "confidence" },
];

const LS_KEY = "aitodolist.sentences.likedIds.v1";

function pickRandomExcept(list: Sentence[], exceptId?: string) {
  if (list.length === 0) return undefined;
  if (list.length === 1) return list[0];
  let next = list[Math.floor(Math.random() * list.length)];
  while (exceptId && next.id === exceptId) {
    next = list[Math.floor(Math.random() * list.length)];
  }
  return next;
}

function tagLabel(tag?: Sentence["tag"]) {
  switch (tag) {
    case "focus":
      return "집중";
    case "courage":
      return "용기";
    case "habit":
      return "습관";
    case "confidence":
      return "자신감";
    default:
      return "오늘의 문장";
  }
}

function loadLikedIds(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveLikedIds(ids: string[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export default function SentencePage() {
  const [current, setCurrent] = React.useState<Sentence>(() => pickRandomExcept(SENTENCES)!);
  const [showEnglish, setShowEnglish] = React.useState(true);
  const [likedIds, setLikedIds] = React.useState<string[]>([]);
  const [toast, setToast] = React.useState<string | null>(null);
  const [animateKey, setAnimateKey] = React.useState(0);

  // localStorage load
  React.useEffect(() => {
    setLikedIds(loadLikedIds());
  }, []);

  // localStorage save
  React.useEffect(() => {
    saveLikedIds(likedIds);
  }, [likedIds]);

  // toast auto hide
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const liked = likedIds.includes(current.id);

  const rotate = React.useCallback(() => {
    setCurrent((prev) => pickRandomExcept(SENTENCES, prev.id)!);
    setAnimateKey((k) => k + 1);
  }, []);

  const toggleLike = React.useCallback(() => {
    setLikedIds((prev) => {
      if (prev.includes(current.id)) return prev.filter((id) => id !== current.id);
      return [current.id, ...prev].slice(0, 50);
    });
  }, [current.id]);

  const copyToClipboard = React.useCallback(async () => {
    const text = `${current.ko}${current.en ? `\n${current.en}` : ""}`;
    try {
      await navigator.clipboard.writeText(text);
      setToast("복사했어 ✨");
    } catch {
      setToast("복사에 실패했어 😢");
    }
  }, [current]);

  const clearAll = React.useCallback(() => {
    setLikedIds([]);
    setToast("저장 목록을 지웠어");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ✅ 페이지 전용 스타일 (라이브러리 없이 애니메이션/글로우) */}
      <style>{`
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(10px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .float-in { animation: floatIn 420ms ease-out both; }

        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .shimmer {
          background-size: 200% 200%;
          animation: shimmer 6s ease-in-out infinite;
        }
      `}</style>

      {/* 배경 글로우 */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl opacity-30 bg-gradient-to-r from-fuchsia-500 via-sky-400 to-emerald-400" />
        <div className="absolute bottom-[-140px] right-[-140px] h-96 w-96 rounded-full blur-3xl opacity-20 bg-gradient-to-r from-sky-400 via-violet-500 to-fuchsia-500" />
      </div>

      <div className="relative mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
        {/* 헤더 */}
        <header className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm">
              <span className="inline-flex h-2 w-2 rounded-full bg-foreground/70" />
              <span className="text-muted-foreground">#{tagLabel(current.tag)}</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">힘이 되는 한 문장</h1>
            <p className="text-sm text-muted-foreground">
              오늘의 문장을 마음에 붙여두자. 작게 시작해도 충분해.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setShowEnglish((v) => !v)}
              className="rounded-xl border bg-card px-3 py-2 text-sm hover:bg-muted"
            >
              {showEnglish ? "영문 숨기기" : "영문 보기"}
            </button>
            <button
              onClick={rotate}
              className="rounded-xl bg-foreground px-3 py-2 text-sm text-background hover:opacity-90"
            >
              새 문장
            </button>
          </div>
        </header>

        {/* 메인 카드 */}
        <section
          key={animateKey}
          className="float-in relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm"
        >
          {/* 카드 상단 얇은 그라디언트 라인 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-fuchsia-500 via-sky-400 to-emerald-400 shimmer opacity-80" />

          {/* 문장 */}
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Korean</div>
              <p className="text-2xl font-semibold leading-relaxed">{current.ko}</p>
            </div>

            {showEnglish && current.en && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">English</div>
                <p className="text-base leading-relaxed text-muted-foreground">{current.en}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={toggleLike}
                className={`rounded-xl border px-4 py-2 text-sm hover:bg-muted ${
                  liked ? "border-foreground" : ""
                }`}
              >
                {liked ? "❤️ 저장됨" : "🤍 저장하기"}
              </button>

              <button
                onClick={copyToClipboard}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
              >
                📋 복사
              </button>

              <button
                onClick={rotate}
                className="rounded-xl bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
              >
                🔄 새 문장
              </button>

              <div className="ml-auto hidden sm:block text-xs text-muted-foreground">
                Tip: 마음에 들면 ❤️ 저장해두자.
              </div>
            </div>
          </div>
        </section>

        {/* 모바일 버튼 */}
        <div className="sm:hidden flex items-center gap-2">
          <button
            onClick={() => setShowEnglish((v) => !v)}
            className="flex-1 rounded-xl border bg-card px-3 py-2 text-sm hover:bg-muted"
          >
            {showEnglish ? "영문 숨기기" : "영문 보기"}
          </button>
          <button
            onClick={rotate}
            className="flex-1 rounded-xl bg-foreground px-3 py-2 text-sm text-background hover:opacity-90"
          >
            새 문장
          </button>
        </div>

        {/* 저장 목록 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">내가 저장한 문장</h2>
            <button
              onClick={clearAll}
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              disabled={likedIds.length === 0}
            >
              모두 지우기
            </button>
          </div>

          {likedIds.length === 0 ? (
            <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
              아직 저장한 문장이 없어. 마음에 드는 문장을 ❤️ 저장해봐.
            </div>
          ) : (
            <div className="grid gap-3">
              {likedIds
                .map((id) => SENTENCES.find((s) => s.id === id))
                .filter(Boolean)
                .map((s) => (
                  <button
                    key={s!.id}
                    onClick={() => {
                      setCurrent(s!);
                      setAnimateKey((k) => k + 1);
                    }}
                    className="text-left rounded-2xl border bg-card p-4 hover:bg-muted"
                    title="클릭하면 이 문장을 크게 보여줘요"
                  >
                    <div className="mb-1 text-xs text-muted-foreground">#{tagLabel(s!.tag)}</div>
                    <div className="font-medium">{s!.ko}</div>
                    {s!.en && <div className="mt-1 text-sm text-muted-foreground">{s!.en}</div>}
                  </button>
                ))}
            </div>
          )}
        </section>

        <footer className="pt-4 text-center text-xs text-muted-foreground">
          “작게라도 오늘 한 번.” 그게 진짜 실력이야.
        </footer>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow">
          {toast}
        </div>
      )}
    </div>
  );
}
