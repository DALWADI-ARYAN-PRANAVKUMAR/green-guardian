import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verdant — Cut your carbon, one choice at a time" },
      { name: "description", content: "Track your daily carbon footprint and get personalized, no-judgment guidance from an AI climate coach." },
      { property: "og:title", content: "Verdant — Personal carbon coach" },
      { property: "og:description", content: "Log activities, see your footprint, and get AI-driven tips that actually move the needle." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 sm:px-10 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="" width={36} height={36} />
          <span className="font-display text-lg">Verdant</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/auth"><Button className="bg-primary text-primary-foreground hover:bg-primary/90">Start free</Button></Link>
        </nav>
      </header>

      <section className="relative px-6 sm:px-10 pt-12 pb-24 max-w-6xl mx-auto">
        <div className="absolute inset-0 grain opacity-50 pointer-events-none" />
        <p className="text-xs uppercase tracking-[0.25em] text-accent-foreground bg-accent inline-block px-3 py-1 rounded-sm">A climate tool that respects your time</p>
        <h1 className="mt-6 font-display text-6xl sm:text-8xl leading-[0.85] max-w-4xl text-balance">
          Your carbon, <br /><span className="text-primary">measured.</span> <span className="text-destructive">Reduced.</span>
        </h1>
        <p className="mt-8 text-lg max-w-2xl text-muted-foreground">
          Verdant turns daily choices — what you eat, how you move, what you buy — into clear numbers, and pairs them with an AI coach that knows your patterns. No guilt. Just leverage.
        </p>
        <div className="mt-10 flex gap-3">
          <Link to="/auth"><Button className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 text-base">Start tracking →</Button></Link>
        </div>
      </section>

      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20 grid sm:grid-cols-3 gap-10">
          {[
            { k: "12.5 kg", l: "Global daily average per person" },
            { k: "5.5 kg", l: "Paris-aligned daily target by 2030" },
            { k: "~60%", l: "Of personal emissions come from food + transport" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-5xl text-accent">{s.k}</div>
              <div className="mt-2 text-sm text-primary-foreground/70">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-24 grid md:grid-cols-3 gap-8">
        {[
          { t: "Log in seconds", d: "Tap a preset — a drive, a meal, a flight. We do the carbon math." },
          { t: "See the pattern", d: "Daily, weekly, by category. Compared to global averages and climate targets." },
          { t: "Ask the coach", d: "An AI that reads your activity and gives advice grounded in what you actually do." },
        ].map((f) => (
          <div key={f.t} className="border-2 border-foreground/10 p-6 rounded-md bg-card">
            <div className="font-display text-2xl">{f.t}</div>
            <p className="mt-2 text-muted-foreground text-sm">{f.d}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border px-6 sm:px-10 py-10 text-sm text-muted-foreground flex justify-between">
        <span>© Verdant</span>
        <span>Built with Lovable</span>
      </footer>
    </div>
  );
}
