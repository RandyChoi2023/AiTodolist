import { makeSSRClient } from "~/supa-client";

import { data, Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/login-page";

import { Button } from "~/common/components/ui/button";
import InputPair from "~/common/components/input-pair";
import AuthButtons from "../components/auth-buttons";
import { LoaderCircle } from "lucide-react";
import * as z from "zod";


// 수정된 타입 정의
type ActionData = { 
    message?: string; 
    loginError?: string;
    formErrors?: {
      email?: string[];
      password?: string[];
    } | null;
  };

export const meta: Route.MetaFunction = () => {
    return [{title: "Login"}];
};


const formSchema = z.object({
    email: z.string().trim().min(1, "Email is required").email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  });
  
export const action = async ({request}: Route.ActionArgs ) => {
    await new Promise((resolve) => setTimeout(resolve,1000));
    const formData = await request.formData();
    const { success, data, error } = formSchema.safeParse(Object.fromEntries(formData));
    
    if(!success) {
        return {
            formErrors: error.flatten().fieldErrors,
        }
    }

    const { email, password } = data;
    const { client, headers } = makeSSRClient(request);
    const { error: loginError} = await client.auth.signInWithPassword({ email, password});

    if(loginError) {
        return {
            formErrors:null,
            loginError: loginError.message,
        };
    }
    return redirect("/", { headers });

};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const { client, headers } = makeSSRClient(request);
  
    const goals = "";
    
    return data({ goals }, { headers });
  };
 
  
  export default function LoginPage({ actionData }: Route.ComponentProps) {
    const navigation = useNavigation();
    const data = actionData as ActionData | undefined;

    
    const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
    
    return (
      <div className="flex flex-col relative items-center justify-center h-full">
          <Button variant={"ghost"} asChild className="absolute right-8 top-8">
              <Link to="/auth/join">Join</Link>
          </Button>
          <div className="flex items-center flex-col justify-center w-full max-w-md gap-10">
              <h1 className="text-2xl font-semibold">Log in to your account</h1>
              <Form className="w-full space-y-4" method="post" noValidate>
                  <InputPair
                      id="email"
                      label="Email"
                      description="Enter your email"
                      name="email"
                      type="email"
                      placeholder="i.e skyblue@aitodo.com"
                      required
                  />
                 {data && "formErrors" in data && (
                    <p className="text-sm text-red-500">
                        {data?.formErrors?.email?.join(", ")}
                    </p>
                    
                  )}

                  <InputPair
                      id="password"
                      label="Password"
                      description="Enter your password"
                      name="password"
                      type="password"
                      required
                  />
                  {data && "formErrors" in data && (
                    <p className="text-sm text-red-500">
                        {data?.formErrors?.password?.join(", ")}
                        
                    </p>
                    
                  )}
                  <Button className="w-full" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <LoaderCircle className="animate-spin"/> : "Log in"}
                  </Button>
                  {data && "loginError" in data && (
                    <p className="text-sm text-red-500">{data?.loginError}</p>
                  )}
                  <AuthButtons/>
              </Form>
          </div>
      </div>
  );;
  }