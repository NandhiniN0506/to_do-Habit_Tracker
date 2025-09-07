import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { pathname } = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
  const email = typeof window !== "undefined" ? localStorage.getItem("user_email") : null;
  const first = (email || "").trim().charAt(0).toUpperCase() || "U";
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-indigo-600 text-white font-bold">T</span>
          <span className="font-semibold tracking-tight">TaskFlow</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <NavLink
            to="/"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/" ? "text-foreground" : "text-foreground/60",
            )}
          >
            Tasks
          </NavLink>
          <NavLink
            to="/pomodoro"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname.startsWith("/pomodoro")
                ? "text-foreground"
                : "text-foreground/60",
            )}
          >
            Pomodoro
          </NavLink>
          <NavLink
            to="/wellness"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname.startsWith("/wellness")
                ? "text-foreground"
                : "text-foreground/60",
            )}
          >
            Wellness
          </NavLink>
          <NavLink
            to="/analytics"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname.startsWith("/analytics")
                ? "text-foreground"
                : "text-foreground/60",
            )}
          >
            Analytics
          </NavLink>
          <NavLink
            to="/about"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname.startsWith("/about")
                ? "text-foreground"
                : "text-foreground/60",
            )}
          >
            About
          </NavLink>
          <div className="ml-2 flex items-center gap-2">
            <ThemeToggle />
            {token ? (
              <>
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-medium" title={email || undefined}>{first}</div>
                <button
                  className="text-sm text-foreground/80 hover:text-foreground"
                  onClick={() => { localStorage.removeItem("jwt"); localStorage.removeItem("user_email"); window.location.assign("/login"); }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm text-foreground/80 hover:text-foreground">Login</Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
