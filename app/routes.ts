import { type RouteConfig, index, prefix, route,layout } from "@react-router/dev/routes";

export default [
    // prefix checking
    index("home.tsx"),
    //goals
    route("goals", "features/goals/goals-list.tsx"),
    //to-do-list
    route("to-do-lists", "features/todos/todo-list.tsx"),
    //core-list
    route("/my-core-list/all-lists", "features/cores/core-list.tsx"),

    //motivation
    route("/motivation", "features/motivation/sentence-page.tsx"),
    
    //report
    ...prefix("/report",[
        route("/weekly","features/report/weekly-page.tsx"),
    ]),
    
    ...prefix("/auth",[
        layout("features/auth/layouts/auth-layout.tsx", [
            route("/login", "features/auth/pages/login-page.tsx"),
            route("/join", "features/auth/pages/join-page.tsx"),
            ...prefix("/otp", [
                route("/start", "features/auth/pages/otp-start-page.tsx"),
                route("/complete", "features/auth/pages/otp-complete-page.tsx"),
            ]),
            ...prefix("/social/:provider", [
                route("/start", "features/auth/pages/social-start-page.tsx"),
                route("/complete", "features/auth/pages/social-complete-page.tsx"),
            ]),
        ]),
        route("/logout","features/auth/pages/logout-page.tsx"),
    ]),
   
    // 추후에 업데이트 아이디어 추가 예정
    // ...prefix("cores", [
    //     index("features/cores/core-list.tsx"),
    //     route("normal/:id", "features/cores/core-list.tsx"),
    //     route("hard/:id", "features/cores/core-list.tsx"), // id 는 core-list.tsx 에 파라미터 받음. 
    // ]),
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
    
    route("/welcome","features/users/pages/welcome-page.tsx")
] satisfies RouteConfig;
