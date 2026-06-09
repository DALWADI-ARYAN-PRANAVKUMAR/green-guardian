import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/app" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — Verdant" },
      { name: "description", content: "Sign in to Verdant, your personal carbon footprint coach." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") window.location.assign("/app");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/app" },
        });
        if (error) throw error;
        toast.success("Account created. You're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app" });
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative overflow-hidden bg-primary text-primary-foreground p-12 flex-col justify-between">
        <div className="absolute inset-0 grain opacity-40" />
        <Link to="/" className="relative flex items-center gap-3">
          <img src={logo} alt="" width={36} height={36} className="rounded" />
          <span className="font-display text-lg">Verdant</span>
        </Link>
        <div className="relative">
          <h1 className="font-display text-6xl xl:text-7xl leading-[0.9] text-balance">
            Cut your carbon. <span className="text-accent">One choice</span> at a time.
          </h1>
          <p className="mt-6 text-primary-foreground/80 max-w-md">
            Log what you do. See what it costs the planet. Get personalized, no-judgment guidance from an AI coach trained on real climate data.
          </p>
        </div>
        <div className="relative text-xs uppercase tracking-widest text-primary-foreground/60">
          Built for the next 7 years.
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <img src={logo} alt="" width={36} height={36} />
            <span className="font-display text-lg">Verdant</span>
          </div>
          <h2 className="font-display text-3xl">{mode === "in" ? "Welcome back" : "Start tracking"}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "in" ? "Sign in to keep your streak." : "Create an account in seconds. No credit card."}
          </p>

          <Button onClick={google} variant="outline" className="w-full mt-6 h-11 rounded-md border-2">
            Continue with Google
          </Button>
          <div className="relative my-6 text-center text-xs uppercase tracking-widest text-muted-foreground">
            <span className="bg-background px-3 relative z-10">or</span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? "…" : mode === "in" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 text-sm text-muted-foreground hover:text-foreground underline">
            {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
