import { makeSSRClient } from "~/supa-client";

import { data, Form, Link } from "react-router";
import type { Route } from "./+types/otp-complete-page";

import { Button } from "~/common/components/ui/button";
import InputPair from "~/common/components/input-pair";

export const meta: Route.MetaFunction = () => {
  return [{title: "otp | AI todo list"}];
}


export const loader = async ({ request }: Route.LoaderArgs) => {
    const { client, headers } = makeSSRClient(request);
  
    const goals = "";
    
    return data({ goals }, { headers });
  };
  
  export default function OtpPage() {
    return (
      <div className="flex flex-col relative items-center justify-center h-full">
      <div className="flex items-center flex-col justify-center w-full max-w-md gap-10">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Confirm OTP</h1>
            <p className="text-sm text-muted-foeground">
                Enter the OTP code sent to your email address.
            </p>
          </div>
          <Form className="w-full space-y-4">
              <InputPair
                  id="email"
                  label="Email"
                  description="Enter your email"
                  name="email"
                  type="email"
                  placeholder="i.e skyblue@aitodo.com"
                  required
              />
               <InputPair
                  id="otp"
                  label="OTP"
                  description="Enter the OTP code sent to your email address"
                  name="otp"
                  type="text"
                  placeholder="i.e 1234"
                  required
              />
              <Button className="w-full" type="submit">Log in</Button>
          </Form>
      </div>
  </div>
    );
  }