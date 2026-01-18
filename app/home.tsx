import type { Route } from "./+types/home";

import { useEffect } from "react";
import { AuroraText } from "~/common/components/ui/aurora-text"
// import { Highlighter } from "~/common/components/ui/highlighter"
// import { SparklesText } from "~/common/components/ui/sparkles-text"
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home | AI Todo List" },
    { name: "description", content: "Welcome to AI Todo List!" },
  ];
}

export const loader = () => {
  return {
    showWelcome: false,
    hello: "To-do List",
  };
}

export default function Home({ loaderData }:Route.ComponentProps) {
  // 페이지 렌더링 전에 처리하는 데이터 C# 으로 예를 들면 public IActionResult TodoPage() { var todos = 여기; return View();}
  const { showWelcome } = loaderData;
  // useEffect()랜더링 후에 처리 C# 으로 예를 들면 loaded 후 에 처리되는 내용 [showWelcome] 해당 변수에 변경이 있을때 [] 는 최초의 한번 실행
  useEffect(() => {
    if (showWelcome) {
      alert("Good!");
    }
  }, [showWelcome]);
  // loader() { return { showWelcome: true };} 로 설정

  return (
    <div className="px-20">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h2 className="text-5xl font-bold leading-tight tracking-tight"><AuroraText>Today's {loaderData.hello}</AuroraText></h2>
          <p className="text-sm font-light text-foreground">
            The best Today's {loaderData.hello}
             {/* <Highlighter action="underline" color="#FF9800">Today's {loaderData.hello}</Highlighter>  */}
             made by you and AI
             {/* <Highlighter action="highlight" color="#87CEFA">AI</Highlighter> */}
          </p>
        </div>
  
      </div>
    </div>
  );
}


// export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
//   if(isRouteErrorResponse(error)) {
//     return (<div> {error.data.message} / {error.data.error_code}</div>);
//   }
//   if(error instanceof Error) {
//     return <div>{error.message}</div>
//   }
//   return <div>Unknow error happended</div>
// }