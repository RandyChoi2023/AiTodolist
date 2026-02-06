import type { Route } from "./+types/home";
import { useEffect } from "react";
import { AuroraText } from "~/common/components/ui/aurora-text";
import { data } from "react-router";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home | AI Todo List" },
    {
      name: "description",
      content: "Turn goals into habits. Habits into mastery.",
    },
  ];
}

export const loader = () => {
  const headers = new Headers();
  headers.append("Set-Cookie", "test-111");
 
  return data({showWelcome: false},{headers}
  );
};

export default function Home({ loaderData }: Route.ComponentProps) {
  const { showWelcome } = loaderData;

  useEffect(() => {
    if (showWelcome) {
      alert("Good!");
    }
  }, [showWelcome]);

  return (
    <div className="px-20 py-24">
      {/* HERO */}
      <section className="max-w-4xl space-y-6">
        <h1 className="text-6xl font-bold leading-tight tracking-tight">
          Turn goals into{" "}
          <AuroraText>habits</AuroraText>
          <br />
          Habits into{" "}
          <AuroraText>ability</AuroraText>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl">
          This AI To-do List doesn’t just tell you what to do.  
          It builds a <span className="font-medium text-foreground">habit path</span> —
          from <span className="font-medium">easy</span> to{" "}
          <span className="font-medium">hard</span> —
          so your actions become real skills.
        </p>
      </section>

      {/* PRINCIPLES */}
      <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        <PrincipleCard
          title="Consistency"
          subtitle="Show up every day"
          description="Start small. Never stop.  
          Easy mode exists to make sure you always come back."
        />

        <PrincipleCard
          title="Automation"
          subtitle="Make it a habit"
          description="When actions repeat, they stop requiring motivation.  
          Normal mode turns effort into routine."
        />

        <PrincipleCard
          title="Mastery"
          subtitle="Grow your ability"
          description="Hard mode challenges you with real outcomes.  
          This is where habits become skills."
        />
      </section>
    </div>
  );
}

function PrincipleCard({
  title,
  subtitle,
  description,
}: {
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-background p-6 shadow-sm transition hover:shadow-md">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <p className="mt-4 text-sm leading-relaxed whitespace-pre-line">
        {description}
      </p>
    </div>
  );
}
