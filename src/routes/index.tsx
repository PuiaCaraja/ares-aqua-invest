import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, type MouseEvent } from "react";
import { Rocket, Waves, Martini, Check, Crown, Compass, Mountain, TrendingUp, Sparkles, Play, X } from "lucide-react";
import hero from "@/assets/hero-mars.jpg";
import imgToboga from "@/assets/attractions/toboga.jpg";
import imgPiscina from "@/assets/attractions/piscina.jpg";
import imgBar from "@/assets/attractions/bar.jpg";
import tourClip from "@/assets/attractions/tour.mp4.asset.json";
import { priorities, tiers } from "@/lib/cotas";
import { analyzeCota, type CotaAnalysis } from "@/lib/cotas.functions";
import { InteresseForm } from "@/components/interesse-form";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ares Aquatics — Cotas do Parque Aquático em Marte" },
      { name: "description", content: "Invista em cotas do primeiro parque aquático de luxo em Marte: tobogãs de gravidade reduzida, domo bioesférico e bar orbital." },
      { property: "og:title", content: "Ares Aquatics — Cotas em Marte" },
      { property: "og:description", content: "Garanta sua cota no parque aquático mais exclusivo do sistema solar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const } }),
};

const attractions = [
  { icon: Rocket, title: "Tobogã Olympus", img: imgToboga, text: "300 metros de descida pela encosta do maior vulcão do sistema solar, a apenas 0,38 g. Você cai devagar, voa alto e aterrissa na água mais limpa de Marte." },
  { icon: Waves, title: "Piscina de Ondas Gravidade-38%", img: imgPiscina, text: "Ondas de 4 metros que na Terra derrubariam qualquer um. Aqui você flutua entre uma e outra e dá braçadas que duram o dobro do tempo." },
  { icon: Martini, title: "Bar Subaquático sob Domo", img: imgBar, text: "Coquetéis servidos a 12 metros de profundidade, sob 2 km² de vidro inteligente, com peixes bioluminescentes e vista para Fobos e Deimos." },
];

const tierIcon: Record<string, typeof Compass> = { Explorer: Compass, Terraformer: Mountain, Imperador: Crown };


const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Index() {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const bgX = useTransform(sx, [0, 1], ["-3%", "3%"]);
  const bgY = useTransform(sy, [0, 1], ["-3%", "3%"]);
  const glowX = useTransform(sx, (v) => `${v * 100}%`);
  const glowY = useTransform(sy, (v) => `${v * 100}%`);
  const onMove = (e: MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <main className="overflow-hidden bg-background text-foreground">
      {/* NAV */}
      <nav className="glass fixed inset-x-4 top-4 z-50 mx-auto flex max-w-6xl items-center justify-between rounded-full px-6 py-3">
        <span className="font-display text-lg font-bold tracking-widest text-gold-gradient">ARES AQUATICS</span>
        <div className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#atracoes" className="transition-colors hover:text-neon">Atrações</a>
          <a href="#cotas" className="transition-colors hover:text-neon">Cotas</a>
          <a href="#assistente" className="transition-colors hover:text-neon">Assistente</a>
          <a href="#roi" className="transition-colors hover:text-neon">Simulador</a>
        </div>
        <a href="#interesse" className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-neon">Investir</a>
      </nav>

      {/* HERO */}
      <section onMouseMove={onMove} className="relative flex min-h-screen items-center justify-center px-6">
        <motion.img src={hero} alt="Parque aquático sob domo em Marte" width={1920} height={1088}
          style={{ x: bgX, y: bgY, scale: 1.12 }} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background" />
        <motion.div className="pointer-events-none absolute h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon/20 blur-3xl"
          style={{ left: glowX, top: glowY }} />
        <div className="relative z-10 max-w-4xl text-center">
          <motion.p variants={fadeUp} initial="hidden" animate="show" className="glass mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-gold">
            <Sparkles className="h-3.5 w-3.5" /> Cratera Jezero · Abertura em 2031
          </motion.p>
          <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="show" className="font-display text-4xl font-black leading-tight md:text-7xl">
            Suas férias agora têm <span className="text-neon-gradient">um planeta</span><br />de <span className="text-gold-gradient">atraso.</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} initial="hidden" animate="show" className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Em Marte você pesa 38% do que pesa na Terra: pula mais alto, nada mais longe e ninguém te apressa. São 0,38 g de pura leveza — e só 2.031 cotas à venda.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show" className="mt-10">
            <motion.a href="#interesse" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 rounded-full bg-gradient-gold px-8 py-4 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground shadow-gold">
              <Rocket className="h-5 w-5" /> Garantir Minha Cota
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="atracoes" className="relative mx-auto max-w-6xl px-6 py-28">
        <SectionTitle kicker="Atrações" title="Um planeta inteiro de diversão" />
        <div className="grid gap-6 md:grid-cols-3">
          {attractions.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
              whileHover={{ y: -8 }} className="glass group overflow-hidden rounded-3xl transition-shadow hover:shadow-neon">
              <div className="relative h-44 overflow-hidden">
                <img src={f.img} alt={f.title} width={1024} height={768} loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute inset-x-0 h-16 animate-scanline bg-gradient-to-b from-transparent via-neon/25 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-neon/60 to-transparent" />
                <div className="absolute bottom-3 left-3 inline-flex rounded-2xl bg-neon/10 p-3 text-neon shadow-neon backdrop-blur-sm"><f.icon className="h-5 w-5" /></div>
              </div>
              <div className="p-8 pt-6">
                <h3 className="font-display text-xl font-bold">{f.title}</h3>
                <p className="mt-3 text-muted-foreground">{f.text}</p>
                <button onClick={() => setTourOpen(true)}
                  className="mt-6 inline-flex items-center gap-3 rounded-full border border-neon/40 py-2 pl-2 pr-5 text-sm font-semibold text-neon transition-all hover:bg-neon/10 hover:shadow-neon">
                  <span className="inline-flex rounded-full bg-neon p-1.5 text-primary-foreground"><Play className="h-3.5 w-3.5" /></span>
                  Ver Vídeo Imersivo
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TIERS */}
      <section id="cotas" className="relative px-6 py-28">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_center,var(--mars),transparent_70%)] opacity-50" />
        <div className="relative mx-auto max-w-6xl">
          <SectionTitle kicker="Cotas de investimento" title="Escolha sua cota" />
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((t, i) => {
              const Icon = tierIcon[t.name] ?? Compass;
              return (
              <motion.div key={t.name} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`glass relative flex flex-col rounded-3xl p-8 ${t.featured ? "border-gold/60 shadow-gold" : "hover:shadow-neon"}`}>
                {t.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-4 py-1 text-xs font-bold uppercase text-accent-foreground">Mais desejada</span>}
                <Icon className={`h-9 w-9 ${t.featured ? "text-gold" : "text-neon"}`} />
                <h3 className="mt-4 font-display text-2xl font-bold">{t.name}</h3>
                <p className="mt-4 font-display text-4xl font-black text-gold-gradient">{brl(t.price)}</p>
                <p className="mt-1 text-sm text-neon">Retorno estimado {t.yieldPct}% a.a.</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {t.perks.map((p) => <li key={p} className="flex gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 shrink-0 text-neon" />{p}</li>)}
                </ul>
                <a href="#roi" className={`mt-8 rounded-full py-3 text-center text-sm font-semibold ${t.featured ? "bg-gradient-gold text-accent-foreground" : "border border-neon/50 text-neon hover:bg-neon/10"}`}>Simular retorno</a>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <CotaAssistant />

      <Roi />

      <InteresseForm />

      <footer className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
        <span className="font-display tracking-widest text-gold-gradient">ARES AQUATICS</span> · Cratera Jezero, Marte · Projeção fictícia, não constitui oferta real.
      </footer>
      <TourModal open={tourOpen} onClose={() => setTourOpen(false)} />
    </main>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-14 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-copper">{kicker}</p>
      <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">{title}</h2>
    </motion.div>
  );
}

function Roi() {
  const [tier, setTier] = useState(1);
  const [qty, setQty] = useState(1);
  const [years, setYears] = useState(10);
  const t = tiers[tier] ?? tiers[1]!;
  const invested = t.price * qty;
  const final = invested * Math.pow(1 + t.yieldPct / 100, years);
  const profit = final - invested;
  const bars = Array.from({ length: years }, (_, i) => invested * Math.pow(1 + t.yieldPct / 100, i + 1));

  return (
    <section id="roi" className="mx-auto max-w-6xl px-6 py-28">
      <SectionTitle kicker="Simulador" title="Calcule seu retorno interplanetário" />
      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="glass grid gap-10 rounded-3xl p-8 md:grid-cols-2 md:p-12">
        <div className="space-y-8">
          <div>
            <label className="text-sm text-muted-foreground">Tipo de cota</label>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {tiers.map((x, i) => (
                <button key={x.name} onClick={() => setTier(i)}
                  className={`rounded-xl px-2 py-3 text-xs font-semibold transition-all ${i === tier ? "bg-primary text-primary-foreground shadow-neon" : "border border-border hover:border-neon/50"}`}>{x.name}</button>
              ))}
            </div>
          </div>
          <Slider label="Quantidade de cotas" value={qty} min={1} max={10} onChange={setQty} display={`${qty}`} />
          <Slider label="Horizonte" value={years} min={1} max={25} onChange={setYears} display={`${years} anos`} />
          <div className="rounded-2xl bg-muted/50 p-5 text-sm text-muted-foreground">
            Investimento inicial: <span className="font-semibold text-foreground">{brl(invested)}</span> · Taxa {t.yieldPct}% a.a.
          </div>
        </div>
        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground">Patrimônio projetado</p>
          <motion.p key={final} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl font-black text-gold-gradient md:text-5xl">{brl(final)}</motion.p>
          <p className="mt-2 flex items-center gap-2 text-neon"><TrendingUp className="h-4 w-4" /> Lucro de {brl(profit)} (+{((profit / invested) * 100).toFixed(0)}%)</p>
          <div className="mt-8 flex h-48 flex-1 items-end gap-1">
            {bars.map((b, i) => (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${(b / final) * 100}%` }} transition={{ duration: 0.5, delay: i * 0.02 }}
                className="flex-1 rounded-t bg-gradient-to-t from-copper to-neon opacity-80" />
            ))}
          </div>
          <a href="#interesse" className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold py-4 font-display text-sm font-bold uppercase text-accent-foreground shadow-gold">
            <Waves className="h-4 w-4" /> Garantir Minha Cota
          </a>
        </div>
      </motion.div>
    </section>
  );
}

function Slider({ label, value, min, max, onChange, display }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; display: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold text-neon">{display}</span></div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-3 w-full accent-neon" />
    </div>
  );
}

function TourModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
          onClick={onClose} className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl">
          <motion.div initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }} onClick={(e) => e.stopPropagation()}
            className="glass relative w-full max-w-3xl rounded-3xl border-neon/40 p-4 shadow-neon md:p-6">
            <button onClick={onClose} aria-label="Fechar prévia" className="absolute -right-3 -top-3 z-10 rounded-full bg-primary p-2 text-primary-foreground shadow-neon">
              <X className="h-4 w-4" />
            </button>
            <p className="mb-3 font-display text-xs uppercase tracking-[0.3em] text-copper">Tour imersivo · Ares Aquatics</p>
            <video src={tourClip.url} controls autoPlay loop muted playsInline className="w-full rounded-2xl border border-neon/30" />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {attractions.map((f) => (
                <img key={f.title} src={f.img} alt={f.title} width={1024} height={768} loading="lazy"
                  className="h-20 w-full rounded-xl border border-neon/30 object-cover" />
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">Prévia simulada · Imagens conceituais do parque em Marte</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CotaAssistant() {
  const analyze = useServerFn(analyzeCota);
  const [picked, setPicked] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<CotaAnalysis | null>(null);
  const [err, setErr] = useState("");

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const run = async () => {
    if (picked.length === 0 || busy) return;
    setBusy(true);
    setErr("");
    setRes(null);
    try {
      setRes(await analyze({ data: { priorities: picked, notes } }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não foi possível consultar o assistente de IA agora.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="assistente" className="mx-auto max-w-6xl px-6 py-28">
      <SectionTitle kicker="Assistente IA" title="Qual cota combina com você?" />
      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="glass rounded-3xl p-8 md:p-12">
        <p className="text-sm text-muted-foreground">
          Marque suas prioridades — a IA compara as três cotas e explica quais benefícios atendem melhor cada uma delas.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {priorities.map((p) => (
            <button key={p.id} onClick={() => toggle(p.id)}
              className={`rounded-full border px-4 py-2 text-sm transition-all ${picked.includes(p.id) ? "border-neon bg-neon/15 text-neon shadow-neon" : "border-border text-muted-foreground hover:border-neon/50"}`}>
              {p.label}
            </button>
          ))}
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={600}
          placeholder="Conte mais (opcional): com quem viaja, o que procura, orçamento..."
          className="mt-5 w-full rounded-2xl border border-border bg-background/60 p-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-neon/50" />
        <button onClick={run} disabled={busy || picked.length === 0}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground shadow-gold disabled:opacity-50 disabled:shadow-none">
          <Sparkles className="h-4 w-4" /> {busy ? "Analisando..." : "Analisar com IA"}
        </button>
        {err && <p className="mt-4 text-sm text-destructive">{err}</p>}
        {res && (
          <div className="mt-10 space-y-6">
            <p className="text-muted-foreground">{res.summary}</p>
            {res.ranking.map((r, i) => (
              <div key={r.tier}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-display font-bold">{r.tier}</span>
                  <span className="text-neon">{r.score} de match</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, r.score))}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-copper via-gold to-gold" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{r.verdict}</p>
              </div>
            ))}
            {res.matches.map((m) => (
              <div key={m.tier} className="rounded-2xl border border-neon/30 bg-neon/5 p-5">
                <p className="font-display font-bold text-neon">Por que a {m.tier}</p>
                <p className="mt-2 text-sm text-muted-foreground">{m.why}</p>
                <ul className="mt-3 space-y-2">
                  {m.benefits.map((b) => <li key={b} className="flex gap-2 text-sm"><Check className="h-4 w-4 shrink-0 text-gold" />{b}</li>)}
                </ul>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Análise gerada por IA com base nos benefícios simulados — projeção fictícia.</p>
          </div>
        )}
      </motion.div>
    </section>
  );
}
