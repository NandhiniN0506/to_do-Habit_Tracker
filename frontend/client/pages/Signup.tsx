import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import GoogleButton from "@/components/auth/GoogleButton";
import AuthHeader from "@/components/layout/AuthHeader";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://to-do-habit-tracker.onrender.com";

const schema = z
  .object({
    name: z.string().min(1, "Name is required").regex(/^[A-Za-z ]+$/, "Only letters and spaces allowed"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Min 8 characters")
      .regex(/[A-Z]/, "At least 1 uppercase letter")
      .regex(/[a-z]/, "At least 1 lowercase letter")
      .regex(/[0-9]/, "At least 1 number")
      .regex(/[^A-Za-z0-9]/, "At least 1 special character"),
    confirm: z.string(),
    gender: z.enum(["Male", "Female", "Prefer not to say"]),
    dob: z.string(),
  })
  .refine((vals) => vals.password === vals.confirm, { path: ["confirm"], message: "Passwords do not match" });

type Form = z.infer<typeof schema>;

type ApiAuthResponse = { token?: string; user?: { email?: string; name?: string }; message?: string; error?: string };

export default function Signup() {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) });

  const [profileOpen, setProfileOpen] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [pendingGoogle, setPendingGoogle] = useState<{ idToken: string; name?: string; email?: string } | null>(null);

  const navigate = useNavigate();

  async function postJSON(path: string, body: any): Promise<Response> {
    return fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function persistUserLocals(token: string | undefined, email?: string, name?: string, gender?: string) {
    if (token) localStorage.setItem("jwt", token);
    if (email) localStorage.setItem("user_email", email);
    if (name) localStorage.setItem("user_name", name);
    if (gender) localStorage.setItem("user_gender", gender);
    sessionStorage.setItem("onboarding_mode", "new");
    // signal ProtectedRoute + first render that we came from signup
    sessionStorage.setItem("fromSignup", "true");
  }

  // ------------------ Google signup with profile ------------------
  async function submitGoogleWithProfile(idToken: string, profile: ProfileData) {
    setGoogleSubmitting(true);
    try {
      const res = await postJSON("/google-login", { id_token: idToken, extra_data: profile });
      const json: ApiAuthResponse = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || "Google signup failed");

      persistUserLocals(json.token, json.user?.email, json.user?.name, profile.gender || undefined);

      // redirect with a durable signup hint in URL
      navigate("/?from=signup", { replace: true });
    } catch (e: any) {
      alert(e.message || "Google signup failed");
    } finally {
      setGoogleSubmitting(false);
    }
  }

  // ------------------ Email/password signup ------------------
  const onSubmit = async (data: Form) => {
    try {
      const body = {
        email: data.email,
        password: data.password,
        confirm_password: data.confirm,
        name: data.name,
        gender: data.gender,
        dob: data.dob,
      };

      // 1) Try to sign up
      const res = await postJSON("/signup", body);
      const json: ApiAuthResponse = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Signup failed");

      // 2) Ensure we actually have a token; if not, auto-login
      let token = json.token;
      if (!token) {
        const loginRes = await postJSON("/login", { email: data.email, password: data.password });
        const loginJson: ApiAuthResponse = await loginRes.json().catch(() => ({}));
        if (!loginRes.ok) throw new Error(loginJson.error || "Login after signup failed");
        token = loginJson.token;
      }

      // 3) Persist locally
      persistUserLocals(token, data.email, data.name, data.gender);

      // 4) Go home with a stable hint
      navigate("/?from=signup", { replace: true });
    } catch (e: any) {
      alert(e.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-80"
        style={{ backgroundImage: "url('/bg-taskflow.svg')", backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="pointer-events-none absolute -top-24 -right-24 -z-10 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-cyan-300/40 to-indigo-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 -z-10 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-pink-300/40 to-amber-300/40 blur-3xl" />
      <main className="container py-8">
        <div className="mx-auto max-w-md">
          <AuthHeader />
          <Card>
            <CardHeader>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>Sign up to start tracking tasks and habits.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Name */}
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="e.g. Alex Johnson" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Min 8 chars, strong" {...register("password")} />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>

                {/* Confirm */}
                <div className="grid gap-2">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input id="confirm" type="password" {...register("confirm")} />
                  {errors.confirm && <p className="text-sm text-destructive">{errors.confirm.message}</p>}
                </div>

                {/* Gender */}
                <div className="grid gap-2">
                  <Label>Gender</Label>
                  <Select
                    value={watch("gender") as any}
                    onValueChange={(v) => setValue("gender", v as any, { shouldValidate: true })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
                </div>

                {/* DOB */}
                <div className="grid gap-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" {...register("dob")} />
                  {errors.dob && <p className="text-sm text-destructive">{errors.dob.message}</p>}
                </div>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Sign up"}
                </Button>

                <div className="relative my-2 text-center text-xs text-muted-foreground">
                  <span className="bg-card px-2 relative z-10">or</span>
                  <div className="absolute left-0 right-0 top-1/2 -z-0 h-px bg-border" />
                </div>

                <GoogleButton
                  mode="defer"
                  onCredential={({ idToken, profile }) => {
                    setPendingGoogle({ idToken, name: profile?.name, email: profile?.email });
                    setProfileOpen(true);
                  }}
                />
              </form>
            </CardContent>
          </Card>
        </div>

        <CompleteProfileDialog
          open={profileOpen}
          onOpenChange={(v) => setProfileOpen(v)}
          initialName={pendingGoogle?.name || null}
          submitting={googleSubmitting}
          onSubmit={(data) => {
            if (!pendingGoogle) return;
            submitGoogleWithProfile(pendingGoogle.idToken, data);
          }}
        />
      </main>
    </div>
  );
}
