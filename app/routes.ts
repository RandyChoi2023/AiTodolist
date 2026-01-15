import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("home.tsx"),
    //goals
    route("goals", "features/goals/goals-list.tsx"),
    //to-do-list
    route("to-do-lists", "features/todos/todo-list.tsx"),
    //core-list
    route("/my-core-list/all-lists", "features/cores/core-list.tsx"),
    // Auth
    // route("login", "routes/login.tsx"),
    // route("signup", "routes/signup.tsx"),

    // User pages (userid required)
    // route("goal/:userid", "routes/goal.tsx"),
    // route("to-do-list/:userid", "routes/todo-list.tsx"),
    // route("history/:userid", "routes/history.tsx"),
    // route("profile/:userid", "routes/profile.tsx"),
    // route("reports/:userid", "routes/repㅊㅊㅍㄹㅎㅎorts.tsx"),

    // Admin
    // route("users", "routes/admin.tsx"),
] satisfies RouteConfig;
