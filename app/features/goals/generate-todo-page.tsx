import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { data } from "react-router";

import type { Route } from "./+types/generate-todo-page";
import { makeSSRClient } from "~/supa-client";
import type { Database } from "~/supa-client";
import { getLoggedInUserId } from "../users/queries";

import { getGoalById, getProfileByUserId } from "./queries";
import { countWeeklyTodosForThisWeek, createTodoistByAI } from "./mutations";

// ✅ 주간 제한(Goal 기준) - 메시지용
const MAX_AI_GOALS_PER_WEEK = 3;
// ✅ 서버 방어용(weekly_todos row 기준)
const MAX_WEEKLY_TODOS_ROWS_PER_WEEK = 9;

// ✅ 1개 단위
const TodoSchema = z.object({ title: z.string().min(1) });

type TodoStyle = Database["public"]["Enums"]["todo_style"]; // driver|dreamer|developer|drifter
type MotivationType = Database["public"]["Enums"]["motivation_type"]; // reward|progress|meaning
type AiStyles = Database["public"]["Enums"]["ai_styles"]; // soft|strict|playful
type TaskCount = Database["public"]["Enums"]["task_count"]; // few|normal|many

function normalizeTodoStyle(input: unknown): TodoStyle | null {
  const v = String(input ?? "").trim();
  return v === "driver" || v === "dreamer" || v === "developer" || v === "drifter" ? (v as TodoStyle) : null;
}

function normalizeMotivationType(input: unknown): MotivationType | null {
  const v = String(input ?? "").trim();
  return v === "reward" || v === "progress" || v === "meaning" ? (v as MotivationType) : null;
}

function normalizeAiStyles(input: unknown): AiStyles | null {
  const v = String(input ?? "").trim();
  return v === "soft" || v === "strict" || v === "playful" ? (v as AiStyles) : null;
}

function normalizeTaskCount(input: unknown): TaskCount | null {
  const v = String(input ?? "").trim();
  return v === "few" || v === "normal" || v === "many" ? (v as TaskCount) : null;
}

function desiredTodoCount(taskCount: TaskCount | null) {
  // ✅ 너 UI/DB가 2~3개만 허용하는 구조라서 여기서 강제함
  // few: 2개, normal/many: 3개
  if (taskCount === "few") return { min: 2, max: 2 };
  return { min: 3, max: 3 };
}

function roleGuidelines(role: TodoStyle | null) {
  switch (role) {
    case "developer":
      return [
        "사용자 todo_style은 developer야.",
        "2~3개의 루틴은 아래 3종류가 균형 있게 섞이게 만들어줘:",
        "- Mapping(방향/계획): 매일 짧게 방향을 점검/선택",
        "- Making(실행): 매일 실제 행동을 하는 루틴",
        "- Meshing(미래준비): 매일 학습/관계/기술을 쌓는 루틴",
        "단, 항목 수가 2~3개뿐이라면 최소 2종류 이상 포함되게 해.",
      ].join("\n");

    case "driver":
      return [
        "사용자 todo_style은 driver야.",
        "driver는 실행/체크는 잘 하지만 미래준비(학습/관계/다음 단계)가 약해지기 쉬워.",
        "이번 주 루틴은 '미래준비' 비중을 높여서 만들어줘.",
        "예: 매일 20분 학습, 매일 1명에게 질문/피드백 요청 메시지 준비, 매일 다음 일정 1개 확인 등.",
        "단, 실제 진행이 되도록 '실행(Making)' 루틴도 최소 1개 포함해.",
      ].join("\n");

    case "drifter":
      return [
        "사용자 todo_style은 drifter야.",
        "drifter는 만들고 배우지만, 방향(우선순위/선택)이 흔들리기 쉬워.",
        "이번 주 루틴은 '방향/우선순위(Mapping)'을 보강해줘.",
        "예: 매일 오늘의 Top1 행동 1개 선택, 매일 성공 기준 1줄 확인, 매일 방해요인 1개 제거 행동 등.",
        "단, 계획만 하지 말고 '실행(Making)' 루틴도 최소 1개 포함해.",
      ].join("\n");

    case "dreamer":
      return [
        "사용자 todo_style은 dreamer야.",
        "dreamer는 계획/학습은 하지만 실행(완료)이 빠져 멈추기 쉬워.",
        "이번 주 루틴은 '실행/완료(Making)' 중심으로 만들어줘.",
        "예: 매일 25분 타이머로 실제 작업 1회, 매일 초안/프로토타입 조금이라도 만들기, 매일 결과물 1개 저장/업로드 등.",
        "단, 부담되면 '가장 작은 한 걸음'으로 쪼개서 제시해.",
      ].join("\n");

    default:
      return [
        "사용자 todo_style은 설정되어 있지 않거나 기타야.",
        "목표 달성에 가장 효과적인 2~3개의 '매일 루틴'을 만들어줘.",
        "너무 거창하지 않게, 매일 10~30분 안에 끝낼 수 있게 작게 쪼개.",
        "가능하면 1개는 '실행', 1개는 '정리/점검' 성격이 섞이게 해.",
      ].join("\n");
  }
}

function motivationGuidelines(m: MotivationType | null) {
  switch (m) {
    case "reward":
      return [
        "motivation_type은 reward야.",
        "루틴이 지루해지지 않게, 보상/게임화 요소가 자연스럽게 느껴지게 작성해줘.",
        "예: 완료 체크가 쉬운 단위, 작은 성취가 매일 보이게.",
      ].join("\n");
    case "progress":
      return [
        "motivation_type은 progress야.",
        "루틴이 '성장/지표'로 느껴지게 작성해줘.",
        "예: 누적/측정 가능한 단위(문제 1개, 문장 3개, 15분 등)로 명확히.",
      ].join("\n");
    case "meaning":
      return [
        "motivation_type은 meaning이야.",
        "루틴이 목표의 의미/정체성과 연결되게 작성해줘. 다만 길어지면 안 되고 한 문장으로 끝내.",
        "예: '내가 왜 이걸 하는지'가 떠오르는 표현을 짧게 섞되, 추상적 단어 남발은 금지.",
      ].join("\n");
    default:
      return "motivation_type은 설정되지 않았어. 일반적인 실행 중심으로 작성해줘.";
  }
}

function aiStyleGuidelines(s: AiStyles | null) {
  switch (s) {
    case "soft":
      return [
        "ai_styles는 soft야.",
        "문장은 부드럽고 부담 없이, 하지만 체크 기준은 또렷하게.",
        "금지: 감상문/장문/영어.",
      ].join("\n");
    case "strict":
      return [
        "ai_styles는 strict야.",
        "문장은 단호하고 군더더기 없이. 체크 기준을 아주 명확히.",
        "금지: 압박/비난/공격적 표현. 목표는 실행을 돕는 것.",
      ].join("\n");
    case "playful":
      return [
        "ai_styles는 playful야.",
        "가볍고 재미있는 톤을 살리되, 문장은 짧게. 체크 기준은 명확히.",
        "금지: 영어 단어/문장, 과한 농담, 길어짐.",
      ].join("\n");
    default:
      return "ai_styles는 설정되지 않았어. 기본 톤으로 간결하게.";
  }
}

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
    return data(
      { ok: false as const, error: "OPENAI_API_KEY 환경변수가 설정되지 않았어." },
      { status: 500, headers }
    );
  }

  // ✅ 목표 조회 (서버에서 다시 확인)
  const goal = await getGoalById(client, { userId, goalId });
  if (!goal) {
    return data({ ok: false as const, error: "goal을 찾을 수 없어." }, { status: 404, headers });
  }

  // ✅ Profile 조회(선호값 4종)
  let todoStyle: TodoStyle | null = null;
  let motivationType: MotivationType | null = null;
  let aiStyles: AiStyles | null = null;
  let taskCount: TaskCount | null = null;

  try {
    const profile = await getProfileByUserId(client, { userId });
    todoStyle = normalizeTodoStyle(profile?.todo_style);
    motivationType = normalizeMotivationType(profile?.motivation_type);
    aiStyles = normalizeAiStyles(profile?.ai_styles);
    taskCount = normalizeTaskCount(profile?.task_count);
  } catch {
    // ignore
  }

  const { min: minTodos, max: maxTodos } = desiredTodoCount(taskCount);

  // ✅ 동적 스키마(사용자 task_count에 따라 2 or 3 고정)
  const ResponseSchema = z.object({
    todoList: z.array(TodoSchema).min(minTodos).max(maxTodos),
  });

  // ✅ 서버 방어: 이번 주 생성량 제한
  try {
    const usedRows = await countWeeklyTodosForThisWeek(client, { userId });
    if (usedRows >= MAX_WEEKLY_TODOS_ROWS_PER_WEEK) {
      // rows(weekly_todos) 기준으로 막되, UX 메시지는 "주간 3회"로
      return data(
        {
          ok: false as const,
          error: `이번 주 AI 생성은 최대 ${MAX_AI_GOALS_PER_WEEK}번(총 ${MAX_WEEKLY_TODOS_ROWS_PER_WEEK}개 루틴)까지만 가능해!`,
        },
        { status: 400, headers }
      );
    }
  } catch (e: any) {
    return data({ ok: false as const, error: e?.message ?? "주간 생성 횟수 확인 실패" }, { status: 400, headers });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = [
      "사용자 선호(soft preference, 충돌 시 유용성/명확성 우선):",
      `- todo_style: ${todoStyle ?? "null"}`,
      `- motivation_type: ${motivationType ?? "null"}`,
      `- ai_styles: ${aiStyles ?? "null"}`,
      `- task_count: ${taskCount ?? "null"} (이번 요청은 ${minTodos}~${maxTodos}개로 고정)`,
      "",
      roleGuidelines(todoStyle),
      motivationGuidelines(motivationType),
      aiStyleGuidelines(aiStyles),
      "",
      `목표: ${String(goal.title ?? "").trim()}`,
      goal.why ? `이유: ${String(goal.why ?? "").trim()}` : "",
      goal.category ? `분야: ${String(goal.category ?? "").trim()}` : "",
      goal.target ? `성공 기준: ${String(goal.target ?? "").trim()}` : "",
      "",
      "공통 규칙(매우 중요):",
      "- 이 결과는 '7일 체크리스트(월~일)' 화면에 표시된다.",
      "- 각 항목은 '매일 반복 가능한 습관/루틴'이어야 한다. (1회성 프로젝트/계획/정리만 하는 항목 금지)",
      "- 하루 10~30분 안에 끝낼 수 있어야 한다.",
      "- 체크 기준이 명확해야 한다(했는지/안했는지).",
      "- 반드시 빈도/분량을 포함한다: '매일/하루' + '분/개/페이지/문장/문제' 중 하나",
      "- 추상적 표현 금지: 열심히/꾸준히/최선을 다해 같은 표현 금지",
      "",
      "생성 규칙:",
      `- 이번 요청은 루틴을 정확히 ${minTodos}~${maxTodos}개 생성`,
      "- 각 항목은 짧고 구체적인 한 문장",
      "- 동사로 시작(예: ~하기, ~읽기, ~정리하기)",
      "- 한국어만 사용(영어 단어/문장 금지)",
      "- JSON만 출력(설명/해설 금지)",
      "",
      '예시: "매일 15분 리액트 강의 1개 섹션 듣기"',
      '예시: "매일 문제 1개 풀이하고 오답 1개 정리하기"',
      '예시: "매일 10분 목표 한 줄 리뷰하고 오늘 할 일 1개 적기"',
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await openai.chat.completions.parse({
      model: "gpt-4.1-nano",
      temperature: 0.2,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content:
            "너는 생산성 코치야. 반드시 한국어로만 작성하고, JSON 스키마를 정확히 지켜. 영어 단어/문장 금지. 결과 JSON만 출력. 선호는 soft preference이며 충돌 시 유용성/명확성/실행성을 우선해.",
        },
        { role: "user", content: prompt },
      ],
      response_format: zodResponseFormat(ResponseSchema, "todolist"),
    });

    const parsed = completion.choices[0]?.message?.parsed;
    const titles = (parsed?.todoList ?? [])
      .map((t: any) => String(t.title ?? "").trim())
      .filter(Boolean);

    // ✅ 마지막 방어: 혹시라도 모델이 규칙 어기면 서버에서 컷
    const sliced = titles.slice(0, maxTodos);
    if (sliced.length < minTodos) {
      return data({ ok: false as const, error: "AI가 유효한 루틴을 충분히 생성하지 못했어." }, { status: 400, headers });
    }

    const inserted = await createTodoistByAI(client, {
      userId,
      titles: sliced,
      // goalId 저장 원하면 mutations 확장해서 함께 저장
    });

    return data(
      {
        ok: true as const,
        intent: "generateTodos" as const,
        goalId,
        prefs: { todoStyle, motivationType, aiStyles, taskCount },
        titles: sliced,
        createdCount: inserted.length,
      },
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