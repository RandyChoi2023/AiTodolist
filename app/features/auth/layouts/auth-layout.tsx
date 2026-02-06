import { Outlet } from "react-router";
import { RetroGrid } from "~/common/components/ui/retro-grid";
import { AnimatedShinyText } from "~/common/components/ui/animated-shiny-text";

export default function AuthLayout() {
    return (
    <div className="grid grid-cols-2 h-screen">
             <div className="relative overflow-hidden flex items-center justify-center">
        <RetroGrid className="opacity-40" />
        <div className="relative z-10 text-center px-10">
          <AnimatedShinyText className="text-4xl font-bold">
            Build habits. Level up.
          </AnimatedShinyText>
          <p className="mt-3 text-muted-foreground">
            Small steps, real progress.
          </p>
        </div>
      </div>
        <Outlet />
    </div>);
}