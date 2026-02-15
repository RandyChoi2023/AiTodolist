
// import { WelcomeUser } from "react-email-starter/emails/welcome-page";
// import { Resend } from "resend";


// const client = new Resend(process.env.RESEND_API_KEY);
// // welcome email test
// export const loader = async () => {
    
//     const { data, error } = await client.emails.send({
//         from: 'Randy <randy@mail.justdoai.it.com>',
//         to: 'enjoyg@naver.com',
//         subject: 'Welcome to the ai to do list',
//         react: <WelcomeUser username={'randy'}></WelcomeUser>,
//     });

//     return Response.json({data, error});
// }


import * as React from "react"; 
import type { Route } from "./+types/welcome-page";

export const meta: Route.MetaFunction = () => [{ title: "Welcome | AI To-Do List" }];

export default function WelcomePage() {
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <h1 className="text-3xl font-bold">Welcome</h1>
      <p className="text-muted-foreground">
        환영 페이지는 현재 작업 중입니다.
      </p>
    </div>
  );
}
