import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Kinetiq Motion Studio" },
      {
        name: "description",
        content:
          "Sign in to Kinetiq to save 3D rigs, skin setups and motion-capture retargets to your cloud scene library.",
      },
      { property: "og:title", content: "Sign in · Kinetiq Motion Studio" },
      {
        property: "og:description",
        content: "Access your cloud scene library of rigs, skins and mocap retargets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created — check your inbox if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw new Error("Google sign-in failed");
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="grid min-h-screen place-items-center bg-background px-4"
      style={{ background: "var(--gradient-viewport)" }}
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-[var(--panel)] p-6 shadow-[var(--shadow-float)]">
        <div className="mb-5 flex items-center gap-2">
          <span className="signal-fill grid h-7 w-7 place-items-center rounded text-xs font-black">
            K
          </span>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Kinetiq Motion Studio</h1>
            <p className="label-xs">cloud scene library</p>
          </div>
        </div>

        <button
          onClick={google}
          disabled={busy}
          className="mb-4 w-full rounded-md border border-border bg-secondary py-2 text-xs font-medium transition-colors hover:border-primary/50 disabled:opacity-60"
        >
          Continue with Google
        </button>

        <div className="mb-4 flex items-center gap-2">
          <span className="h-px flex-1 bg-border" />
          <span className="label-xs">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="label-xs">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-[var(--panel-raised)] px-2.5 py-2 text-sm focus:border-primary/60 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="label-xs">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-[var(--panel-raised)] px-2.5 py-2 text-sm focus:border-primary/60 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="signal-fill w-full rounded-md py-2 text-sm font-semibold disabled:opacity-60"
          >
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
        </button>

        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground"
        >
          Continue to the studio without an account
        </button>
      </div>
    </main>
  );
}
