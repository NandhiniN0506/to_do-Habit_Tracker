// frontend/src/pages/Login.tsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleButton from "@/components/auth/GoogleButton";
import AuthHeader from "@/components/layout/AuthHeader";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from || "/";

  // Robust POST function for login
  async function postLogin(path: string, body: any) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Handle backend errors
        let msg = "Login failed";
        if (data && (data.error || data.message)) msg = data.error || data.message;
        if (res.status === 404) msg = "Email not registered";
        if (res.status === 401) msg = "Incorrect password";
        throw new Error(msg);
      }

      // Extract token (supporting multiple possible keys)
      const token: string | undefined = data.token || data.access_token || data.jwt || data.id_token;
      if (!token) throw new Error("Token not found in response");

      // Save JWT and user email
      localStorage.setItem("jwt", token);
      if (email) localStorage.setItem("user_email", email);

      // Navigate to the page user wanted
      navigate(from, { replace: true });
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    postLogin("/login", { email, password });
  };

  const goSignup = () => navigate("/signup");

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50">
      <main className="container py-8">
        <div className="mx-auto max-w-md">
          <AuthHeader />
          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>Log in to access your dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleLogin}>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Login"}
                  </Button>
                  <Button type="button" variant="outline" onClick={goSignup} disabled={loading}>
                    Register
                  </Button>
                </div>

                <div className="relative my-2 text-center text-xs text-muted-foreground">
                  <span className="bg-card px-2 relative z-10">or</span>
                  <div className="absolute left-0 right-0 top-1/2 -z-0 h-px bg-border" />
                </div>
                <GoogleButton />
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
