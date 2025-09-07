import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    google?: any;
  }
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" className="mr-2">
      <path fill="#FFC107" d="M43.6 20.5h-1.6V20H24v8h11.3C33.8 32.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 19.3-8.9 19.3-20c0-1.3-.1-2.1-.7-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.2 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.1C29.5 35.2 26.9 36 24 36c-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.6 39.7 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5h-1.6V20H24v8h11.3c-1.1 3.1-3.5 5.5-6.5 6.8l6.2 5.1C37.4 37.9 40 31.9 40 24c0-1.3-.1-2.1-.4-3.5z"/>
    </svg>
  );
}

type CredentialPayload = { idToken: string; profile?: { email?: string; name?: string; picture?: string } };

export default function GoogleButton({ label = "Continue with Google", onSuccess, mode = "auto", onCredential }: { label?: string; onSuccess?: () => void; mode?: "auto" | "defer"; onCredential?: (cred: CredentialPayload) => void }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    const id = "google-accounts-sdk";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = () => setReady(true);
      s.onerror = () => setError("Failed to load Google SDK");
      document.head.appendChild(s);
    } else {
      setReady(true);
    }
  }, []);

  function decodeJwt(token: string): any | undefined {
    try {
      const [, payload] = token.split(".");
      const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(json);
    } catch {
      return undefined;
    }
  }

  useEffect(() => {
    if (!ready || !clientId) return;
    if (!window.google) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          const id_token = response?.credential;
          if (!id_token) { setError("Google id_token missing"); return; }
          const claims = decodeJwt(id_token);
          const profile = claims ? { email: claims.email, name: claims.name || claims.given_name || claims.family_name, picture: claims.picture } : undefined;

          if (mode === "defer") {
            try { onCredential && onCredential({ idToken: id_token, profile }); } catch {}
            return;
          }

          try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/google-login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id_token }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              const msg = (data?.message || data?.error || `Request failed: ${res.status}`) as string;
              if (/Additional info required/i.test(msg)) {
                setError("Please complete sign up (name, DOB, gender) on the Signup page.");
              } else if (/auth_provider|password/i.test(msg)) {
                setError("This email is registered with password. Use email & password to log in.");
              } else {
                setError(msg);
              }
              return;
            }
            const token: string | undefined = data.token || data.access_token || data.jwt || data.id_token;
            if (token) localStorage.setItem("jwt", token);
            if (onSuccess) onSuccess();
            else window.location.assign("/");
          } catch (e: any) {
            setError(e.message || "Google login failed");
          }
        },
      });
      if (divRef.current) {
        window.google.accounts.id.renderButton(divRef.current, {
          type: "standard",
          theme: "filled_blue",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "left",
          width: 340,
        });
      }
    } catch (e: any) {
      setError(e.message || "Google init failed");
    }
  }, [ready, clientId, onSuccess]);

  const fallbackClick = () => {
    if (!clientId) {
      alert("Missing VITE_GOOGLE_CLIENT_ID. Please configure it in settings.");
      return;
    }
    if (ready && window.google) {
      try { window.google.accounts.id.prompt(); } catch {}
    }
  };

  return (
    <div className="grid gap-2">
      {clientId ? (
        <>
          <div ref={divRef} />
          {!ready ? (
            <Button type="button" variant="secondary" onClick={fallbackClick}>
              <GoogleIcon /> {label}
            </Button>
          ) : null}
        </>
      ) : (
        <Button type="button" variant="secondary" onClick={fallbackClick}>
          <GoogleIcon /> {label}
        </Button>
      )}
      {error ? <div className="text-xs text-destructive">{error}</div> : null}
    </div>
  );
}
