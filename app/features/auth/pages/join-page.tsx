
import { makeSSRClient } from "~/supa-client";
import { Button } from "~/common/components/ui/button";
import { data, Form, Link, redirect,useNavigation } from "react-router";
import type { Route } from "./+types/join-page";
import InputPair from "~/common/components/input-pair";
import AuthButtons from "../components/auth-buttons";
import * as z from "zod";
import { checkUsernameExists } from "../queries";
import { LoaderCircle } from "lucide-react";

export const meta: Route.MetaFunction = () => {
  return [{title: "Join"}];
};

const formSchema = z.object({
  name: z.string().min(3),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});


export const action = async ({ request }: Route.ActionArgs) => {
  await new Promise((resolve) => setTimeout(resolve,1000));
  const formData = await request.formData();
  const { success, error, data } = formSchema.safeParse(
    Object.fromEntries(formData)
  );
  if(!success){
    return {
      formErrors: error.flatten().fieldErrors,
    };
  }
  const usernameExists = await checkUsernameExists(request, {
    username: data.username,
  });

  if(usernameExists){
    return {
      formErrors: { username: ["Username already exists"]},
    };
  }

  const { client, headers } = makeSSRClient(request);
  const { error: signUpError }= await client.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
        username: data.username,
      },
    },
  });
  if(signUpError) {
    return {
      signUpError: signUpError.message, 
    };
  }
  return redirect("/", { headers });
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const { client, headers } = makeSSRClient(request);
  
    const goals = "";
    
    return data({ goals }, { headers });
  };
  
  export default function JoinPage({actionData}: Route.ComponentProps) {
    const navigation = useNavigation();
    
    const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
    
    
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
                  {actionData && "formError" in actionData && (
                    <p className="text-red-500">{actionData?.formErrors?.name}</p>
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
                     {actionData && "formError" in actionData && (
                    <p className="text-red-500">{actionData?.formErrors?.username}</p>
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
                     {actionData && "formError" in actionData && (
                    <p className="text-red-500">{actionData?.formErrors?.email}</p>
                  )}
                  <InputPair
                      id="password"
                      label="Password"
                      description="Enter your password"
                      name="password"
                      type="password"
                      required
                  />
                     {actionData && "formErrors" in actionData && (
                    <p className="text-red-500">{actionData?.formErrors?.password}</p>
                  )}
             
                  <Button className="w-full" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <LoaderCircle className="animate-spin"/> : "Create account"}
                  </Button>

                  {actionData && "signUpError" in actionData && (
                    <p className="text-red-500">{actionData.signUpError}</p>
                  )}
              </Form>
              <AuthButtons/>
          </div>
      </div>
    );
  }