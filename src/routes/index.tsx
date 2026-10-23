import { createFileRoute } from "@tanstack/react-router";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState, type MouseEvent } from "react";
import { Rocket, Waves, Globe2, Martini, Check, Crown, Compass, Mountain, TrendingUp, Sparkles } from "lucide-react";
import hero from "@/assets/hero-mars.jpg";

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

const features = [
  { icon: Rocket, title: "Tobogãs de Gravidade Reduzida", text: "Quedas de 300 m a 0,38 g. Você flutua, desliza e voa — por mais tempo do que a física da Terra permite." },
  { icon: Globe2, title: "Piscina sob Domo Bioesférico", text: "Águas termais cristalinas sob 2 km² de vidro inteligente, com vista para Olympus Mons e as duas luas." },
  { icon: Martini, title: "Bar Orbitário", text: "Coquetéis moleculares servidos em anel giratório a 40 m de altura, com o pôr do sol azul marciano." },
];

const tiers = [
  { name: "Explorador", icon: Compass, price: 25000, yieldPct: 8, perks: ["Acesso anual de 14 dias", "Desconto de 20% em voos Terra–Marte", "Dividendos trimestrais", "Kit de boas-vindas em titânio"] },
  { name: "Terrafomador", icon: Mountain, price: 120000, yieldPct: 12, featured: true, perks: ["Acesso anual de 45 dias", "Suíte privativa no domo", "Voo incluso 1×/ano", "Dividendos + bônus de ocupação", "Fila prioritária nos tobogãs"] },
  { name: "Imperador", icon: Crown, price: 750000, yieldPct: 18, perks: ["Acesso ilimitado vitalício", "Villa com piscina de gravidade zero", "Nave privativa", "Assento no conselho de Ares", "Bar Orbitário exclusivo"] },
];

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

  return (
    <main className="overflow-hidden bg-background text-foreground">
      {/* NAV */}
      <nav className="glass fixed inset-x-4 top-4 z-50 mx-auto flex max-w-6xl items-center justify-between rounded-full px-6 py-3">
        <span className="font-display text-lg font-bold tracking-widest text-gold-gradient">ARES AQUATICS</span>
        <div className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#diferenciais" className="transition-colors hover:text-neon">Diferenciais</a>
          <a href="#cotas" className="transition-colors hover:text-neon">Cotas</a>
          <a href="#roi" className="transition-colors hover:text-neon">Simulador</a>
        </div>
        <a href="#cotas" className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-neon">Investir</a>
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
            <Sparkles className="h-3.5 w-3.5" /> Cratera Jezero · Inauguração 2031
          </motion.p>
          <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="show" className="font-display text-4xl font-black leading-tight md:text-7xl">
            A Terra ficou <span className="text-neon-gradient">pequena</span><br />para o seu <span className="text-gold-gradient">mergulho.</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} initial="hidden" animate="show" className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            O primeiro parque aquático de luxo do Planeta Vermelho. Apenas 2.031 cotas. Nenhuma segunda chance.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show" className="mt-10">
            <motion.a href="#cotas" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 rounded-full bg-gradient-gold px-8 py-4 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground shadow-gold">
              <Rocket className="h-5 w-5" /> Garantir Minha Cota em Marte
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="diferenciais" className="relative mx-auto max-w-6xl px-6 py-28">
        <SectionTitle kicker="Diferenciais" title="Lazer em outra escala gravitacional" />
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
              whileHover={{ y: -8 }} className="glass group rounded-3xl p-8 transition-shadow hover:shadow-neon">
              <div className="mb-6 inline-flex rounded-2xl bg-neon/10 p-4 text-neon shadow-neon"><f.icon className="h-7 w-7" /></div>
              <h3 className="font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-3 text-muted-foreground">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TIERS */}
      <section id="cotas" className="relative px-6 py-28">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_center,var(--mars),transparent_70%)] opacity-50" />
        <div className="relative mx-auto max-w-6xl">
          <SectionTitle kicker="Cotas de investimento" title="Escolha seu lugar na história" />
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`glass relative flex flex-col rounded-3xl p-8 ${t.featured ? "border-gold/60 shadow-gold" : "hover:shadow-neon"}`}>
                {t.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-4 py-1 text-xs font-bold uppercase text-accent-foreground">Mais desejada</span>}
                <t.icon className={`h-9 w-9 ${t.featured ? "text-gold" : "text-neon"}`} />
                <h3 className="mt-4 font-display text-2xl font-bold">{t.name}</h3>
                <p className="mt-4 font-display text-4xl font-black text-gold-gradient">{brl(t.price)}</p>
                <p className="mt-1 text-sm text-neon">Retorno estimado {t.yieldPct}% a.a.</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {t.perks.map((p) => <li key={p} className="flex gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 shrink-0 text-neon" />{p}</li>)}
                </ul>
                <a href="#roi" className={`mt-8 rounded-full py-3 text-center text-sm font-semibold ${t.featured ? "bg-gradient-gold text-accent-foreground" : "border border-neon/50 text-neon hover:bg-neon/10"}`}>Simular retorno</a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Roi />

      <footer className="border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
        <span className="font-display tracking-widest text-gold-gradient">ARES AQUATICS</span> · Cratera Jezero, Marte · Projeção fictícia, não constitui oferta real.
      </footer>
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
  const t = tiers[tier];
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
          <a href="#cotas" className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold py-4 font-display text-sm font-bold uppercase text-accent-foreground shadow-gold">
            <Waves className="h-4 w-4" /> Garantir Minha Cota em Marte
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
