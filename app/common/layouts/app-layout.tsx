import { Outlet, useLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";
import Navigation from "~/common/components/navigation";

export default function AppLayout() {
  const { user, profile } = useLoaderData<typeof rootLoader>();
  const isLoggedIn = user !== null;

  return (
    <div className="min-h-dvh">
      <Navigation
        isLoggedIn={isLoggedIn}
        hasNotifications
        hasMessages
        profile={profile}
      />

      {/* fixed header offset */}
      <main className="pt-16">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
