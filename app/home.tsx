import type { Route } from "./+types/home";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home | AI Todo List" },
    { name: "description", content: "Welcome to AI Todo List!" },
  ];
}

export default function Home() {
  return (
    <div className="px-20">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h2 className="text-5xl font-bold leading-tight tracking-tight">Today's To-do List</h2>
          <p className="text-xl font-light text-foreground">The best To-do List made by you and AI</p>
        </div>

      </div>
    </div>
  );
}
