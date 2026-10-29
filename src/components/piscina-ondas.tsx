import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sparkles, Sun, Waves, X } from "lucide-react";
import imgPiscina from "@/assets/attractions/piscina.jpg";

/** Experiência interativa da Piscina de Ondas Marciana: ondas lentas em canvas,
 * partículas discretas e um alternador subtil de atmosfera. */
type Atmos = "neon" | "crepusculo";

type Palette = {
  label: string;
  sky: Array<[number, number, number]>;
  waves: Array<{ color: [number, number, number]; alpha: number }>;
  particle: [number, number, number];
  glow: [number, number, number];
};

const palettes: Record<Atmos, Palette> = {
  neon: {
    label: "Mar Neon",
    sky: [
      [14, 30, 46],
      [10, 42, 58],
    ],
    waves: [
      { color: [56, 189, 224], alpha: 0.16 },
      { color: [34, 211, 238], alpha: 0.11 },
      { color: [103, 232, 249], alpha: 0.07 },
    ],
    particle: [165, 243, 252],
    glow: [34, 211, 238],
  },
  crepusculo: {
    label: "Crepúsculo em Marte",
    sky: [
      [34, 16, 20],
      [28, 22, 44],
    ],
    waves: [
      { color: [251, 191, 36], alpha: 0.14 },
      { color: [217, 119, 6], alpha: 0.09 },
      { color: [34, 211, 238], alpha: 0.08 },
    ],
    particle: [253, 230, 138],
    glow: [251, 191, 36],
  },
};

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
const rgb = (c: [number, number, number], a = 1) =>
  `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${a})`;

function WaveCanvas({ atmos }: { atmos: Atmos }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const target = useRef<Palette>(palettes[atmos]);
  const current = useRef<Palette>(structuredClone(palettes[atmos]));

  useEffect(() => {
    target.current = palettes[atmos];
  }, [atmos]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const particles = Array.from({ length: 26 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.8 + Math.random() * 1.8,
      speed: 0.00035 + Math.random() * 0.0007,
      drift: Math.random() * Math.PI * 2,
    }));

    // Três camadas de onda: base, amplitude e velocidade calibradas para movimento lento.
    const layers = [
      { base: 0.58, amp: 0.05, wave: 1.7, speed: 0.16, phase: 0 },
      { base: 0.7, amp: 0.07, wave: 1.25, speed: 0.12, phase: 2.1 },
      { base: 0.83, amp: 0.09, wave: 0.9, speed: 0.09, phase: 4.4 },
    ];

    function mixPalette() {
      const t = target.current;
      const c = current.current;
      const f = 0.045;
      c.sky = c.sky.map((s, i) => s.map((v, j) => lerp(v, t.sky[i]![j]!, f)) as [number, number, number]);
      c.waves = c.waves.map((w, i) => ({
        color: w.color.map((v, j) => lerp(v, t.waves[i]!.color[j]!, f)) as [number, number, number],
        alpha: lerp(w.alpha, t.waves[i]!.alpha, f),
      }));
      c.particle = c.particle.map((v, j) => lerp(v, t.particle[j]!, f)) as [number, number, number];
      c.glow = c.glow.map((v, j) => lerp(v, t.glow[j]!, f)) as [number, number, number];
    }

    function draw(nowMs: number) {
      const c = canvas!;
      const g = ctx!;
      const { width, height } = c.getBoundingClientRect();
      if (c.width !== width || c.height !== height) {
        c.width = width;
        c.height = height;
      }
      const time = nowMs / 1000;
      const pal = current.current;

      // Céu
      const sky = g.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, rgb(pal.sky[0]!));
      sky.addColorStop(1, rgb(pal.sky[1]!));
      g.fillStyle = sky;
      g.fillRect(0, 0, width, height);

      // Halo suave no horizonte
      const glow = g.createRadialGradient(width / 2, height * 0.42, 0, width / 2, height * 0.42, height * 0.55);
      glow.addColorStop(0, rgb(pal.glow, 0.12));
      glow.addColorStop(1, rgb(pal.glow, 0));
      g.fillStyle = glow;
      g.fillRect(0, 0, width, height);

      // Partículas discretas de luz/água
      for (const p of particles) {
        p.y -= p.speed;
        p.drift += 0.004;
        if (p.y < -0.04) {
          p.y = 1.04;
          p.x = Math.random();
        }
        const px = p.x * width + Math.sin(p.drift) * 6;
        g.beginPath();
        g.arc(px, p.y * height, p.r, 0, Math.PI * 2);
        g.fillStyle = rgb(pal.particle, 0.28);
        g.fill();
      }

      // Ondas
      layers.forEach((l, i) => {
        const wave = pal.waves[i]!;
        g.beginPath();
        g.moveTo(0, height);
        for (let x = 0; x <= width; x += 6) {
          const n = x / width;
          const y =
            height * (l.base - l.amp * Math.sin(n * Math.PI * 2 * l.wave + time * l.speed + l.phase)) -
            height * l.amp * 0.4 * Math.sin(n * Math.PI * 2 * l.wave * 0.5 + time * l.speed * 0.7);
          g.lineTo(x, y);
        }
        g.lineTo(width, height);
        g.closePath();
        g.fillStyle = rgb(wave.color, wave.alpha);
        g.fill();
      });
    }

    if (reduced) {
      draw(0);
    } else {
      const loop = (now: number) => {
        mixPalette();
        draw(now);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

function AtmosphereToggle({ atmos, onToggle }: { atmos: Atmos; onToggle: () => void }) {
  const Icon = atmos === "neon" ? Moon : Sun;
  return (
    <button
      onClick={onToggle}
      aria-label="Alternar atmosfera"
      className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-neon/40 bg-background/50 px-4 py-2 text-xs font-semibold text-neon backdrop-blur-md transition-all hover:border-gold hover:text-gold"
    >
      <Icon className="h-3.5 w-3.5" />
      Alternar Atmosfera · {palettes[atmos].label}
    </button>
  );
}

export function PiscinaOndas() {
  const [aberto, setAberto] = useState(false);
  const [atmos, setAtmos] = useState<Atmos>("neon");

  return (
    <section id="piscina" className="relative mx-auto max-w-6xl scroll-mt-28 px-6 py-28">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mb-14 text-center"
      >
        <p className="text-xs uppercase tracking-[0.35em] text-copper">Tour virtual</p>
        <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
          Explore a <span className="text-gold-gradient">Piscina de Ondas Marciana</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Toque no ponto de luz para sentir as ondas de 4 metros a 0,38 g — devagar, como tudo por aqui.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="glass overflow-hidden rounded-3xl shadow-neon"
      >
        <div className="relative">
          <motion.img
            src={imgPiscina}
            alt="Piscina de Ondas Marciana sob o domo"
            width={1024}
            height={768}
            loading="lazy"
            animate={{ scale: aberto ? 1.08 : 1, filter: aberto ? "brightness(0.6)" : "brightness(1)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="h-[380px] w-full object-cover md:h-[480px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/50" />

          {/* Ponto interativo da piscina */}
          <button
            onClick={() => setAberto(true)}
            aria-label="Abrir a Piscina de Ondas Marciana"
            style={{ left: "50%", top: "62%" }}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
          >
            <span className={`absolute inset-0 rounded-full animate-ping ${aberto ? "bg-gold/40" : "bg-neon/40"}`} />
            <span
              className={`relative flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-md transition-all ${
                aberto
                  ? "border-gold bg-gold/30 text-gold shadow-gold"
                  : "border-neon/60 bg-background/40 text-neon shadow-neon group-hover:scale-110"
              }`}
            >
              <Waves className="h-5 w-5" />
            </span>
          </button>

          <AnimatePresence>
            {aberto && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.75, y: 24 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="glass absolute inset-3 overflow-hidden rounded-2xl border-neon/30 md:inset-6"
                role="dialog"
                aria-label="Piscina de Ondas Marciana"
              >
                <WaveCanvas atmos={atmos} />

                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 bg-gradient-to-b from-background/70 to-transparent p-5">
                  <div className="pointer-events-auto flex items-center gap-3">
                    <span className="rounded-xl bg-neon/15 p-2.5 text-neon shadow-neon">
                      <Waves className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold">Piscina de Ondas Marciana</h3>
                      <p className="text-xs text-muted-foreground">Ondas de 4 m que duram o dobro do tempo.</p>
                    </div>
                  </div>
                  <div className="pointer-events-auto flex items-center gap-2">
                    <AtmosphereToggle atmos={atmos} onToggle={() => setAtmos((a) => (a === "neon" ? "crepusculo" : "neon"))} />
                    <button
                      onClick={() => setAberto(false)}
                      aria-label="Fechar experiência"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/60 text-foreground backdrop-blur-md transition hover:border-neon hover:text-neon"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-5">
                  <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-gold">
                    <Sparkles className="h-4 w-4" /> {palettes[atmos].label}
                  </p>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Flutue entre uma onda e outra: a gravidade reduzida transforma cada braçada em um voo lento.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
