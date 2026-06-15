import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Leaf } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/app" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — EcoTrace" },
      { name: "description", content: "Sign in to EcoTrace to track your carbon footprint and get personalized AI guidance." },
    ],
  }),
  component: AuthPage,
});

const HERO = "https://lh3.googleusercontent.com/aida-public/AB6AXuCoEWnq2rgbNlk9eNE2FtcdNVqAnR96QIGmAvVtGn45Gd0a98YLzyUT-_cXjIdyWuAxeiMAJ8XxIlVgswaZaaa27YVK9n4gqzSLMfMHbEvVEltqLO8r4M9pKJe2km5__PQ43b2ibKm_HyTkrUNXLQP1xMvJl92dUpI0RW3a7vVkyq5uV4fdv-5aYo7aZ4U7d-ebEjf5DgqkUqzCmIHtv3pr2KG5A9rfeOzXLGZ8NvfHEtv-_y8fdPDllF_ZM8Tabs2LhLciKQG6xGc";

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
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
          email, password,
          options: { emailRedirectTo: window.location.origin + "/app" },
        });
        if (error) throw error;
        toast.success("Account created.");
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
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app" });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  }

  return (
    <main className="w-full min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left — visual */}
      <section className="relative hidden md:flex md:w-1/2 lg:w-3/5 overflow-hidden bg-primary-container">
        <img src={HERO} alt="" className="absolute inset-0 w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/85 via-primary/40 to-transparent" />
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-10">
          <div className="flex items-center gap-3">
            <span className="size-10 bg-tertiary-fixed rounded-lg grid place-items-center">
              <Leaf className="size-5 text-primary" />
            </span>
            <span className="text-2xl font-bold text-white">EcoTrace</span>
          </div>
          <div className="max-w-xl space-y-6">
            <div className="glass-dark p-7 rounded-xl space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">Quantifying impact for a sustainable future.</h1>
              <p className="text-base text-white/80">Join thousands measuring their environmental footprint with scientific rigor and an organic growth mindset.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-dark p-4 rounded-lg">
                <span className="block text-[11px] text-tertiary-fixed uppercase tracking-wider mb-1 font-semibold">Total Offset</span>
                <span className="block text-xl font-bold text-white">1.2M Tons</span>
              </div>
              <div className="glass-dark p-4 rounded-lg">
                <span className="block text-[11px] text-tertiary-fixed uppercase tracking-wider mb-1 font-semibold">Global Reach</span>
                <span className="block text-xl font-bold text-white">142 Countries</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-white/60">© EcoTrace. Environmental Stewardship through Data.</div>
        </div>
      </section>

      {/* Right — form */}
      <section className="relative w-full md:w-1/2 lg:w-2/5 min-h-screen flex flex-col items-center justify-center px-6 md:px-10 bg-surface">
        <div className="md:hidden absolute top-6 left-6 flex items-center gap-2">
          <span className="size-8 rounded-md bg-primary text-primary-foreground grid place-items-center"><Leaf className="size-4" /></span>
          <span className="text-lg font-bold text-primary">EcoTrace</span>
        </div>
        <Link to="/" className="absolute top-6 right-6 flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition group">
          <span>Back to Home</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>

        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{mode === "in" ? "Welcome back" : "Create your account"}</h2>
            <p className="mt-1.5 text-on-surface-variant">{mode === "in" ? "Sign in to continue tracking your impact." : "Start measuring your footprint in seconds."}</p>
          </div>

          <button
            onClick={google}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-outline-variant rounded-lg text-sm font-semibold text-foreground hover:bg-surface-container-low transition active:scale-[0.99] bg-card custom-shadow"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-outline-variant" />
            <span className="mx-4 text-xs text-outline uppercase tracking-widest font-semibold">or email</span>
            <div className="flex-grow border-t border-outline-variant" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
              <Input id="email" type="email" required placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-11 bg-card" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                {mode === "in" && <a href="#" className="text-xs text-primary hover:underline font-semibold">Forgot password?</a>}
              </div>
              <div className="relative">
                <Input id="password" type={show ? "text" : "password"} required minLength={6} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} className="h-11 bg-card pr-10" />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant">
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary-container rounded-lg font-bold custom-shadow">
              {loading ? "…" : mode === "in" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-on-surface-variant">
            {mode === "in" ? "Don't have an account? " : "Already have one? "}
            <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="text-primary font-bold hover:underline">
              {mode === "in" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
