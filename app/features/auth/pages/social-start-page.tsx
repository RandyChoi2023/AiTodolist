import { makeSSRClient } from "~/supa-client";

import { data } from "react-router";
import type { Route } from "./+types/join-page";


export const loader = async ({ request }: Route.LoaderArgs) => {
    const { client, headers } = makeSSRClient(request);
  
    const goals = "";
    
    return data({ goals }, { headers });
  };
  
  export default function SocialStartPage() {
    return "";
  }