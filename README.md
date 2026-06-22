# Green Guardian — Personal Carbon Footprint Tracker

> A full-stack web application that helps individuals quantify, understand, and reduce their environmental impact through smart activity logging, real-time analytics, and an AI-powered carbon coach.

🌱 **Live demo:** [https://green-guardian1.lovable.app/](https://green-guardian1.lovable.app/)

---

## 1. Chosen Vertical

**Climate Tech / Environmental Impact Tracking**

Green Guardian sits at the intersection of **personal productivity** and **environmental stewardship**. The vertical was chosen because:

- **High real-world relevance**: Every person generates a carbon footprint through transport, food, energy, and consumption choices.
- **Data-driven behavior change**: Research shows that quantified self-tracking measurably shifts habits when feedback is immediate and personalized.
- **AI augmentation potential**: A generic "green tips" article is forgettable; advice grounded in a user's actual logged data is actionable.

The product targets environmentally conscious individuals who want accountability and practical guidance without judgment.

---

## 2. Approach & Logic

### Design Philosophy
- **Transparency over perfection**: Users see raw kg CO₂e numbers, not vague scores or hidden formulas.
- **Contextual intelligence**: The AI coach doesn't give generic advice — it reads the user's last 60 activities and tailors every response.
- **Benchmark-driven goals**: Daily totals are compared against a Paris-aligned climate target (~5.5 kg/day) and the global average (~12.5 kg/day), making abstract numbers concrete.

### Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **TanStack Start (React + SSR)** | File-based routing, type-safe navigation, and server functions in one framework. Eliminates the need for a separate REST API layer. |
| **Server Functions (`createServerFn`)** | Business logic (emission calculations, AI calls) runs server-side so users cannot spoof `kg_co2e` values. |
| **Row-Level Security (RLS)** | Every database table is scoped to `auth.uid()`. Users can never read or mutate another user's data. |
| **AI Gateway with context injection** | Before every chat turn, the server summarises the user's last 7 days of activity and injects it into the system prompt. This gives the LLM real memory without expensive RAG infrastructure. |
| **Preset-based logging** | Instead of asking users to know emission factors, we provide 20 curated presets (e.g., "Petrol car", "Beef meal") sourced from DEFRA/EPA data. One tap → instant calculation. |

---

## 3. How the Solution Works

### 3.1 User Flow

```
Landing Page ──► Sign Up / Log In ──► Dashboard
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
              Log Activity           AI Coach Chat           Settings / Support
                    │                     │
                    └──────────► History Log (all activities)
```

### 3.2 Core Features

#### Activity Logging
- Users pick from **20 presets** across 5 categories: Transport, Food, Energy, Shopping, Waste.
- The server computes `kg_co2e = factor × quantity` using verified emission coefficients.
- Each log is stored with full audit fields: `category`, `action`, `quantity`, `unit`, `kg_co2e`, `occurred_at`, `notes`.

#### Dashboard Analytics
- **Carbon Summary**: Stacked bar chart (Energy / Transport / Food) over the last 7 days.
- **Efficiency Score**: A 0–100 score derived from `todayKg / dailyGoal`. Higher = closer to target.
- **Benchmark Panel**: Compares the user's 30-day total against the global average and the Paris-aligned target.
- **Smart Recommendations**: Surfaces the user's highest-emission category and suggests talking to the AI coach.

#### AI Carbon Coach
- Multi-turn conversational interface.
- Every user message triggers a server function that:
  1. Persists the message to `chat_messages`.
  2. Fetches the last **40 chat turns** (conversation memory).
  3. Fetches the last **60 activities** (behavioral context).
  4. Summarises activity data into a compact context block (today's total, 7-day breakdown, recent log).
  5. Sends the full prompt + context to a Gemini model via the Lovable AI Gateway.
  6. Persists the assistant reply and returns it to the client.
- Graceful degradation on 429/402 errors with user-friendly messages stored in history.

#### Settings & Support
- **Edit Profile**: Update display name.
- **Change Password**: Secure password update via Supabase Auth.
- **Wipe Activities**: One-click deletion of all logged data with confirmation.
- **Support Page**: FAQ and contact channel for user assistance.

### 3.3 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start (React 19 + Vite 7 + SSR) |
| Styling | Tailwind CSS v4 with semantic design tokens |
| UI Components | Radix UI primitives + shadcn/ui patterns |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth with email/password + Google OAuth |
| Server Logic | `createServerFn` with Zod input validation |
| AI | Lovable AI Gateway (Gemini 3 Flash) |
| Charts | Recharts |
| Icons | Lucide React |
| Testing | Vitest (unit tests for emission math) |

### 3.4 Data Model

```sql
profiles
  id (uuid, PK)          → links to auth.users
  display_name (text)
  daily_goal_kg (float)  → default 10.0

activities
  id (uuid, PK)
  user_id (uuid, FK)     → RLS: user can only see own rows
  category (enum)
  action (text)
  quantity (float)
  unit (text)
  kg_co2e (float)        → server-computed, immutable
  occurred_at (date)
  notes (text)

chat_messages
  id (uuid, PK)
  user_id (uuid, FK)
  role (user | assistant)
  content (text)
  created_at (timestamp)
```

### 3.5 Security Model

- **RLS policies**: Every `SELECT / INSERT / UPDATE / DELETE` on `activities`, `profiles`, and `chat_messages` is gated to `auth.uid() = user_id`.
- **Input validation**: All server functions use Zod schemas to enforce type safety and bound checks (e.g., `quantity` capped at 100,000).
- **Server-side computation**: Carbon math runs in the `createServerFn` handler, not the client. A malicious client cannot send a fake `kg_co2e` value.
- **Environment isolation**: AI keys and service-role credentials are server-only; the browser receives only the publishable Supabase key.
- **HIBP protection**: Passwords are checked against Have I Been Pwned during sign-up to prevent the use of leaked credentials.

---

## 4. Assumptions Made

1. **Single-user context per account**: The app is designed for personal tracking. Household or team aggregation is out of scope.

2. **Preset coverage is sufficient**: The 20 emission presets capture the highest-leverage personal choices (car, bus, beef, electricity, etc.). Users cannot add custom factors; this keeps calculations trustworthy but limits niche use cases.

3. **Static emission factors**: Factors are based on UK DEFRA 2023 / EPA averages and do not vary by country, grid mix, or season. The app trades precision for simplicity and broad applicability.

4. **Daily goal as primary metric**: Users are nudged toward a daily kg target rather than a monthly or annual budget, because daily feedback loops are more effective for habit formation.

5. **AI as a coach, not an oracle**: The assistant gives directional guidance ("swapping 2 beef meals saves ~13 kg") rather than certified carbon audits. A disclaimer notes that estimates are approximations.

6. **Modern browser target**: The app assumes a modern browser with ES2022+ support, as the stack uses React 19, Tailwind v4, and native CSS features.

---

## 5. Getting Started (Development)

```bash
# Install dependencies
bun install

# Start the dev server
bun run dev

# Run tests
bunx vitest run
```

### Required Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
LOVABLE_API_KEY=
```

---

## 6. Docker (Self-Hosted)

A production-ready Dockerfile is included. It compiles the app using Bun and serves the built Nitro `node-server` output with Node.js.

```bash
# Build image (pass VITE_* build args so client env vars are inlined)
docker build \
  --build-arg VITE_SUPABASE_URL="https://your-project.supabase.co" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key" \
  --build-arg VITE_SUPABASE_PROJECT_ID="your-project-id" \
  -t green-guardian:latest .

# Run container (supply runtime secrets)
docker run -p 3000:3000 \
  -e LOVABLE_API_KEY="your-lovable-api-key" \
  green-guardian:latest
```

The container exposes port **3000** by default.

---

## 6. Project Structure

```
src/
  routes/              # File-based routes (TanStack Router)
    _authenticated/    # Protected app pages (dashboard, coach, log, settings, support)
    auth.tsx           # Login / signup page
    index.tsx          # Marketing landing page
  lib/
    emissions.ts       # Carbon factors, presets, calculation logic
    emissions.test.ts  # Unit tests for emission math
    activities.functions.ts  # Server functions: CRUD for activities + profile
    chat.functions.ts  # Server functions: chat history, AI inference
  components/
    app-sidebar.tsx    # Navigation sidebar + mobile nav
    ui/                # shadcn/ui component primitives
  integrations/
    supabase/          # Auth middleware, typed client, attacher
  styles.css           # Global theme tokens (Tailwind v4)
```

---

*Built with Lovable + TanStack Start.*
