import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import GoogleButton from "@/components/auth/GoogleButton";
import AuthHeader from "@/components/layout/AuthHeader";
import CompleteProfileDialog, { ProfileData } from "@/components/auth/CompleteProfileDialog";

// ------------------ SCHEMA ------------------
const schema = z.object({
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
  gender: z.enum(["Male", "Female", "Prefer not to say"], { required_error: "Select a gender" }),
  dob: z.string().refine((v) => {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    const age = today.getFullYear() - d.getFullYear() - ((today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) ? 1 : 0);
    return age >= 10 && d <= today;
  }, { message: "Must be at least 10 years old and not in the future" }),
}).refine((vals) => vals.password === vals.confirm, { path: ["confirm"], message: "Passwords do not match" });

type Form = z.infer<typeof schema>;

// ------------------ COMPONENT ------------------
export default function Signup() {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const [profileOpen, setProfileOpen] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [pendingGoogle, setPendingGoogle] = useState<{ idToken: string; email?: string } | null>(null);

  // ----------- GOOGLE SIGNUP WITH PROFILE -----------
  async function submitGoogleWithProfile(idToken: string, profile: ProfileData) {
    setGoogleSubmitting(true);
    try {
      const res = await fetch(`/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_token: idToken,
          extra_data: {
            name: profile.name,
            dob: profile.dob,
            gender: profile.gender,
          },
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = json?.error || json?.message || `Request failed: ${res.status}`;
        if (/password/i.test(msg)) {
          alert("This email is registered with password login. Please login with email & password.");
          navigate("/login");
          return;
        }
        throw new Error(msg);
      }

      const token: string | undefined = json.token || json.access_token;
      if (token) localStorage.setItem("jwt", token);
      if (json.user?.email) localStorage.setItem("user_email", json.user.email);
      if (json.user?.name) localStorage.setItem("user_name", json.user.name);
      if (json.user?.gender) localStorage.setItem("user_gender", json.user.gender);
      try { sessionStorage.setItem("onboarding_mode", "new"); } catch {}
      navigate("/", { replace: true });

    } catch (e: any) {
      alert(e.message || "Google signup failed");
    } finally {
      setGoogleSubmitting(false);
    }
  }

  // ----------- EMAIL/PASSWORD SIGNUP -----------
  const onSubmit = async (data: Form) => {
    const body = {
      email: data.email,
      password: data.password,
      confirm_password: data.confirm,
      name: data.name,
      gender: data.gender,
      dob: data.dob,
    };
    try {
      const res = await fetch(`/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || json?.message || `Request failed: ${res.status}`);
      if (json.token) localStorage.setItem("jwt", json.token);
      localStorage.setItem("user_email", data.email);
      localStorage.setItem("user_name", data.name);
      localStorage.setItem("user_gender", data.gender);
      try { sessionStorage.setItem("onboarding_mode", "new"); } catch {}
      navigate("/", { replace: true });
    } catch (e: any) {
      alert(e.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10 bg-[url('/bg-taskflow.svg')] bg-cover bg-center opacity-80" />
      <div className="absolute -top-24 -right-24 -z-10 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-cyan-300/40 to-indigo-300/40 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 -z-10 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-pink-300/40 to-amber-300/40 blur-3xl" />

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
                {/* NAME */}
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Alex Johnson" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                {/* EMAIL */}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                {/* PASSWORD */}
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" {...register("password")} />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="grid gap-2">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input id="confirm" type="password" {...register("confirm")} />
                  {errors.confirm && <p className="text-sm text-destructive">{errors.confirm.message}</p>}
                </div>

                {/* GENDER */}
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
                  {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
                </div>

                {/* DOB */}
                <div className="grid gap-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" {...register("dob")} />
                  {errors.dob && <p className="text-sm text-destructive">{errors.dob.message}</p>}
                </div>

                {/* SUBMIT BUTTON */}
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Sign up"}</Button>

                {/* OR DIVIDER */}
                <div className="relative my-2 text-center text-xs text-muted-foreground">
                  <span className="bg-card px-2 relative z-10">or</span>
                  <div className="absolute left-0 right-0 top-1/2 -z-0 h-px bg-border" />
                </div>

                {/* GOOGLE LOGIN */}
                <GoogleButton
                  mode="defer"
                  onCredential={({ idToken, profile }) => {
                    setPendingGoogle({ idToken, email: profile?.email });
                    setProfileOpen(true); // Open form to collect extra info
                  }}
                />
              </form>
            </CardContent>
          </Card>
        </div>

        {/* PROFILE DIALOG FOR GOOGLE */}
        <CompleteProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          initialName={pendingGoogle?.email || ""}
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
