// app/routes/subscribe-page.tsx
// ✅ Motivation( sentence-page.tsx )랑 같은 감성/레이아웃
// ✅ Free / Lite / Pro 3플랜
// ✅ 상단 공백 줄임: pt-16 + pb-10 (nav fixed h-16 기준)
// ✅ 결제는 placeholder (TODO 주석). 나중에 Stripe 연결만 붙이면 됨.

import * as React from "react";

type PlanId = "free" | "lite" | "pro";

type Plan = {
  id: PlanId;
  name: string;
  badge: string;
  price: string;
  period?: string;
  desc: string;
  highlights: string[];
  cta: string;
  note: string;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    badge: "기본",
    price: "₩0",
    period: "",
    desc: "일단 써보는 플랜. 기본 흐름을 익히기에 충분해.",
    highlights: ["목표 생성", "AI To-Do 미리보기", "제한된 AI 생성 횟수"],
    cta: "무료로 계속하기",
    note: "필요해지는 순간, Lite/Pro로 바로 올릴 수 있어.",
  },
  {
    id: "lite",
    name: "Lite",
    badge: "가볍게 시작",
    price: "₩2,900",
    period: "/ 월",
    desc: "부담 없이 AI To-Do를 꾸준히 써보는 플랜.",
    highlights: [
      "하루 1–2개 목표 AI 정리",
      "Easy 단계 중심",
      "목표별 To-Do 기본 관리",
      "언제든 업그레이드 가능",
    ],
    cta: "Lite로 시작하기",
    note: "가볍게 시작해도 충분해. 필요하면 Pro로 올리면 돼.",
  },
  {
    id: "pro",
    name: "Pro",
    badge: "AI가 끝까지 정리",
    price: "₩12,900",
    period: "/ 월",
    desc: "목표를 Easy → Normal → Hard로 끝까지 쪼개주는 플랜.",
    highlights: [
      "AI To-Do 전체 생성",
      "Easy / Normal / Hard 모두 사용",
      "수정·재생성 무제한",
      "목표별 자동 정리 & 필터링",
    ],
    cta: "Pro로 계속하기",
    note: "결제 후 바로 적용돼. 방금 하던 흐름에서 이어서 사용할 수 있어.",
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function SubscribePage() {
  const [selected, setSelected] = React.useState<PlanId>("free");
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const plan = React.useMemo(
    () => PLANS.find((p) => p.id === selected)!,
    [selected]
  );

  const onPrimary = React.useCallback((planId: PlanId) => {
    // TODO: 실제 결제/플랜 로직 연결
    // Free: 그냥 앱으로 이동(혹은 그대로 유지)
    // Lite/Pro: Stripe Checkout 등으로 이동
    if (planId === "free") {
      setToast("좋아. Free로 시작하자 🙂");
      // 예) window.location.href = "/goals";
      return;
    }
    setToast(planId === "lite" ? "Lite 결제를 준비 중이야…" : "Pro 결제를 준비 중이야…");
    // 예) window.location.href = `/api/billing/checkout?plan=${planId}`;
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ✅ 페이지 전용 스타일 (sentence-page.tsx 느낌 유지) */}
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

      {/* ✅ nav fixed(h-16) 보정: pt-16만 주고, 위 공백 줄임 */}
      <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-10 pb-10">
        {/* 헤더 */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm">
              <span className="inline-flex h-2 w-2 rounded-full bg-foreground/70" />
              <span className="text-muted-foreground">#구독</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">AI To-Do List 구독</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              할 일 정리는 AI가, 실행은 너가. <br className="hidden sm:block" />
              목표를 “오늘 할 수 있는 행동”으로 바꿔줄게.
            </p>
          </div>

          <div className="text-xs text-muted-foreground">
            언제든 해지 가능 · 숨겨진 비용 없음
          </div>
        </header>

        {/* 메인 카드 */}
        <section className="float-in relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm">
          {/* 카드 상단 얇은 그라디언트 라인 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-fuchsia-500 via-sky-400 to-emerald-400 shimmer opacity-80" />

          {/* 플랜 선택 탭 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {PLANS.map((p) => {
                const active = p.id === selected;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className={cx(
                      "rounded-xl border px-4 py-2 text-sm transition-colors hover:bg-muted",
                      active && "border-foreground bg-muted"
                    )}
                    aria-pressed={active}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{p.badge}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-muted-foreground">
              추천: <span className="text-foreground">Free로 시작</span> → 필요해지면 Lite/Pro
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* 왼쪽: 선택 플랜 요약 */}
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">선택한 플랜</div>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-semibold">{plan.name}</div>
                  <div className="text-muted-foreground pb-1">{plan.badge}</div>
                </div>
                <p className="text-sm text-muted-foreground">{plan.desc}</p>
              </div>

              <div className="rounded-2xl border bg-background/40 p-4">
                <div className="flex items-end gap-2">
                  <div className="text-4xl font-bold">{plan.price}</div>
                  {!!plan.period && (
                    <div className="text-muted-foreground pb-1">{plan.period}</div>
                  )}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {plan.highlights.map((h) => (
                    <div key={h} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-foreground/70" />
                      <p className="text-sm">{h}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                  {plan.note}
                </div>
              </div>
            </div>

            {/* 오른쪽: CTA */}
            <aside className="rounded-2xl border bg-background/40 p-5 space-y-3">
              <div className="text-sm font-medium">바로 시작하기</div>
              <p className="text-xs text-muted-foreground">
                {selected === "free"
                  ? "Free로 시작하고, 필요해지면 언제든 업그레이드하면 돼."
                  : "결제 후 바로 적용돼. 방금 하던 목표로 돌아가서 이어서 할 수 있어."}
              </p>

              <button
                onClick={() => onPrimary(selected)}
                className={cx(
                  "w-full rounded-xl px-4 py-3 text-sm hover:opacity-90",
                  selected === "free"
                    ? "bg-foreground text-background"
                    : "bg-foreground text-background"
                )}
              >
                {plan.cta}
              </button>

              <button
                onClick={() => setToast("좋아. 천천히 결정하자 🙂")}
                className="w-full rounded-xl border bg-card px-4 py-3 text-sm hover:bg-muted"
              >
                지금은 괜찮아
              </button>

              <div className="pt-2 text-xs text-muted-foreground">
                Tip: 처음엔 Free/Lite로 충분해. “필요해진 순간”에 올리면 돼.
              </div>
            </aside>
          </div>
        </section>

        {/* 비교 카드 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Free / Lite / Pro 비교</h2>

          <div className="grid gap-3 md:grid-cols-3">
            <CompareCard
              title="Free"
              subtitle="기본"
              items={["목표 생성", "AI 미리보기", "제한된 AI 생성"]}
              accent={selected === "free" ? "selected" : undefined}
            />
            <CompareCard
              title="Lite"
              subtitle="가볍게 시작"
              items={["하루 1–2개 목표 AI 정리", "Easy 단계 중심", "기본 To-Do 관리"]}
              accent={selected === "lite" ? "selected" : "lite"}
            />
            <CompareCard
              title="Pro"
              subtitle="AI가 끝까지"
              items={["전체 AI 생성", "Easy/Normal/Hard", "수정·재생성 무제한"]}
              accent={selected === "pro" ? "selected" : "pro"}
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">자주 묻는 질문</h2>

          <div className="grid gap-3">
            <Faq q="Free로도 쓸만해?" a="응. 흐름 익히고 습관 붙이기엔 충분해. 다만 AI는 제한이 있어." />
            <Faq q="Lite는 누가 쓰면 좋아?" a="매일 목표 1–2개 정도 AI로 정리하면서 가볍게 루틴 만들고 싶은 사람." />
            <Faq q="Pro는 뭐가 달라?" a="AI가 목표를 끝까지 쪼개줘. Easy/Normal/Hard로 실행 플랜이 완성돼." />
            <Faq q="구독하면 바로 적용돼?" a="응. 결제 완료 즉시 기능이 활성화돼." />
            <Faq q="나중에 해지할 수 있어?" a="언제든 가능해. 다음 결제일부터는 청구되지 않아." />
            <Faq q="결제 후 어디로 가?" a="원래 하던 화면으로 돌아가서, AI가 이어서 To-Do를 만들어줘." />
          </div>
        </section>

        <footer className="pt-4 text-center text-xs text-muted-foreground">
          “작게라도 오늘 한 번.” 구독은 그걸 더 쉽게 만들어주는 장치야.
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

function CompareCard({
  title,
  subtitle,
  items,
  accent,
}: {
  title: string;
  subtitle: string;
  items: string[];
  accent?: "selected" | "lite" | "pro";
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border bg-card p-5",
        accent === "selected" && "border-foreground bg-muted/50",
        accent === "lite" && "border-foreground/30",
        accent === "pro" && "border-foreground"
      )}
    >
      <div className="text-xs text-muted-foreground">{subtitle}</div>
      <div className="mt-1 text-base font-semibold">{title}</div>

      <div className="mt-3 space-y-2">
        {items.map((it) => (
          <div key={it} className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-foreground/70" />
            <div className="text-sm text-muted-foreground">{it}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="font-medium">{q}</div>
      <div className="mt-2 text-sm text-muted-foreground">{a}</div>
    </div>
  );
}
