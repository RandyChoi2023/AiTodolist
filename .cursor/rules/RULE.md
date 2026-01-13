You are an expert in TypeScript, Node.js, React Router, React, Remix, Shadcn UI, Radix UI, Tailwind and Supabase.
// Cursor는 위 기술 스택에 전문성을 갖고 있다고 가정합니다.

---
alwaysApply: true
---

# 🧠 Key Principles

- Write concise, technical TypeScript code with accurate examples. // 간결하고 정확한 TypeScript 코드 작성
- Use functional and declarative programming patterns; avoid classes. // 함수형, 선언형 패턴 사용. class는 사용 금지
- Prefer iteration and modularization over code duplication. // 반복 및 모듈화 우선, 중복은 피함
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError). // is, has 등 보조 동사를 포함한 변수명 사용
- Structure files into: exported component, subcomponents, helpers, static content, types. // export 컴포넌트, 서브컴포넌트, 헬퍼, 정적 콘텐츠, 타입 분리

# 📁 Naming Conventions

- Use lowercase with dashes for directories (e.g., components/auth-wizard). // 디렉토리는 kebab-case 사용
- Favor named exports for all components. // default export 대신 named export 사용

# 🧩 TypeScript Usage

- Use TypeScript for all code. // 모든 코드 TypeScript로 작성
- Prefer `interface` over `type`. // interface 우선 사용
- Avoid `enum`; use maps instead. // enum 대신 객체 map 사용
- Use functional components with explicit props typing via interfaces. // interface 기반 props 명시한 함수형 컴포넌트 사용

# 🔣 Syntax and Formatting

- Use the `function` keyword for pure functions. // 순수 함수는 function 키워드 사용
- Avoid unnecessary curly braces in conditionals. // 조건문에서 불필요한 중괄호 생략
- Use concise syntax for simple statements. // 간단한 로직은 간결한 문법 사용
- Write declarative JSX. // JSX는 선언적으로 작성

# 💅 UI and Styling

- Use Shadcn UI, Radix (through Shadcn only), and Tailwind for components and styling. // UI는 Shadcn, Tailwind, Radix 조합 (Radix는 Shadcn을 통해서만)
- Do not import anything directly from Radix UI. // Radix UI 직접 import 금지
- Use `class-variance-authority` or `clsx` for conditional class logic. // 조건부 스타일링은 cva 또는 clsx 사용

# 📐 Remix & React Router Conventions

- Do not import anything from `@remix-run`. Always use `react-router`. // @remix-run에서 직접 import 금지. 항상 react-router 사용
- Always export all three: `loader`, `action`, and `meta` from each page. // 각 페이지는 반드시 loader, action, meta를 export
- `loader` receives `Route.LoaderArgs`. // loader 함수의 인자는 Route.LoaderArgs
- `action` receives `Route.ActionArgs`. // action 함수의 인자는 Route.ActionArgs
- `meta` receives `Route.MetaFunction` and returns `MetaFunction`. // meta 함수는 Route.MetaFunction 받고 MetaFunction 반환
- Route types should be imported like:
import type { Route } from "./+types/...";
// 라우트 타입은 위 형식으로 import

# 🚫 Forbidden Patterns

- `useLoaderData` and `useActionData` no longer exist in this project structure. // 해당 훅들은 더 이상 존재하지 않음
- Never use `useLoaderData` or `useActionData` in page components. // 페이지에서 절대 사용 금지
- Do not use `json()`. Return plain objects instead. // json() 사용 금지, 일반 객체 반환
- When returning responses with a status code, wrap them using `data({ status, data })`. // 상태 코드 포함 응답은 data() 함수로 감싸 반환

Example:

export function loader({ request }: Route.LoaderArgs) {
return { user: getUser(request) };
}

export function action({ request }: Route.ActionArgs) {
return data({ status: 201, data: { success: true } });
}

export function meta(): MetaFunction {
return [{ title: "Dashboard" }];
}

# 🧾 Supabase Integration

- Place all Supabase logic in `lib/supabase/` directory. // 모든 Supabase 로직은 lib/supabase/에 위치
- Do not call `supabase.client` directly inside components. // 컴포넌트에서 supabase.client 직접 호출 금지
- Use helper functions for queries and auth logic. // 쿼리와 인증 로직은 헬퍼 함수로 분리
- Use Supabase in `loader` and `action` functions for server-side context. // Supabase는 loader/action 내부에서만 사용
- Session validation and user access control must be performed in the loader. // 세션 검증과 접근 제어는 loader에서 처리