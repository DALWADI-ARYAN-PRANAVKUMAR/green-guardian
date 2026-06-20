import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar, MobileTopBar, MobileBottomNav } from "@/components/app-sidebar";
import { Mail, BookOpen, MessageCircle, Leaf } from "lucide-react";

export const Route = createFileRoute("/_authenticated/support")({
  ssr: false,
  head: () => ({ meta: [{ title: "Support — EcoTrace" }] }),
  component: SupportPage,
});

const FAQS = [
  {
    q: "How are emissions calculated?",
    a: "Each activity uses a published emission factor (kg CO₂e per unit) drawn from sources like the UK DEFRA and EPA. Your total is the sum of activity quantity × factor.",
  },
  {
    q: "What is a Paris-aligned daily target?",
    a: "To stay within 1.5 °C of warming, the per-person budget is roughly 2.3 tonnes CO₂e/year — about 6.3 kg/day. EcoTrace compares your daily total to that figure.",
  },
  {
    q: "Is my data private?",
    a: "Yes. All activities and chats are stored under row-level security — only you can read or modify your records.",
  },
  {
    q: "How does the AI Assistant work?",
    a: "Your last 60 activities are summarised into a context block and sent to a large language model. The assistant gives quantified, personal suggestions — never generic tips.",
  },
];

function SupportPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileTopBar title="Support" />
        <main className="flex-1 px-4 md:px-10 py-8 max-w-4xl w-full mx-auto pb-24 lg:pb-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Support & Help</h1>
            <p className="text-on-surface-variant mt-1">Find answers or reach out — we usually reply within a day.</p>
          </header>

          <section className="grid sm:grid-cols-3 gap-4 mb-10">
            <a href="mailto:hello@ecotrace.app" className="bg-card border border-outline-variant rounded-2xl p-5 hover:border-primary transition custom-shadow">
              <Mail className="size-5 text-primary mb-3" />
              <p className="font-bold text-foreground">Email us</p>
              <p className="text-sm text-on-surface-variant mt-1">hello@ecotrace.app</p>
            </a>
            <a href="/coach" className="bg-card border border-outline-variant rounded-2xl p-5 hover:border-primary transition custom-shadow">
              <MessageCircle className="size-5 text-primary mb-3" />
              <p className="font-bold text-foreground">Ask the AI</p>
              <p className="text-sm text-on-surface-variant mt-1">Your personal carbon coach</p>
            </a>
            <a href="https://ipcc.ch/sr15/" target="_blank" rel="noreferrer" className="bg-card border border-outline-variant rounded-2xl p-5 hover:border-primary transition custom-shadow">
              <BookOpen className="size-5 text-primary mb-3" />
              <p className="font-bold text-foreground">Methodology</p>
              <p className="text-sm text-on-surface-variant mt-1">Emission factor sources</p>
            </a>
          </section>

          <section className="bg-card border border-outline-variant rounded-2xl p-6 custom-shadow">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Leaf className="size-5 text-primary" /> Frequently asked
            </h2>
            <dl className="divide-y divide-outline-variant">
              {FAQS.map((f) => (
                <div key={f.q} className="py-4">
                  <dt className="font-semibold text-foreground">{f.q}</dt>
                  <dd className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
