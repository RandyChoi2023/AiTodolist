import { makeSSRClient } from "~/supa-client";
import { Button } from "~/common/components/ui/button";
import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/join-page";
import InputPair from "~/common/components/input-pair";
import AuthButtons from "../components/auth-buttons";
import * as z from "zod";
import { checkUsernameExists } from "../queries";
import { LoaderCircle } from "lucide-react";
import { sendWelcomeEmail } from "~/features/users/server/send-welcome-email"; // ✅ 추가

export const meta: Route.MetaFunction = () => [{ title: "Join" }];

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type ActionData =
  | { formErrors: Record<string, string[] | undefined> }
  | { signUpError: string };

export const action = async ({ request }: Route.ActionArgs) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const formData = await request.formData();
  const parsed = formSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      formErrors: parsed.error.flatten().fieldErrors,
    } satisfies ActionData;
  }

  const { name, username, email, password } = parsed.data;

  const usernameExists = await checkUsernameExists(request, { username });
  if (usernameExists) {
    return {
      formErrors: { username: ["Username already exists"] },
    } satisfies ActionData;
  }

  const { client, headers } = makeSSRClient(request);

  const { error: signUpError } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { name, username },
    },
  });

  if (signUpError) {
    return { signUpError: signUpError.message } satisfies ActionData;
  }

  // ✅ 가입 성공 → Welcome Email 발송 (실패해도 회원가입은 성공 유지)
  try {
    const origin = new URL(request.url).origin; // ✅ baseUrl에 쓰기 좋음
    await sendWelcomeEmail({
      to: email,
      username,
      baseUrl: origin,
    });
  } catch (e) {
    console.error("Failed to send welcome email:", e);
  }

  return redirect("/my/settings?onboarding=1", { headers });
};

export default function JoinPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";

  const fieldErrors =
    actionData && "formErrors" in actionData ? actionData.formErrors : undefined;

  return (
    <div className="flex flex-col relative items-center justify-center h-full">
      <Button variant={"ghost"} asChild className="absolute right-8 top-8">
        <Link to="/auth/login">Login</Link>
      </Button>

      <div className="flex items-center flex-col justify-center w-full max-w-md gap-10">
        <h1 className="text-2xl font-semibold">Create an account</h1>

        <Form className="w-full space-y-4" method="post" noValidate>
          <InputPair
            id="name"
            label="Name"
            description="Enter your name"
            name="name"
            type="text"
            placeholder="Enter your name"
            required
          />
          {fieldErrors?.name?.[0] && (
            <p className="text-red-500">{fieldErrors.name[0]}</p>
          )}

          <InputPair
            id="username"
            label="Username"
            description="Enter your username"
            name="username"
            type="text"
            placeholder="Enter your username"
            required
          />
          {fieldErrors?.username?.[0] && (
            <p className="text-red-500">{fieldErrors.username[0]}</p>
          )}

          <InputPair
            id="email"
            label="Email"
            description="Enter your email"
            name="email"
            type="email"
            placeholder="i.e skyblue@aitodo.com"
            required
          />
          {fieldErrors?.email?.[0] && (
            <p className="text-red-500">{fieldErrors.email[0]}</p>
          )}

          <InputPair
            id="password"
            label="Password"
            description="Enter your password"
            name="password"
            type="password"
            required
          />
          {fieldErrors?.password?.[0] && (
            <p className="text-red-500">{fieldErrors.password[0]}</p>
          )}

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              "Create account"
            )}
          </Button>

          {actionData && "signUpError" in actionData && (
            <p className="text-red-500">{actionData.signUpError}</p>
          )}
        </Form>

        <AuthButtons />
      </div>
    </div>
  );
}