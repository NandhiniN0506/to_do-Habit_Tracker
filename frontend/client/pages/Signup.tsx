import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import GoogleButton from "@/components/auth/GoogleButton";
import AuthHeader from "@/components/layout/AuthHeader";
import CompleteProfileDialog, { ProfileData } from "@/components/auth/CompleteProfileDialog";
import { useState } from "react";

const API = "https://to-do-habit-tracker.onrender.com";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Min 8 characters"),
  confirm: z.string(),
  gender: z.enum(["Male", "Female", "Prefer not to say"]),
  dob: z.string(),
}).refine((vals) => vals.password === vals.confirm, { path: ["confirm"], message: "Passwords do not match" });

type Form = z.infer<typeof schema>;

export default function Signup() {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingGoogle, setPendingGoogle] = useState<{ idToken: string; name?: string; email?: string } | null>(null);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  // ---------------- Google signup ----------------
  async function submitGoogleWithProfile(idToken: string, profile: ProfileData) {
    setGoogleSubmitting(true);
    try {
      const res = await fetch(`${API}/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken, extra_data: profile }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json?.message || json?.error || "Google signup failed");

      if (json.token) localStorage.setItem("jwt", json.token);
      if (json.user?.email) localStorage.setItem("user_email", json.user.email);
      if (json.user?.name) localStorage.setItem("user_name", json.user.name);
      if (profile.gender) localStorage.setItem("user_gender", profile.gender);
      sessionStorage.setItem("onboarding_mode", "new");

      navigate("/", { replace: true });
    } catch (e: any) {
      alert(e.message || "Google signup failed");
    } finally {
      setGoogleSubmitting(false);
    }
  }

  // ---------------- Email/password signup ----------------
  const onSubmit = async (data: Form) => {
    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          dob: data.dob,
          gender: data.gender,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || json?.error || "Signup failed");

      // Optionally auto-login after signup
      const loginRes = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const loginJson = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok) throw new Error(loginJson?.error || "Login after signup failed");

      if (loginJson.token) localStorage.setItem("jwt", loginJson.token);
      localStorage.setItem("user_email", data.email);
      localStorage.setItem("user_name", data.name);
      localStorage.setItem("user_gender", data.gender);
      sessionStorage.setItem("onboarding_mode", "new");

      navigate("/", { replace: true });
    } catch (e: any) {
      alert(e.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-80" style={{ backgroundImage: "url('/bg-taskflow.svg')", backgroundSize: "cover", backgroundPosition: "center" }} />
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
                  <Input id="name" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" {...register("password")} />
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
                  <Select value={watch("gender") as any} onValueChange={(v) => setValue("gender", v as any, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* DOB */}
                <div className="grid gap-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" {...register("dob")} />
                </div>

                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Sign up"}</Button>
              </form>

              <div className="relative my-4 text-center text-xs text-muted-foreground">
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
            </CardContent>
          </Card>
        </div>

        {/* Complete Profile Modal */}
        {pendingGoogle && (
          <CompleteProfileDialog
            open={profileOpen}
            onOpenChange={setProfileOpen}
            initialName={pendingGoogle.name || ""}
            submitting={googleSubmitting}
            onSubmit={(data) => submitGoogleWithProfile(pendingGoogle.idToken, data)}
          />
        )}
      </main>
    </div>
  );
}
