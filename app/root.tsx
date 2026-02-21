import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigation
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import Navigation from "./common/components/navigation";
import { cn } from "./lib/utils";
import { makeSSRClient } from "./supa-client";
import { getUserProfile,hasUnreadNotifications } from "~/features/users/queries";



export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/app/image/favicon.png" />

        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}



export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { user: null, profile: null, hasNotifications: false, hasMessages: false };
  }

  const profile = await getUserProfile(client, user.id);

  const navProfile = profile
    ? {
        name: profile.name ?? "",
        username: profile.username ?? "",
        avatar: profile.avatar ?? null,
      }
    : null;

  const hasNotifications = await hasUnreadNotifications(client, { userId: user.id });

  return {
    user,
    profile: navProfile,
    hasNotifications,
    hasMessages: false, // 일단 false로 (나중에 메시지 붙일 때)
  };
};

export default function App({ loaderData }: Route.ComponentProps) {
  const { pathname } = useLocation();
  const navigation = useNavigation();
  const isLoading = navigation.state ==="loading";
  const isLoggedIn = loaderData.user !== null;
  
  
  return (
    <div
      className={cn({
        "py-28 px-5 md:px-20": !pathname.includes("/auth/"),
        "opacity-50": isLoading,
      })}
    >
      {pathname.includes("/auth") ? null : (
      <Navigation
      isLoggedIn={isLoggedIn}
      hasNotifications={loaderData.hasNotifications}
      hasMessages={loaderData.hasMessages}
      profile={loaderData.profile}
    />
        
    )}
      
      <Outlet 
      context= {{
        isLoggedIn,
        name: loaderData.profile?.name,
        userId: loaderData.user?.id,
        username: loaderData.profile?.username,
        avatar: loaderData.profile?.avatar
      }}
      />
    </div>
  );

}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
