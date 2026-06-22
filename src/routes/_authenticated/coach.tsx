import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send, Trash2, MoreVertical, Sparkles, Leaf, Thermometer, Truck, Zap, TrendingDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { AppSidebar, MobileTopBar, MobileBottomNav } from "@/components/app-sidebar";
import { listChatMessages, sendChatMessage, clearChat } from "@/lib/chat.functions";
import { listActivities } from "@/lib/activities.functions";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({ meta: [{ title: "AI Assistant — Green Guardian" }] }),
  component: Coach,
});

const SUGGESTIONS = [
  "How am I doing this week?",
  "What's my biggest emission source?",
  "Give me 3 easy swaps to try tomorrow.",
  "Help me set a realistic daily goal.",
];

function Coach() {
  const qc = useQueryClient();
  const listFn = useServerFn(listChatMessages);
  const sendFn = useServerFn(sendChatMessage);
  const clearFn = useServerFn(clearChat);
  const activitiesFn = useServerFn(listActivities);

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({ queryKey: ["chat"], queryFn: () => listFn({ data: undefined }) });
  const { data: activities = [] } = useQuery({ queryKey: ["activities"], queryFn: () => activitiesFn({ data: undefined }) });

  const sendMut = useMutation({
    mutationFn: (message: string) => sendFn({ data: { message } }),
    onMutate: () => setInput(""),
    onSettled: () => qc.invalidateQueries({ queryKey: ["chat"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const clearMut = useMutation({
    mutationFn: () => clearFn({ data: undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["chat"] }); toast.success("Cleared"); },
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sendMut.isPending]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const v = input.trim();
    if (!v || sendMut.isPending) return;
    sendMut.mutate(v);
  }

  // insights
  const weekCutoff = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const week = activities.filter((a) => a.occurred_at >= weekCutoff);
  const weekKg = week.reduce((s, a) => s + Number(a.kg_co2e), 0);
  const goal = 5.5 * 7; // weekly Paris target
  const pct = Math.max(0, Math.min(100, Math.round((1 - weekKg / Math.max(goal, 0.1)) * 100)));
  const energy = week.filter((a) => a.category === "energy").reduce((s, a) => s + Number(a.kg_co2e), 0);
  const food = week.filter((a) => a.category === "food").reduce((s, a) => s + Number(a.kg_co2e), 0);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <MobileTopBar title="AI Assistant" />
        <div className="flex-1 flex flex-col md:flex-row bg-surface min-h-0">
          {/* Chat pane */}
          <section className="flex-1 flex flex-col min-w-0 bg-surface-bright">
            <div className="p-5 flex items-center justify-between border-b border-outline-variant/40">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary-container grid place-items-center text-on-primary-container">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary">Carbon Assistant</h2>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-tertiary-fixed-dim animate-pulse" /> Online &amp; analyzing your data
                  </p>
                </div>
              </div>
              <button onClick={() => clearMut.mutate()} disabled={messages.length === 0} className="p-2 hover:bg-surface-container rounded-full transition disabled:opacity-30" aria-label="Clear conversation">
                <Trash2 className="size-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {messages.length === 0 && !sendMut.isPending && (
                <div className="text-center py-12">
                  <div className="inline-grid place-items-center size-14 rounded-full bg-primary-container text-on-primary-container mb-4">
                    <Sparkles className="size-6" />
                  </div>
                  <h1 className="text-2xl font-bold text-primary">How can I help today?</h1>
                  <p className="mt-2 text-on-surface-variant max-w-md mx-auto text-sm">
                    I read your logged activity and give concrete, quantified advice. Ask anything.
                  </p>
                  <div className="mt-6 grid sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => sendMut.mutate(s)}
                        className="text-left text-sm bg-card border border-outline-variant hover:border-primary/60 rounded-lg p-3 transition">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className={m.role === "user" ? "flex gap-3 max-w-[85%] ml-auto flex-row-reverse" : "flex gap-3 max-w-[90%]"}>
                  <div className={`size-8 rounded-full grid place-items-center shrink-0 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary-container text-primary"}`}>
                    {m.role === "user" ? <span className="text-xs font-bold">You</span> : <Leaf className="size-4" />}
                  </div>
                  {m.role === "user" ? (
                    <div className="bg-primary-container text-on-primary-container p-3.5 rounded-2xl rounded-tr-none shadow-sm">
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ) : (
                    <div className="bg-surface-container p-4 rounded-2xl rounded-tl-none border border-outline-variant/30 shadow-sm prose prose-sm prose-neutral max-w-none prose-headings:font-bold prose-headings:text-primary prose-p:my-2 prose-ul:my-2 prose-li:my-0">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}

              {sendMut.isPending && (
                <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                  <span className="size-2 rounded-full bg-primary animate-pulse" />
                  <span className="size-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="size-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
                  <span className="ml-1">Thinking…</span>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form onSubmit={submit} className="p-5 border-t border-outline-variant/40">
              <div className="relative flex items-center bg-surface-container-high rounded-2xl p-2 gap-2 border border-outline-variant focus-within:ring-2 focus-within:ring-primary/20">
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your footprint…" aria-label="Message"
                  className="flex-1 bg-transparent border-none focus:outline-none text-base py-2 px-2" />
                <button type="submit" disabled={!input.trim() || sendMut.isPending} className="bg-primary text-primary-foreground size-10 rounded-xl grid place-items-center hover:scale-105 active:scale-95 transition disabled:opacity-40 disabled:hover:scale-100">
                  <Send className="size-4" />
                  <span className="sr-only">Send</span>
                </button>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-2 text-center">Advice is grounded in your logged activity. Estimates are approximations.</p>
            </form>
          </section>

          {/* Insights panel */}
          <aside className="hidden md:flex md:w-80 lg:w-96 bg-surface-container-low border-l border-outline-variant p-5 overflow-y-auto flex-col gap-5">
            <h3 className="text-lg font-bold text-primary">Assistant Insights</h3>

            <div className="bg-card rounded-2xl p-4 border border-secondary-container custom-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Weekly Target</p>
                  <h4 className="text-xl font-bold text-foreground">{pct}% on track</h4>
                </div>
                <TrendingDown className="size-5 text-on-tertiary-container" />
              </div>
              <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                <div className="bg-tertiary-container h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-on-surface-variant mt-2">{weekKg.toFixed(1)} kg logged vs {goal.toFixed(0)} kg Paris-aligned weekly budget.</p>
            </div>

            <div className="grid gap-2">
              <div className="bg-surface-container-high p-3.5 rounded-xl flex items-center gap-4 border border-outline-variant/50">
                <div className="size-11 rounded-full bg-card grid place-items-center text-primary shadow-sm">
                  <Zap className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Energy this week</p>
                  <p className="font-bold text-lg">{energy.toFixed(1)} kg</p>
                </div>
              </div>
              <div className="bg-surface-container-high p-3.5 rounded-xl flex items-center gap-4 border border-outline-variant/50">
                <div className="size-11 rounded-full bg-card grid place-items-center text-primary shadow-sm">
                  <Leaf className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Food this week</p>
                  <p className="font-bold text-lg">{food.toFixed(1)} kg</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-on-surface-variant px-1 mb-2">Top Recommendations</h4>
              <div className="space-y-2">
                {[
                  { Icon: Thermometer, label: "Lower thermostat by 1°C" },
                  { Icon: Truck, label: "Consolidate weekly deliveries" },
                  { Icon: Leaf, label: "Swap 2 meat meals for vegan" },
                ].map((r) => (
                  <button key={r.label} onClick={() => sendMut.mutate(`Tell me more about: ${r.label}`)} className="w-full flex items-center justify-between p-3 bg-card hover:bg-primary-container hover:text-on-primary-container rounded-xl border border-secondary-container transition group">
                    <span className="flex items-center gap-3">
                      <r.Icon className="size-4 text-primary group-hover:text-on-primary-container" />
                      <span className="text-sm text-left">{r.label}</span>
                    </span>
                    <MoreVertical className="size-4 text-on-surface-variant group-hover:text-on-primary-container" />
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
        <MobileBottomNav />
      </main>
    </div>
  );
}
