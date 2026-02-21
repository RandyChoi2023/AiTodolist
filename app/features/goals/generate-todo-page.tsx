import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { data } from "react-router";

import type { Route } from "./+types/generate-todo-page";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "../users/queries";

import { getGoalById } from "./queries";
import { countWeeklyTodosForThisWeek, createTodoistByAI } from "./mutations";

// ✅ 2~3개만 허용
const TodoSchema = z.object({ title: z.string().min(1) });
const ResponseSchema = z.object({ todoList: z.array(TodoSchema).min(2).max(3) });

// ✅ 주간 제한(Goal 기준) - 메시지용
const MAX_AI_GOALS_PER_WEEK = 3;
// ✅ 서버 방어용(weekly_todos row 기준)
const MAX_WEEKLY_TODOS_ROWS_PER_WEEK = 9;

export const action = async ({ request }: Route.ActionArgs) => {
  console.log("[generate-todo] action hit:", request.url);

  const { client, headers } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);

  const formData = await request.formData();
  const goalId = String(formData.get("goalId") ?? "").trim();

  if (!goalId) {
    return data({ ok: false as const, error: "goalId가 필요해." }, { status: 400, headers });
  }

  // ✅ OpenAI key 체크
  if (!process.env.OPENAI_API_KEY) {
    return data({ ok: false as const, error: "OPENAI_API_KEY 환경변수가 설정되지 않았어." }, { status: 500, headers });
  }

  // ✅ 목표 조회 (서버에서 다시 확인)
  const goal = await getGoalById(client, { userId, goalId });
  if (!goal) {
    return data({ ok: false as const, error: "goal을 찾을 수 없어." }, { status: 404, headers });
  }

  // ✅ 서버 방어: 이번 주 생성량 제한
  try {
    const usedRows = await countWeeklyTodosForThisWeek(client, { userId });
    if (usedRows >= MAX_WEEKLY_TODOS_ROWS_PER_WEEK) {
      return data(
        { ok: false as const, error: `이번 주 AI 생성은 최대 ${MAX_AI_GOALS_PER_WEEK}번까지만 가능해!` },
        { status: 400, headers }
      );
    }
  } catch (e: any) {
    return data({ ok: false as const, error: e?.message ?? "주간 생성 횟수 확인 실패" }, { status: 400, headers });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.parse({
      model: "gpt-4.1-nano",
      temperature: 0.2,
      max_tokens: 140,
      messages: [
        {
          role: "system",
          content: "너는 생산성 코치야. 반드시 한국어로만 작성하고, JSON 스키마를 정확히 지켜. 영어 단어/문장 금지.",
        },
        {
          role: "user",
          content: [
            `목표: ${String(goal.title ?? "").trim()}`,
            goal.why ? `이유: ${String(goal.why ?? "").trim()}` : "",
            goal.category ? `분야: ${String(goal.category ?? "").trim()}` : "",
            goal.target ? `성공 기준: ${String(goal.target ?? "").trim()}` : "",
            "",
            "규칙:",
            "- 이번 주에 할 수 있는 할 일을 정확히 2~3개 생성",
            "- 각 항목은 짧고 구체적인 한 문장",
            "- 동사로 시작(예: ~하기, ~읽기, ~정리하기)",
            "- 한국어만 사용",
            "- JSON만 출력",
            "",
            '예시: "영어 문장 10개 소리 내어 읽기"',
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      response_format: zodResponseFormat(ResponseSchema, "todolist"),
    });

    const parsed = completion.choices[0]?.message?.parsed;
    const titles = (parsed?.todoList ?? [])
      .map((t: any) => String(t.title ?? "").trim())
      .filter(Boolean);

    // // ✅ 영어 섞이면 저장 안 함
    // const hasEnglish = titles.some((t: string) => /[A-Za-z]/.test(t));
    // if (hasEnglish) {
    //   return data({ ok: false as const, error: "영어가 섞여 나왔어. 다시 눌러줘!" }, { status: 400, headers });
    // }

    const inserted = await createTodoistByAI(client, { userId, titles /* goalId 저장 원하면 확장 */ });

    return data(
      { ok: true as const, intent: "generateTodos" as const, goalId, titles, createdCount: inserted.length },
      { headers }
    );
  } catch (e: any) {
    console.error("[generate-todo] error:", e);
    return data({ ok: false as const, error: e?.message ?? "AI 생성 실패" }, { status: 400, headers });
  }
};

// ✅ UI 필요 없음 (API endpoint 역할)
export default function GenerateTodoPage() {
  return null;
}