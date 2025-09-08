import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
  const location = useLocation();

  // durable hint if this is the first landing post-signup
  const fromQuery = new URLSearchParams(location.search).get("from") === "signup";
  const fromSession = typeof window !== "undefined" && sessionStorage.getItem("fromSignup") === "true";
  const cameFromSignup = fromQuery || fromSession;

  if (!token && !cameFromSignup) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  // once inside, clear the one-time flag
  if (cameFromSignup) {
    sessionStorage.removeItem("fromSignup");
  }

  return <>{children}</>;
}
