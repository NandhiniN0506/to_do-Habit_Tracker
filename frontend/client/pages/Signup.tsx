import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button, Input, Label, Select, SelectItem } from "@/components/ui";

interface FormData {
  email: string;
  password: string;
  confirm_password: string;
  name?: string;
  dob?: string;
  gender?: string;
}

export default function Signup() {
  const { register, handleSubmit } = useForm<FormData>();
  const [googleExtra, setGoogleExtra] = useState<{ idToken: string } | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ------------------- Normal Signup -------------------
  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Signup failed");
      alert("Signup successful!");
      navigate("/login");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ------------------- Google Login -------------------
  const handleGoogleLogin = async (credentialResponse: { idToken: string }) => {
    const { idToken } = credentialResponse;

    // Call backend first to check if extra info is needed
    const res = await fetch("/google-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    });
    const json = await res.json();

    if (res.status === 400 && json.error.includes("Additional info")) {
      // First-time Google login → show extra form
      setGoogleExtra({ idToken });
    } else if (res.ok) {
      localStorage.setItem("jwt", json.token);
      navigate("/", { replace: true });
    } else {
      setError(json.error || "Google login failed");
    }
  };

  // ------------------- Submit Extra Google Info -------------------
  const handleGoogleExtraSubmit = async (data: FormData) => {
    if (!googleExtra) return;

    try {
      const res = await fetch("/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_token: googleExtra.idToken,
          extra_data: {
            name: data.name,
            dob: data.dob,
            gender: data.gender,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Signup failed");
      localStorage.setItem("jwt", json.token);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ------------------- Render -------------------
  return (
    <div className="max-w-md mx-auto mt-10">
      {!googleExtra ? (
        <>
          <h2>Signup</h2>
          {error && <p className="text-red-500">{error}</p>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input {...register("email")} placeholder="Email" />
            <Input type="password" {...register("password")} placeholder="Password" />
            <Input type="password" {...register("confirm_password")} placeholder="Confirm Password" />
            <Button type="submit">Signup</Button>
          </form>

          <hr className="my-4" />
          <Button onClick={() => {
            // Trigger Google login (replace with your Google login lib)
            window.google.accounts.id.prompt((res: any) => handleGoogleLogin({ idToken: res.credential }));
          }}>Signup with Google</Button>
        </>
      ) : (
        <>
          <h2>Complete Google Signup</h2>
          {error && <p className="text-red-500">{error}</p>}
          <form onSubmit={handleSubmit(handleGoogleExtraSubmit)} className="space-y-4">
            <Input {...register("name")} placeholder="Name" />
            <Input type="date" {...register("dob")} placeholder="DOB" />
            <Select {...register("gender")}>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
            </Select>
            <Button type="submit">Complete Signup</Button>
          </form>
        </>
      )}
    </div>
  );
}
