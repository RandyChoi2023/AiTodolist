import type { Route } from "./+types/home";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Todo List App" },
    { name: "description", content: "Welcome to AI Todo List App!" },
  ];
}

export default function Home() {
  return "AI Todo List";
}
