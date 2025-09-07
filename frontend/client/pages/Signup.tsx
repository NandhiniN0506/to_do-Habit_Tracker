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

const schema = z.object({
  name: z.string().min(1, "Name is required").regex(/^[A-Za-z ]+$/, "Only letters and spaces allowed"),
  email: z.string().email("Enter a valid email").refine((v) => {
    const parts = v.split("@");
    if (parts.length !== 2) return false;
    const domain = parts[1];
    const labels = domain.split(".");
    if (labels.length < 2) return false;
    const tld = labels[labels.length - 1];
    if (!/^[A-Za-z]{2,24}$/.test(tld)) return false;
    const sld = labels[labels.length - 2];
    if (!/[A-Za-z]/.test(sld)) return false; // require letters in second-level domain (reject 123@123.com)
    return labels.every((l) => /^[A-Za-z0-9-]{1,63}$/.test(l) && !l.startsWith("-") && !l.endsWith("-"));
  }, { message: "Enter a valid email domain" }),
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
    if (d > today) return false;
    const age = today.getFullYear() - d.getFullYear() - (today < new Date(d.getFullYear() + ageOffset(d, today), d.getMonth(), d.getDate()) ? 1 : 0);
    return age >= 10;
  }, { message: "Must be at least 10 years old and not in the future" }),
}).refine((vals) => vals.password === vals.confirm, { path: ["confirm"], message: "Passwords do not match" });

function ageOffset(d: Date, today: Date) {
  return (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) ? 1 : 0;
}

type Form = z.infer<typeof schema>;

export default function Signup() {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const [profileOpen, setProfileOpen] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [pendingGoogle, setPendingGoogle] = useState<{ idToken: string; name?: string; email?: string } | null>(null);

  async function submitGoogleWithProfile(idToken: string, profile: ProfileData) {
    setGoogleSubmitting(true);
    try {
      const res = await fetch(`/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken, extra_data: { name: profile.name, dob: profile.dob, gender: profile.gender } }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json?.message || json?.error || `Request failed: ${res.status}`) as string;
        if (/auth_provider|password/i.test(msg)) {
          alert("This email already uses password login. Please log in with email & password.");
          navigate("/login");
          return;
        }
        throw new Error(msg);
      }
      const token: string | undefined = json.token || json.access_token || json.jwt || json.id_token;
      if (token) localStorage.setItem("jwt", token);
      navigate("/", { replace: true });
    } catch (e: any) {
      alert(e.message || "Google signup failed");
    } finally {
      setGoogleSubmitting(false);
    }
  }

  const onSubmit = async (data: Form) => {
    const body: any = { email: data.email, password: data.password, name: data.name, gender: data.gender, dob: data.dob };
    try {
      const res = await fetch(`/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || json?.error || `Request failed: ${res.status}`);
      const token: string | undefined = json.token || json.access_token || json.jwt || json.id_token;
      if (token) localStorage.setItem("jwt", token);
      if (data.email) localStorage.setItem("user_email", data.email);
      navigate("/", { replace: true });
    } catch (e: any) {
      alert(e.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-80" style={{ backgroundImage: "url('/bg-taskflow.svg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
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
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="e.g. Alex Johnson" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Min 8 chars, strong" {...register("password")} />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                  {(() => {
                    const pwd = watch("password") || "";
                    const rules = [
                      { ok: pwd.length >= 8, text: "Min 8 characters" },
                      { ok: /[A-Z]/.test(pwd), text: "At least 1 uppercase" },
                      { ok: /[a-z]/.test(pwd), text: "At least 1 lowercase" },
                      { ok: /[0-9]/.test(pwd), text: "At least 1 number" },
                      { ok: /[^A-Za-z0-9]/.test(pwd), text: "At least 1 special character" },
                    ];
                    return (
                      <ul className="mt-1 grid gap-1 text-xs">
                        {rules.map((r, i) => (
                          <li key={i} className={r.ok ? "text-emerald-600" : "text-muted-foreground"}>• {r.text}</li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input id="confirm" type="password" {...register("confirm")} />
                  {errors.confirm && <p className="text-sm text-destructive">{errors.confirm.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>Gender</Label>
                  <Select value={watch("gender") as any} onValueChange={(v) => setValue("gender", v as any, { shouldValidate: true })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" {...register("dob")} />
                  {errors.dob && <p className="text-sm text-destructive">{errors.dob.message}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Sign up"}</Button>
                <div className="relative my-2 text-center text-xs text-muted-foreground">
                  <span className="bg-card px-2 relative z-10">or</span>
                  <div className="absolute left-0 right-0 top-1/2 -z-0 h-px bg-border" />
                </div>
                <GoogleButton mode="defer" onCredential={({ idToken, profile }) => {
                  setPendingGoogle({ idToken, name: profile?.name, email: profile?.email });
                  setProfileOpen(true);
                }} />
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
