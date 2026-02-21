// import { createClient } from "@supabase/supabase-js";
// import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { createBrowserClient, parseCookieHeader, createServerClient, serializeCookieHeader } from "@supabase/ssr";
import type { Database as SupabaseDatabase } from "database.types";
// import type { BrowserRouter } from "react-router";
import type { MergeDeep, SetNonNullable } from "type-fest";


export type Database = MergeDeep<SupabaseDatabase,
{
    public: {
        Views: {
            message_view: {
                Row: SetNonNullable<
                     SupabaseDatabase["public"]["Views"]["message_view"]["Row"]
                >;
            };
            todo_list_test_view: {
                Row: SetNonNullable<SupabaseDatabase["public"]["Views"]["todo_list_test_view"]["Row"]>;
            };
        };
    };
}>

// Low level security
export const browserClient = createBrowserClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
);


export const makeSSRClient = (request: Request ) => {
    const headers = new Headers();
    const serverSideClient = createServerClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    const cookieHeader = request.headers.get("Cookie") ?? "";
                    return parseCookieHeader(cookieHeader).map((cookie) => ({
                                      name: cookie.name,
                                      value: cookie.value ?? "", // 이 부분이 핵심! undefined를 허용하지 않게 만듭니다.
                    }));
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({name, value, options}) => {
                        headers.append(
                            "Set-Cookie",
                            serializeCookieHeader(name, value, options)
                        );
                    });
                    
                },
            }
        }  
    );
    return {
        client: serverSideClient,
        headers,
    }
}


// export function getSupabaseServerClient(request: Request, responseHeaders: Headers) {
//   return createServerClient(
//     process.env.SUPABASE_URL!,
//     process.env.SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         // 모든 쿠키 읽기
//         getAll() {
//             const cookieHeader = request.headers.get("Cookie") ?? "";
//             // parseCookieHeader의 결과물을 돌면서 value가 undefined인 경우 빈 문자열로 바꿔줍니다.
//             return parseCookieHeader(cookieHeader).map((cookie) => ({
//               name: cookie.name,
//               value: cookie.value ?? "", // 이 부분이 핵심! undefined를 허용하지 않게 만듭니다.
//             }));
//           },
//           setAll(cookiesToSet) {
//             cookiesToSet.forEach(({ name, value, options }) => {
//               responseHeaders.append(
//                 "Set-Cookie",
//                 serializeCookieHeader(name, value, options)
//               );
//             });
//           },
//       },
//     }
//   );
// }

// export default browswerClient;

