import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";

export default function Settings() {
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [provider, setProvider] = useState<"password" | "google" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const e = localStorage.getItem("user_email") || "";
    const n = localStorage.getItem("user_name") || "";
    setEmail(e);
    setName(n);
    const token = localStorage.getItem("jwt");
    if (!token) return;
    import("@/lib/todo-api").then(({ AuthAPI }) => {
      AuthAPI.me()
        .then((data) => {
          if (data?.auth_provider === "password" || data?.auth_provider === "google") setProvider(data.auth_provider);
          if (data?.name) setName(data.name);
          if (data?.email) setEmail(data.email);
        })
        .catch(() => {});
    });
  }, []);

  async function saveName() {
    setLoading(true);
    try {
      const { AuthAPI } = await import("@/lib/todo-api");
      await AuthAPI.updateMe({ name });
      localStorage.setItem("user_name", name);
      alert("Name updated");
    } catch (e: any) {
      alert(e.message || "Failed to update name");
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(form: { current_password?: string; new_password: string; confirm_password: string }, isSet: boolean) {
    setLoading(true);
    try {
      const { AuthAPI } = await import("@/lib/todo-api");
      if (isSet) await AuthAPI.setPassword({ new_password: form.new_password, confirm_password: form.confirm_password });
      else await AuthAPI.changePassword({ current_password: form.current_password as string, new_password: form.new_password, confirm_password: form.confirm_password });
      alert(isSet ? "Password set successfully" : "Password updated successfully");
    } catch (e: any) {
      alert(e.message || "Password update failed");
    } finally {
      setLoading(false);
    }
  }

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const pwdError = newPwd && !strong.test(newPwd) ? "Must be 8+ chars, include upper, lower, number, special" : null;
  const canChange = !loading && newPwd && confirmPwd && newPwd === confirmPwd && !pwdError && (provider !== "google" ? !!currentPwd : true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50">
      <Navbar />
      <main className="container py-8">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Settings</h1>
        <Tabs defaultValue="profile" className="max-w-2xl">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input value={email} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <Button onClick={saveName} disabled={loading || !name.trim()}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader><CardTitle>Security</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                {provider !== "google" && (
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label>Current password</Label>
                      <Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>New password</Label>
                      <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Strong password" />
                      {pwdError ? <p className="text-xs text-destructive">{pwdError}</p> : null}
                    </div>
                    <div className="grid gap-2">
                      <Label>Confirm new password</Label>
                      <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
                    </div>
                    <div>
                      <Button disabled={!canChange} onClick={() => changePassword({ current_password: currentPwd, new_password: newPwd, confirm_password: confirmPwd }, false)}>Change Password</Button>
                    </div>
                  </div>
                )}
                {provider === "google" && (
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label>New password</Label>
                      <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Strong password" />
                      {pwdError ? <p className="text-xs text-destructive">{pwdError}</p> : null}
                    </div>
                    <div className="grid gap-2">
                      <Label>Confirm new password</Label>
                      <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
                    </div>
                    <div>
                      <Button disabled={!canChange} onClick={() => changePassword({ new_password: newPwd, confirm_password: confirmPwd }, true)}>Set Password</Button>
                    </div>
                  </div>
                )}
                {provider === null && (
                  <p className="text-sm text-muted-foreground">Loading account details…</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
