import { makeSSRClient } from "~/supa-client";
import type { Route } from "./+types/send-message-page";
import { getLoggedInUserId, getUserProfile, getUserProfileByUsername } from "../queries";
import type { Database } from "~/supa-client";
import { sendMessage } from "../mutations";
import { redirect } from "react-router";
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const action = async ({request, params}: Route.ActionArgs) => {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
      }
    
      const formData = await request.formData();
      const { client } = makeSSRClient(request);
    
      const fromUserId = await getLoggedInUserId(client);
    
      if (!params.username) {
        return Response.json({ error: "Username required" }, { status: 400 });
      }
    
      const profile = await getUserProfileByUsername(client, params.username);
    
      const messageRoomId = await sendMessage(client, {
        fromUserId,
        toUserId: profile.profile_id,
        content: formData.get("content") as string,
      });
    
      return redirect(`/my/messages/${messageRoomId}`);
  

}