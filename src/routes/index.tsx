import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowRight, ChevronDown, Sparkles, BarChart3, ScrollText } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Green Guardian — Every Trace Tells a Story" },
      { name: "description", content: "Quantify your environmental impact. Track your carbon footprint, get personalized AI insights, and weave your impact into a greener collective history." },
      { property: "og:title", content: "Green Guardian — Personal carbon coach" },
      { property: "og:description", content: "Log activities, see your footprint, and get AI-driven, no-judgment guidance grounded in your real data." },
    ],
  }),
  component: Landing,
});

const HERO_BG = "https://lh3.googleusercontent.com/aida-public/AB6AXuC6Xr-OvPj0-7waLDfWMWtt1CAqwlZtF3V4hl74L--m2P9aTOyl7PrBAShLfKxkx6g4GgO6VHX6ftGLgkQXWxDi7e9ia9wRtnyfE-7vLg5lmdIWPdoBB3BGG9lNHyyTWoXrtte-GKjaBtR_99cA5UenhDEQqW62X619D3u8ZLp31e3d-2zTg5VB97mGCLuWXdL7OCKreVhiZJZrpYXWAiwmiwstI00LoztNXOuzgKlo1Xosqu2VuvfCpKgL3Vq1EHxVoEYZL8yH_vQ";

const VOICES = [
  { name: "GreenThumb", role: "Community Leader", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2hMPTYExuBOKufWeM2v1j0uRBqVRaSyQsZF5z-Thou_iFL5cm1xxKoMQgMmoBqsmwTmS4GT0-C-JD6kegBtY2CgAjJwJiseoqYK7CHSF_jJzwKHznssCkpZg4T1JImGhSHqSI9DYdXwz-KpcG0S7Q0cbzpu72-yEj03_gFptHzv7q_wj2iweXRtbrnBPNjm4SVjQCgoESfsOSghFxvb0XyoBIrLMu5NYKyui7fsKeoSJr_IfIscpWkxPKyYoB8U_OEXdsDmAkOb8" },
  { name: "EcoWarrior", role: "Forest Restoration", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBg74QI_DU5VzJ1MB7axdHrC15z1OwgmwRLfw0nx4PD3tCEjoDRfBLMIDjP8Aba9HwTwbDs-eVvnfPjh8gQstvgKP4Z_woRpsabmRplG_aYj94jsMmDTLeTT4JLtHW-Y_cir45Zgu6Emv7C_tldwFVE9uHCpX0D3roUhFNgSYuFUr2joRWPYgtF93l-zp18gQZDhTGav7PhS6T6tI1Fe2HzIx2e1HR0ujPrXuWKxmU_7NLzz8erwsWQlGD-1qyNRcBKZSdvzqmw4co" },
  { name: "OrganicChef", role: "Sustainable Gastronomy", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBS1HrIY0--OghAgj6XhF8wjhHCJGthay-nvdZG00EN0NMxdFo2LyuYZxuAW31rPO3qVMss8gX8CLTltzFSxuu0P73f4EwrSNqlb_dcx7gUbKZf_C94aDlvrQXuIpml_Y1Y_Yi8f3kg4hnKO6N5fj5218lrfkgQ8pc4AqbWR8KhmJ4pIMMX7T-DImu8jMwEmfl9siE_F5i1JK51A3n0aPh0-bElYtf_zWHS8Lh4vsAjCL8AsNmhKxDk2ZgxSLzJI3nBZOpMPssF2Ng" },
  { name: "NatureLover", role: "Wildlife Photographer", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJZ0PI-MVELH5D3IVOjCX4P0t3vyw1kq8sUVJ1rFv1W_ybL0dXkRL38lf1cg4cd3upzX1X_t4NuzhAHPYMU73G9O--jImm4Y7KRuarTweddU9YUpGQBYEjNScnQEVq_T3ZzdRSVzw5OR0n89lz7u-z4IsrzQ89FKBsS5oKHhQj0GW1tuW3Miliw7OKFLnYk76kqp4psj4XuOlA8mzUQcuii7V5HR8FjuTDKu8xfu9sM9qpXODIVlt62TGbr3qryzpxmNK6VkBJrYA" },
  { name: "EarthGuardian", role: "Ocean Advocate", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBAstTHAtCUxLyYUCz5zsKK-52FM_D1axCOFIlVrpYWLPi31_iXVwLw_WQiqVDE9RcVzIHiamMSWf_zmd-xvhquutzKsdXBfo7JlRl09IfR0KqDwuWhjUUoaQEPVEY8Y86Getjgi4_XQnT-QIpl2m7cM-tqSKe8ggIZk8hOBloutbqlza2_soRGnHTs9lj3EhFXIlVrSkxHj4b5Fvjg8lnMLA8ij-TRHorrBofW9ZtSScypRKVAFMjit3HngdjPYUrzRxf8HPSVGRg" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-outline-variant">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-primary">
            <span className="size-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <Leaf className="size-5" />
            </span>
            <h2 className="text-xl font-extrabold tracking-tight">Green Guardian</h2>
          </Link>
          <nav className="hidden md:flex items-center gap-10 text-sm font-semibold text-on-surface-variant">
            <a className="hover:text-primary" href="#mission">Mission</a>
            <a className="hover:text-primary" href="#voices">Voices</a>
            <a className="hover:text-primary" href="#features">Features</a>
            <Link className="hover:text-primary" to="/auth">Join</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="hidden sm:inline-flex text-primary text-sm font-bold px-4 py-2 hover:bg-surface-container-high rounded-xl transition">Log In</Link>
            <Link to="/auth"><Button className="rounded-xl px-6 h-10 font-bold">Sign Up</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative w-full min-h-[760px] flex items-center justify-center px-6 py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: `url('${HERO_BG}')` }}
            aria-hidden
          />
          <div className="absolute inset-0 hero-gradient" />
        </div>
        <div className="relative z-10 max-w-4xl text-center flex flex-col items-center gap-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest">
            <Leaf className="size-4" /> Verified Impact Tracking
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.05] text-balance drop-shadow">
            Every Trace Tells a Story
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl font-medium leading-relaxed text-balance">
            Join a global community dedicated to ecological transparency. Document your journey, measure your growth, and weave your impact into a greener collective history.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Link to="/auth">
              <Button className="bg-primary text-primary-foreground px-10 py-6 rounded-xl text-base font-bold shadow-xl hover:scale-[1.02] transition-transform">
                Start Your Journey <ArrowRight className="size-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" className="glass-panel text-primary px-10 py-6 rounded-xl text-base font-bold border-white/40 hover:bg-white/80">
                Explore Data
              </Button>
            </a>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-70 text-white">
          <ChevronDown className="size-8" />
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-16 grid sm:grid-cols-3 gap-10">
          {[
            { k: "12.5 kg", l: "Global daily average per person" },
            { k: "5.5 kg", l: "Paris-aligned daily target by 2030" },
            { k: "~60%", l: "Of personal emissions come from food + transport" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-5xl text-tertiary-fixed-dim">{s.k}</div>
              <div className="mt-2 text-sm text-primary-foreground/70">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Voices */}
      <section id="voices" className="max-w-screen-xl mx-auto px-6 md:px-10 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-3">Community Voices</h2>
            <p className="text-lg text-on-surface-variant">Real stories from activists, chefs, and guardians of the earth. See how others are making a difference today.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {VOICES.map((v) => (
            <div key={v.name} className="group cursor-pointer">
              <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl bg-surface-container-high shadow-sm group-hover:shadow-lg transition mb-3">
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url('${v.img}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-4">
                  <span className="text-white text-xs font-bold uppercase tracking-wider">Read Full Story</span>
                </div>
              </div>
              <p className="text-primary font-bold text-base">{v.name}</p>
              <p className="text-on-surface-variant text-xs">{v.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission / Features */}
      <section id="mission" className="bg-surface-container py-24">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-on-tertiary-container bg-tertiary-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6 inline-block">Our Mission</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-primary leading-tight mb-6">Quantifying the Beauty of Preservation</h2>
            <p className="text-lg text-on-surface-variant leading-relaxed mb-6">
              Green Guardian is more than an app; it's a movement to document and preserve our planet's beauty through collective action. When you can see your impact, you're empowered to change your story.
            </p>
            <Link to="/auth"><Button size="lg" className="rounded-xl font-bold">Create your account <ArrowRight className="size-4" /></Button></Link>
          </div>
          <div id="features" className="grid sm:grid-cols-2 gap-4">
            {[
              { Icon: ScrollText, t: "Log in seconds", d: "Tap a preset — a drive, a meal, a flight. We do the carbon math." },
              { Icon: BarChart3, t: "See the pattern", d: "Daily, weekly, by category. Compared to global averages and climate targets." },
              { Icon: Sparkles, t: "Ask the coach", d: "An AI assistant grounded in what you actually log — no generic platitudes." },
              { Icon: Leaf, t: "Build a streak", d: "Small swaps compound. Track your habits and your impact over months." },
            ].map((f) => (
              <div key={f.t} className="bg-card border border-outline-variant rounded-xl p-5">
                <span className="size-10 grid place-items-center rounded-lg bg-primary-container text-on-primary-container mb-3">
                  <f.Icon className="size-5" />
                </span>
                <div className="font-bold text-primary text-lg">{f.t}</div>
                <p className="mt-1 text-sm text-on-surface-variant">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-outline-variant px-6 sm:px-10 py-8 text-sm text-on-surface-variant flex justify-between max-w-screen-xl mx-auto">
        <span>© Green Guardian · Environmental Stewardship through Data.</span>
        <span>Built with Lovable</span>
      </footer>
    </div>
  );
}
