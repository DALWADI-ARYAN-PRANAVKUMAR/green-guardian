import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, Send, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { listChatMessages, sendChatMessage, clearChat } from "@/lib/chat.functions";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({ meta: [{ title: "Coach — Verdant" }] }),
  component: Coach,
});

const SUGGESTIONS = [
  "How am I doing this week?",
  "What's my biggest emission source?",
  "Give me 3 easy swaps to try tomorrow.",
  "Help me set a realistic daily goal.",
];

function Coach() {
  const router = useRouter();
  const qc = useQueryClient();
  const listFn = useServerFn(listChatMessages);
  const sendFn = useServerFn(sendChatMessage);
  const clearFn = useServerFn(clearChat);
  const [input, setInput] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["chat"],
    queryFn: () => listFn({ data: undefined }),
  });

  const sendMut = useMutation({
    mutationFn: (message: string) => sendFn({ data: { message } }),
    onMutate: () => setInput(""),
    onSettled: () => qc.invalidateQueries({ queryKey: ["chat"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const clearMut = useMutation({
    mutationFn: () => clearFn({ data: undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["chat"] }); toast.success("Conversation cleared"); },
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sendMut.isPending]);
  useEffect(() => { taRef.current?.focus(); }, [sendMut.isPending]);

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const v = input.trim();
    if (!v || sendMut.isPending) return;
    sendMut.mutate(v);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b-2 border-foreground/10 bg-background">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-3">
            <img src={logo} alt="" width={32} height={32} />
            <span className="font-display text-base">Verdant</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/app"><Button variant="ghost" size="sm">Dashboard</Button></Link>
            <Button variant="ghost" size="sm" onClick={() => clearMut.mutate()} disabled={messages.length === 0} aria-label="Clear conversation"><Trash2 className="size-4" /></Button>
            <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out"><LogOut className="size-4" /></Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-4 flex flex-col">
        <div className="flex-1 space-y-6">
          {messages.length === 0 && !sendMut.isPending && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center size-14 rounded-full bg-primary text-primary-foreground mb-4">
                <Sparkles className="size-6" />
              </div>
              <h1 className="font-display text-3xl">Meet your coach</h1>
              <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                Verdant reads your activity log and gives concrete, personalized advice. Ask anything.
              </p>
              <div className="mt-6 grid sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => sendMut.mutate(s)}
                    className="text-left text-sm border-2 border-border hover:border-primary/50 rounded-md p-3 transition">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              {m.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5">
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              ) : (
                <div className="max-w-[90%] prose prose-sm prose-neutral dark:prose-invert prose-headings:font-display prose-p:my-2 prose-ul:my-2 prose-li:my-0">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}

          {sendMut.isPending && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="size-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="size-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
              <span className="ml-1">Thinking…</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={submit} className="sticky bottom-0 mt-6 bg-background pt-2 pb-4">
          <div className="border-2 border-border focus-within:border-primary rounded-md bg-card p-2 flex items-end gap-2">
            <Textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Ask about your footprint, swaps, or anything climate…"
              rows={1}
              className="min-h-10 max-h-40 resize-none border-0 focus-visible:ring-0 shadow-none bg-transparent"
              aria-label="Message"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || sendMut.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 size-9 shrink-0">
              <Send className="size-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Verdant uses your logged activity to personalize advice. Estimates are approximations.</p>
        </form>
      </main>
    </div>
  );
}
