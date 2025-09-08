import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import GoogleButton from "@/components/auth/GoogleButton";
import AuthHeader from "@/components/layout/AuthHeader";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState<string>("male"); // default male

  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from || "/";

  async function post(path: string, body: any) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`https://to-do-habit-tracker.onrender.com${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || `Request failed: ${res.status}`;
        throw new Error(msg);
      }

      const token: string | undefined = data.token || data.access_token || data.jwt || data.id_token;
      if (!token) throw new Error("Token not found in response");

      localStorage.setItem("jwt", token);
      localStorage.setItem("user_email", data.user?.email || email);
      localStorage.setItem("user_name", data.user?.name || "");

      // Fetch gender from backend endpoint if not provided
      let g = data.user?.gender || "male";
      const genderRes = await fetch(`https://to-do-habit-tracker.onrender.com/gender?email=${data.user?.email || email}`);
      if (genderRes.ok) {
        const genderData = await genderRes.json();
        g = genderData.gender || g;
      }

      g = g.toLowerCase() === "female" ? "female" : "male"; // normalize
      setGender(g);
      localStorage.setItem("user_gender", g);

      try { sessionStorage.setItem("onboarding_mode", "returning"); } catch {}
      navigate(from, { replace: true });
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    post("/login", { email, password });
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
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <div className="text-sm text-destructive">{error}</div>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</Button>
                  <Button type="button" variant="outline" onClick={goSignup} disabled={loading}>Register</Button>
                </div>
                <div className="relative my-2 text-center text-xs text-muted-foreground">
                  <span className="bg-card px-2 relative z-10">or</span>
                  <div className="absolute left-0 right-0 top-1/2 -z-0 h-px bg-border" />
                </div>
                <GoogleButton
                  onCredential={({ idToken, profile }) => {
                    localStorage.setItem("jwt", idToken);
                    localStorage.setItem("user_email", profile?.email || "");
                    localStorage.setItem("user_name", profile?.name || "");

                    const g = profile?.gender === "female" ? "female" : "male";
                    localStorage.setItem("user_gender", g);
                    setGender(g);

                    try { sessionStorage.setItem("onboarding_mode", "returning"); } catch {}
                    navigate(from, { replace: true });
                  }}
                />
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
