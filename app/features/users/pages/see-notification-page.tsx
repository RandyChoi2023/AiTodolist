// import { data, redirect } from "react-router";
// import { makeSSRClient } from "~/supa-client";
// import type { Route } from "./+types/see-notification-page";
// import { getLoggedInUserId } from "../queries";
// import { seeNotification } from "../mutations";

// export const action = async ({ request }: Route.ActionArgs) => {
//   if (request.method !== "POST") {
//     return data({ ok: false as const, error: "Method not allowed" }, { status: 405 });
//   }

//   const { client, headers } = makeSSRClient(request);
//   const userId = await getLoggedInUserId(client);

//   const fd = await request.formData();
//   const notificationIdRaw = String(fd.get("notificationId") ?? "").trim();
//   const notificationId = Number(notificationIdRaw);

//   if (!notificationIdRaw || Number.isNaN(notificationId)) {
//     return data({ ok: false as const, error: "notificationId가 올바르지 않아." }, { status: 400, headers });
//   }

//   try {
//     await seeNotification(client, { userId, notificationId });
//     return data({ ok: true as const }, { headers });
//   } catch (e: any) {
//     return data(
//       { ok: false as const, error: e?.message ?? "seen 업데이트 실패" },
//       { status: 400, headers }
//     );
//   }
// };

// export default function SeeNotificationPage() {
//   return null;
// }


import { data } from "react-router";
import { makeSSRClient } from "~/supa-client";
import type { Route } from "./+types/see-notification-page";
import { getLoggedInUserId } from "../queries";
import { seeNotification } from "../mutations";

export const action = async ({ request }: Route.ActionArgs) => {
  if (request.method !== "POST") {
    return data({ ok: false as const, error: "Method not allowed" }, { status: 405 });
  }

  const { client, headers } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);

  const fd = await request.formData();
  const notificationIdRaw = String(fd.get("notificationId") ?? "").trim();
  const notificationId = Number(notificationIdRaw);

  if (!notificationIdRaw || Number.isNaN(notificationId)) {
    return data({ ok: false as const, error: "notificationId가 올바르지 않아." }, { status: 400, headers });
  }

  try {
    await seeNotification(client, { userId, notificationId });
    return data({ ok: true as const }, { headers });
  } catch (e: any) {
    return data({ ok: false as const, error: e?.message ?? "업데이트 실패" }, { status: 400, headers });
  }
};

export default function SeeNotificationPage() {
  return null;
}
