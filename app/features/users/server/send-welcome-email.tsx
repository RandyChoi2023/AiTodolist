import * as React from "react";
import { Resend } from "resend";
import JoinEmail from "../pages/join-email-page";
 // ✅ 너의 JoinEmail 컴포넌트 경로로 맞춰줘

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail({
  to,
  username,
  baseUrl,
}: {
  to: string;
  username: string;
  baseUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const { data, error } = await resend.emails.send({
    from: `AI To-Do List <welcome@mail.justdoai.it.com>`,
    to,
    subject: `AI To-Do List에 오신 것을 환영합니다, ${username}님 🎉`,
    react: React.createElement(JoinEmail, { username, baseUrl }),
  });

  if (error) throw error;
  return data;
}