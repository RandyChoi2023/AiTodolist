import * as React from "react";
import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";

export const meta = () => [{ title: "Welcome | AI To-Do List" }];

// ── Typewriter hook (✅ fixed cleanup) ───────────────────────────
function useTypewriter(text: string, speed = 38, startDelay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);

    let i = 0;
    let iv: number | null = null;

    const t = window.setTimeout(() => {
      iv = window.setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          if (iv) window.clearInterval(iv);
          iv = null;
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      window.clearTimeout(t);
      if (iv) window.clearInterval(iv);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

// ── Floating pixel particle ──────────────────────────────────────
function PixelParticle({
  delay = 0,
  x = 50,
  size = 4,
  color = "#a78bfa",
}: {
  delay?: number;
  x?: number;
  size?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        bottom: "-10px",
        width: size,
        height: size,
        backgroundColor: color,
        animationDelay: `${delay}s`,
        animationDuration: `${3 + Math.random() * 4}s`,
      }}
      className="animate-float-pixel opacity-0"
    />
  );
}

// ── Scanline overlay ─────────────────────────────────────────────
function Scanlines() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)",
      }}
    />
  );
}

// ── XP Bar ──────────────────────────────────────────────────────
function XpBar({
  value,
  max,
  label,
  color,
}: {
  value: number;
  max: number;
  label: string;
  color: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div
        className="flex justify-between text-[10px] font-mono"
        style={{ color }}
      >
        <span>{label}</span>
        <span>
          {value}/{max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-sm bg-white/10">
        <div
          className="h-full rounded-sm transition-all duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

// ── Glitch text ──────────────────────────────────────────────────
function GlitchText({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="glitch-base">{children}</span>
      <span className="glitch-layer1" aria-hidden>
        {children}
      </span>
      <span className="glitch-layer2" aria-hidden>
        {children}
      </span>
    </span>
  );
}

// ── Achievement popup ────────────────────────────────────────────
function Achievement({ show }: { show: boolean }) {
  return (
    <div
      className={`fixed right-6 top-6 z-50 transition-all duration-500 ${
        show ? "translate-x-0 opacity-100" : "translate-x-32 opacity-0"
      }`}
    >
      <div
        className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-mono backdrop-blur-md"
        style={{
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245,158,11,0.12)",
          boxShadow: "0 0 20px rgba(245,158,11,0.25)",
          color: "#fcd34d",
        }}
      >
        <span className="text-xl">🏆</span>
        <div>
          <div className="text-[10px] text-yellow-600">ACHIEVEMENT UNLOCKED</div>
          <div>Welcome Screen 발견!</div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function WelcomePage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const name = sp.get("name") || "You";

  const [phase, setPhase] = useState(0); // 0=boot, 1=main, 2=ready
  const [showAchievement, setShowAchievement] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [clicked, setClicked] = useState(false);

  const [particles] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 6,
      size: Math.floor(Math.random() * 4) + 2,
      color: ["#a78bfa", "#818cf8", "#f472b6", "#34d399", "#60a5fa"][
        Math.floor(Math.random() * 5)
      ],
    }))
  );

  const bootText = useTypewriter(
    "> SYSTEM BOOT... OK\n> LOADING USER DATA... OK\n> AI MODULE ACTIVATED ✓",
    22,
    0
  );
  const nameText = useTypewriter(`> WELCOME, ${name.toUpperCase()}`, 45, 1800);

  // ✅ phase timeline
  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase(1), 2400);
    const t2 = window.setTimeout(() => setPhase(2), 3200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // ✅ achievement only once (localStorage)
  useEffect(() => {
    const KEY = "ai-todo:welcome-egg-seen";
    const seen = window.localStorage.getItem(KEY) === "1";

    if (!seen) {
      const t3 = window.setTimeout(() => setShowAchievement(true), 4000);
      const t4 = window.setTimeout(() => setShowAchievement(false), 7000);
      window.localStorage.setItem(KEY, "1");

      return () => {
        window.clearTimeout(t3);
        window.clearTimeout(t4);
      };
    }
  }, []);

  const steps = [
    {
      icon: "⚔️",
      title: "Role 선택",
      sub: "CLASS SELECT",
      desc: "AI가 사용자의 스타일에 맞게 조정됩니다.",
      color: "#f472b6",
      xp: 340,
      maxXp: 500,
    },
    {
      icon: "🔥",
      title: "Motivation 설정",
      sub: "BUFF SELECT",
      desc: "지속 실행을 도와주는 동기를 선택해 보세요.",
      color: "#fb923c",
      xp: 210,
      maxXp: 500,
    },
    {
      icon: "✅",
      title: "오늘 1개 완료",
      sub: "FIRST QUEST",
      desc: "첫 클리어가 연속 달성의 시작입니다.",
      color: "#34d399",
      xp: 50,
      maxXp: 500,
    },
  ];

  // ✅ Press any key to continue (phase 2 이후에만)
  useEffect(() => {
    if (phase < 2) return;

    const onKeyDown = () => {
      navigate("/my/settings?onboarding=1");
    };

    window.addEventListener("keydown", onKeyDown, { once: true });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, navigate]);

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@700;900&display=swap');

        .font-mono-tech { font-family: 'Share Tech Mono', monospace; }
        .font-display { font-family: 'Orbitron', sans-serif; }

        @keyframes float-pixel {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }
        .animate-float-pixel { animation: float-pixel linear infinite; }

        @keyframes crt-flicker {
          0%,100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.85; }
          94% { opacity: 1; }
        }
        .crt-flicker { animation: crt-flicker 6s infinite; }

        @keyframes blink-cursor {
          0%,100% { opacity: 1; }
          50%     { opacity: 0; }
        }
        .cursor-blink { animation: blink-cursor 0.8s step-end infinite; }

        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 12px currentColor; }
          50%      { box-shadow: 0 0 28px currentColor, 0 0 50px currentColor; }
        }
        .glow-pulse { animation: pulse-glow 2.4s ease-in-out infinite; }

        @keyframes slide-up {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .slide-up { animation: slide-up 0.6s ease both; }

        @keyframes scan-line {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .scan-sweep {
          animation: scan-line 3s linear infinite;
          background: linear-gradient(transparent 0%, rgba(167,139,250,0.06) 50%, transparent 100%);
          height: 120px; width: 100%; position: absolute; left: 0; pointer-events: none;
        }

        /* Glitch effect */
        .glitch-base  { display: block; }
        .glitch-layer1, .glitch-layer2 {
          position: absolute; inset: 0; display: block;
        }
        .glitch-layer1 {
          color: #f472b6; clip-path: polygon(0 20%,100% 20%,100% 40%,0 40%);
          animation: glitch1 4s infinite; transform: translateX(-2px);
        }
        .glitch-layer2 {
          color: #60a5fa; clip-path: polygon(0 60%,100% 60%,100% 80%,0 80%);
          animation: glitch2 4s infinite; transform: translateX(2px);
        }
        @keyframes glitch1 {
          0%,90%,100% { opacity:0; transform:translateX(-2px); }
          92% { opacity:0.8; transform:translateX(-4px) skewX(-4deg); }
          94% { opacity:0; }
        }
        @keyframes glitch2 {
          0%,88%,100% { opacity:0; transform:translateX(2px); }
          90% { opacity:0.8; transform:translateX(5px) skewX(3deg); }
          92% { opacity:0; }
        }

        .step-card {
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: default;
        }
        .step-card:hover {
          transform: translateY(-4px) scale(1.02);
        }

        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-4px) rotate(-1deg); }
          40%     { transform: translateX(4px) rotate(1deg); }
          60%     { transform: translateX(-3px); }
          80%     { transform: translateX(3px); }
        }
        .shake { animation: shake 0.4s ease; }
      `}</style>

      <Achievement show={showAchievement} />

      <div className="crt-flicker relative min-h-screen overflow-hidden bg-[#04050f] font-mono-tech">
        <Scanlines />

        {/* Moving scan sweep */}
        <div className="scan-sweep" style={{ top: 0 }} />

        {/* Pixel particles */}
        {particles.map((p) => (
          <PixelParticle
            key={p.id}
            x={p.x}
            delay={p.delay}
            size={p.size}
            color={p.color}
          />
        ))}

        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(167,139,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Corner decorations */}
        {["top-4 left-4", "top-4 right-4", "bottom-4 left-4", "bottom-4 right-4"].map(
          (pos, i) => (
            <div key={i} className={`absolute ${pos} opacity-30`}>
              <div
                className="h-6 w-6 border-2 border-violet-400"
                style={{
                  borderRight: i % 2 === 0 ? "none" : undefined,
                  borderLeft: i % 2 !== 0 ? "none" : undefined,
                  borderBottom: i < 2 ? "none" : undefined,
                  borderTop: i >= 2 ? "none" : undefined,
                }}
              />
            </div>
          )
        )}

        {/* Boot terminal overlay */}
        {phase < 1 && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#04050f]">
            <div className="w-full max-w-md px-8">
              <div
                className="whitespace-pre text-[13px] leading-6 text-green-400"
                style={{ fontFamily: "'Share Tech Mono', monospace" }}
              >
                {bootText.displayed}
                <span className="cursor-blink">█</span>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div
          className={`relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16 transition-opacity duration-700 ${
            phase >= 1 ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* ── HUD top bar ── */}
          <div
            className="mb-8 w-full max-w-2xl slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div
              className="flex items-center justify-between rounded-sm border px-4 py-2 text-[10px]"
              style={{
                borderColor: "rgba(167,139,250,0.3)",
                backgroundColor: "rgba(167,139,250,0.06)",
                color: "#a78bfa",
              }}
            >
              <span>◈ AI_TODO v2.0.1</span>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-green-400"
                  style={{ boxShadow: "0 0 6px #4ade80" }}
                />
                ONLINE
              </span>
              <span>EGG_FOUND: TRUE</span>
            </div>
          </div>

          {/* ── Name terminal ── */}
          <div
            className="mb-6 w-full max-w-2xl slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div
              className="rounded-sm border px-5 py-3 text-[13px] text-green-400"
              style={{
                borderColor: "rgba(74,222,128,0.2)",
                backgroundColor: "rgba(74,222,128,0.04)",
              }}
            >
              {nameText.displayed || "\u00a0"}
              {!nameText.done && <span className="cursor-blink">█</span>}
            </div>
          </div>

          {/* ── Hero title ── */}
          <div
            className="mb-4 text-center slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <GlitchText className="font-display text-5xl font-black tracking-widest text-white sm:text-7xl">
              WELCOME
            </GlitchText>
            <div
              className="mt-1 font-display text-lg tracking-[0.4em] text-violet-400 sm:text-2xl"
              style={{ textShadow: "0 0 20px rgba(167,139,250,0.6)" }}
            >
              PLAYER
            </div>
          </div>

          {/* ── Sub text ── */}
          <p
            className="mb-10 text-center text-sm leading-relaxed text-white/50 slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            완벽하실 필요 없습니다. 오늘 퀘스트{" "}
            <span
              className="text-yellow-400"
              style={{ textShadow: "0 0 8px rgba(250,204,21,0.6)" }}
            >
              1개
            </span>
            만 클리어하시면 됩니다.
          </p>

          {/* ── Step cards ── */}
          <div
            className="mb-10 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3 slide-up"
            style={{ animationDelay: "0.5s" }}
          >
            {steps.map((s, i) => (
              <div
                key={i}
                className="step-card rounded-sm border p-4"
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
                style={{
                  borderColor:
                    hoveredStep === i ? s.color : "rgba(255,255,255,0.08)",
                  backgroundColor:
                    hoveredStep === i ? `${s.color}10` : "rgba(255,255,255,0.03)",
                  boxShadow:
                    hoveredStep === i ? `0 0 20px ${s.color}30` : "none",
                  transition: "all 0.25s",
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="text-[10px] tracking-widest"
                    style={{ color: s.color }}
                  >
                    STAGE {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-lg">{s.icon}</span>
                </div>
                <div className="mb-0.5 text-[10px] tracking-wider text-white/30">
                  {s.sub}
                </div>
                <div className="mb-2 text-sm font-bold text-white">{s.title}</div>
                <div className="mb-3 text-[11px] leading-relaxed text-white/50">
                  {s.desc}
                </div>

                <XpBar
                  value={hoveredStep === i ? s.xp : 0}
                  max={s.maxXp}
                  label="XP"
                  color={s.color}
                />
              </div>
            ))}
          </div>

          {/* ── CTA buttons ── */}
          <div
            className={`flex flex-col items-center gap-3 sm:flex-row slide-up ${
              clicked ? "shake" : ""
            }`}
            style={{ animationDelay: "0.6s" }}
          >
            <Link to="/my/settings?onboarding=1">
              <button
                onMouseDown={() => setClicked(true)}
                onMouseUp={() => setClicked(false)}
                className="group relative overflow-hidden rounded-sm border px-8 py-3 text-sm font-bold tracking-widest text-white transition-all duration-200 glow-pulse"
                style={{
                  backgroundColor: "#7c3aed",
                  borderColor: "#a78bfa",
                  boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                  fontFamily: "'Orbitron', sans-serif",
                  color: "#a78bfa",
                }}
              >
                <span className="relative z-10">▶ START GAME</span>
                <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-[100%]" />
              </button>
            </Link>

            <Link to="/my/dashboard">
              <button
                className="rounded-sm border px-8 py-3 text-sm tracking-widest transition-all duration-200 hover:bg-white/5"
                style={{
                  borderColor: "rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "'Share Tech Mono', monospace",
                }}
              >
                CONTINUE →
              </button>
            </Link>
          </div>

          {/* ── Bottom Easter egg note ── */}
          <div
            className="mt-12 text-center slide-up"
            style={{ animationDelay: "0.8s" }}
          >
            <div className="text-[10px] tracking-widest text-white/20">
              🥚 &nbsp;HIDDEN SCREEN FOUND &nbsp;·&nbsp; SCORE +500 &nbsp;🥚
            </div>

            <div className="mt-1 text-[9px] tracking-widest text-white/10">
              {phase >= 2
                ? "[ 아무 키나 누르시면 설정 페이지로 이동합니다 ]"
                : "[ LOADING... ]"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}