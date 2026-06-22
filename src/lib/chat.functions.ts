import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { DAILY_GLOBAL_AVG_KG, DAILY_PARIS_TARGET_KG } from "./emissions";

const SYSTEM_PROMPT = `You are the Green Guardian Carbon Assistant, a warm, pragmatic climate coach inside a personal carbon-footprint app.
You help the user understand and reduce their footprint with concrete, kind, non-judgmental guidance.

Style rules:
- Be concise. 2–5 short paragraphs or a tight bullet list.
- Ground every suggestion in the user's actual recent activity data when provided.
- Quantify impact in kg CO2e where useful (e.g. "swapping 2 beef meals saves ~13 kg").
- Prefer high-leverage actions (transport, diet, home energy) over micro-tips.
- If the user asks something off-topic, gently steer back.
- Never invent activity data the user did not log.
- Use plain Markdown only. No code blocks unless showing data.`;

function summarize(activities: Array<{ category: string; action: string; quantity: number; unit: string; kg_co2e: number; occurred_at: string }>) {
  if (activities.length === 0) return "The user has not logged any activities yet.";
  const today = new Date().toISOString().slice(0, 10);
  const last7Cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  let todayKg = 0,
    weekKg = 0;
  const byCat: Record<string, number> = {};
  for (const a of activities) {
    const kg = Number(a.kg_co2e);
    if (a.occurred_at === today) todayKg += kg;
    if (a.occurred_at >= last7Cutoff) {
      weekKg += kg;
      byCat[a.category] = (byCat[a.category] ?? 0) + kg;
    }
  }
  const top = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .map(([c, v]) => `${c}: ${v.toFixed(1)} kg`)
    .join(", ");
  const recent = activities
    .slice(0, 12)
    .map((a) => `- ${a.occurred_at}: ${a.action} ×${a.quantity}${a.unit} → ${Number(a.kg_co2e).toFixed(2)} kg`)
    .join("\n");
  return `Today: ${todayKg.toFixed(1)} kg CO2e. Last 7 days: ${weekKg.toFixed(1)} kg.
Breakdown (7d): ${top || "n/a"}.
Reference: global average ~${DAILY_GLOBAL_AVG_KG} kg/day; Paris-aligned target ~${DAILY_PARIS_TARGET_KG} kg/day.

Recent log:
${recent}`;
}

const Message = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) });

export const listChatMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ message: z.string().min(1).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");

    // Insert user message
    const { error: insErr } = await context.supabase
      .from("chat_messages")
      .insert({ user_id: context.userId, role: "user", content: data.message });
    if (insErr) throw new Error(insErr.message);

    // Build conversation context
    const [{ data: history }, { data: acts }] = await Promise.all([
      context.supabase
        .from("chat_messages")
        .select("role, content")
        .order("created_at", { ascending: true })
        .limit(40),
      context.supabase
        .from("activities")
        .select("category, action, quantity, unit, kg_co2e, occurred_at")
        .order("occurred_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60),
    ]);

    const messages = (history ?? []).map((m) => Message.parse({ role: m.role, content: m.content }));
    const contextBlock = summarize(acts ?? []);

    const provider = createLovableAiGatewayProvider(key);
    try {
      const result = await generateText({
        model: provider("google/gemini-3-flash-preview"),
        system: `${SYSTEM_PROMPT}\n\n[USER CONTEXT]\n${contextBlock}`,
        messages,
      });
      const reply = result.text.trim() || "I'm here — could you rephrase that?";

      await context.supabase
        .from("chat_messages")
        .insert({ user_id: context.userId, role: "assistant", content: reply });

      return { reply };
    } catch (e: unknown) {
      const err = e as { statusCode?: number; status?: number; message?: string };
      const code = err.statusCode ?? err.status;
      let msg = "Sorry — I couldn't reach the AI right now. Try again in a moment.";
      if (code === 429) msg = "Too many requests right now. Please wait a moment and try again.";
      if (code === 402) msg = "AI credits are exhausted for this workspace. Please add credits in the Lovable workspace settings.";
      await context.supabase
        .from("chat_messages")
        .insert({ user_id: context.userId, role: "assistant", content: msg });
      return { reply: msg };
    }
  });

export const clearChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("chat_messages").delete().eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
