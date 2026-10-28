import { useEffect, useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, Check, Fish, Martini, Plus, Send, Sparkles, Waves, Wine, X } from "lucide-react";
import imgBar from "@/assets/attractions/bar.jpg";
import splashVideo from "@/assets/attractions/splash.mp4.asset.json";
import { reservaSchema } from "@/lib/reserva-schema";
import { registrarReserva } from "@/lib/reservas.functions";

type Mode = "menu" | "tanques" | "lounge";

const hotspots: Array<{
  id: Mode;
  icon: typeof Martini;
  title: string;
  teaser: string;
  x: number;
  y: number;
}> = [
  {
    id: "tanques",
    icon: Fish,
    title: "Tanques de Água Marciana",
    teaser: "Aproxime-se da janela do aquário e nade com os peixes exóticos.",
    x: 22,
    y: 62,
  },
  {
    id: "lounge",
    icon: Waves,
    title: "Lounge VIP de Observação",
    teaser: "Iluminação intimista e vista panorâmica do fundo do aquário.",
    x: 68,
    y: 30,
  },
  {
    id: "menu",
    icon: Wine,
    title: "Menu de Coquetéis Marcianos",
    teaser: "Assista à preparação do Red Planet Splash, com gelo seco e magia líquida.",
    x: 50,
    y: 78,
  },
];

/** Sino suave sintetizado via WebAudio ao abrir uma experiência. */
function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);
    gain.connect(ctx.destination);
    [523.25, 784.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.09);
      osc.stop(ctx.currentTime + 1.5);
    });
    osc_cleanup(ctx);
  } catch {
    /* áudio indisponível — segue sem som */
  }
}

function osc_cleanup(ctx: AudioContext) {
  window.setTimeout(() => void ctx.close().catch(() => undefined), 2000);
}

export function BarSubaquatico() {
  const [mode, setMode] = useState<Mode | null>(null);

  function open(m: Mode) {
    setMode(m);
    playChime();
  }

  return (
    <section id="bar" className="relative mx-auto max-w-6xl scroll-mt-28 px-6 py-28">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mb-14 text-center"
      >
        <p className="text-xs uppercase tracking-[0.35em] text-copper">Tour virtual</p>
        <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
          Explore o <span className="text-gold-gradient">Bar Subaquático</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Toque nos pontos de luz para mergulhar em cada experiência do bar mais profundo do sistema solar.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="glass overflow-hidden rounded-3xl shadow-neon"
      >
        {/* Palco do tour */}
        <div className="relative">
          <motion.img
            src={imgBar}
            alt="Interior do Bar Subaquático sob o domo"
            width={1024}
            height={768}
            loading="lazy"
            animate={{ scale: mode ? 1.12 : 1, filter: mode === "lounge" ? "brightness(0.55) saturate(1.2)" : "brightness(1) saturate(1)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="h-[420px] w-full object-cover md:h-[520px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/60" />
          {/* Iluminação ciano + dourado */}
          <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-neon/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
          {/* Atmosfera intimista do lounge */}
          <motion.div
            aria-hidden
            animate={{ opacity: mode === "lounge" ? 1 : 0 }}
            transition={{ duration: 1.2 }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-mars/60 via-background/40 to-background/80"
          />

          {hotspots.map((h) => (
            <button
              key={h.id}
              onClick={() => open(h.id)}
              aria-label={h.title}
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
            >
              <span className={`absolute inset-0 animate-ping rounded-full ${mode === h.id ? "bg-gold/40" : "bg-neon/40"}`} />
              <span
                className={`relative flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-all ${
                  mode === h.id
                    ? "border-gold bg-gold/30 text-gold shadow-gold"
                    : "border-neon/60 bg-background/40 text-neon shadow-neon group-hover:scale-110"
                }`}
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>
          ))}

          {/* Experiência imersiva */}
          <AnimatePresence>
            {mode && <ImmersiveMode key={mode} mode={mode} onClose={() => setMode(null)} />}
          </AnimatePresence>
        </div>

        {/* Reserva de mesa VIP */}
        <ReservaForm />
      </motion.div>
    </section>
  );
}

function ImmersiveMode({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const spot = hotspots.find((h) => h.id === mode)!;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.55, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: 24 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="glass absolute inset-3 overflow-hidden rounded-2xl border-neon/30 md:inset-6"
      role="dialog"
      aria-label={spot.title}
    >
      {mode === "menu" && <MenuExperience />}
      {mode === "tanques" && <AquariumExperience />}
      {mode === "lounge" && <LoungeExperience />}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 bg-gradient-to-b from-background/80 to-transparent p-5">
        <div className="pointer-events-auto flex items-center gap-3">
          <span className="rounded-xl bg-neon/15 p-2.5 text-neon shadow-neon">
            <spot.icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold">{spot.title}</h3>
            <p className="text-xs text-muted-foreground">{spot.teaser}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar experiência"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/60 text-foreground backdrop-blur-md transition hover:border-neon hover:text-neon"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

/** 1. Menu: vídeo em loop da preparação do Red Planet Splash. */
function MenuExperience() {
  return (
    <div className="relative h-full w-full">
      <video
        src={splashVideo.url}
        autoPlay
        muted
        loop
        playsInline
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/40" />
      <div className="absolute bottom-5 left-5 right-5">
        <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-gold">
          <Sparkles className="h-4 w-4" /> Red Planet Splash
        </p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Espuma de gelo seco, licor de poeira de Jezero e o momento em que o líquido muda de cobre para ciano — servido a 0,38 g.
        </p>
      </div>
    </div>
  );
}

/** 2. Tanques: zoom na janela do aquário com bolhas em canvas e peixes SVG em loop. */
function AquariumExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const bubbles = Array.from({ length: 42 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1.5 + Math.random() * 4,
      speed: 0.0006 + Math.random() * 0.0016,
      drift: Math.random() * Math.PI * 2,
    }));

    function draw() {
      const c = canvas!;
      const g = ctx!;
      const { width, height } = c.getBoundingClientRect();
      if (c.width !== width || c.height !== height) {
        c.width = width;
        c.height = height;
      }
      g.clearRect(0, 0, width, height);
      for (const b of bubbles) {
        b.y -= b.speed;
        b.drift += 0.02;
        if (b.y < -0.05) {
          b.y = 1.05;
          b.x = Math.random();
        }
        const x = b.x * width + Math.sin(b.drift) * 8;
        const y = b.y * height;
        g.beginPath();
        g.arc(x, y, b.r, 0, Math.PI * 2);
        g.strokeStyle = "rgba(140, 230, 255, 0.55)";
        g.lineWidth = 1;
        g.stroke();
        g.beginPath();
        g.arc(x - b.r * 0.3, y - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
        g.fillStyle = "rgba(200, 245, 255, 0.5)";
        g.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Água em movimento suave */}
      <div className="absolute inset-0 animate-water bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.45_0.12_220)_0%,transparent_55%),radial-gradient(ellipse_at_70%_80%,oklch(0.35_0.1_200)_0%,transparent_50%),linear-gradient(180deg,oklch(0.22_0.06_220)_0%,oklch(0.14_0.04_230)_100%)]" />
      {/* Raios de luz */}
      <div className="pointer-events-none absolute -top-10 left-1/4 h-[130%] w-24 rotate-12 animate-ray bg-gradient-to-b from-neon/25 to-transparent blur-md" />
      <div className="pointer-events-none absolute -top-10 left-2/3 h-[130%] w-16 rotate-6 animate-ray-slow bg-gradient-to-b from-neon/15 to-transparent blur-md" />

      {/* Peixes exóticos em loop */}
      <FishSwimmer className="left-0 top-[22%] h-10 w-16 text-neon" duration={14} delay={0} />
      <FishSwimmer className="left-0 top-[48%] h-7 w-12 text-gold" duration={19} delay={4} reverse />
      <FishSwimmer className="left-0 top-[68%] h-12 w-20 text-copper" duration={23} delay={8} />
      <FishSwimmer className="left-0 top-[36%] h-5 w-9 text-neon/70" duration={11} delay={2} reverse />

      {/* Bolhas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="absolute bottom-5 left-5 right-5">
        <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-neon">
          <Fish className="h-4 w-4" /> Janela do aquário — 12 m de profundidade
        </p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Peixes bioluminescentes criados nos tanques de água marciana passam a centímetros do vidro inteligente.
        </p>
      </div>
    </div>
  );
}

function FishSwimmer({
  className,
  duration,
  delay,
  reverse = false,
}: {
  className: string;
  duration: number;
  delay: number;
  reverse?: boolean;
}) {
  return (
    <div
      className={`pointer-events-none absolute ${reverse ? "animate-swim-reverse" : "animate-swim"}`}
      style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
    >
      <svg viewBox="0 0 64 32" fill="currentColor" className={`${className} drop-shadow-[0_0_12px_currentColor] ${reverse ? "-scale-x-100" : ""}`}>
        <path d="M8 16c8-9 22-12 34-6l12-8-4 10 4 10-12-8c-12 6-26 3-34-2z" opacity="0.9" />
        <circle cx="16" cy="14" r="1.6" fill="oklch(0.13 0.025 30)" />
      </svg>
    </div>
  );
}

/** 3. Lounge: atmosfera intimista + panorama animado do fundo do aquário. */
function LoungeExperience() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Panorama do fundo do aquário em movimento lento */}
      <div className="absolute inset-0 animate-panorama bg-[linear-gradient(100deg,oklch(0.2_0.05_230)_0%,oklch(0.3_0.09_215)_25%,oklch(0.18_0.05_240)_50%,oklch(0.32_0.1_205)_75%,oklch(0.2_0.05_230)_100%)] bg-[length:300%_100%]" />
      {/* Silhueta de recife */}
      <div className="absolute bottom-0 left-0 right-0 h-2/5 animate-panorama-slow bg-[radial-gradient(ellipse_120px_90px_at_15%_100%,oklch(0.16_0.04_30)_0%,transparent_70%),radial-gradient(ellipse_180px_120px_at_45%_100%,oklch(0.14_0.03_280)_0%,transparent_70%),radial-gradient(ellipse_140px_100px_at_80%_100%,oklch(0.16_0.05_32)_0%,transparent_70%)] bg-[length:200%_100%]" />
      {/* Pontos bioluminescentes */}
      {[
        { left: "12%", top: "30%", d: "0s" },
        { left: "34%", top: "55%", d: "0.8s" },
        { left: "58%", top: "26%", d: "1.6s" },
        { left: "76%", top: "48%", d: "0.4s" },
        { left: "88%", top: "22%", d: "1.2s" },
        { left: "24%", top: "70%", d: "2s" },
      ].map((p, i) => (
        <span
          key={i}
          className="absolute h-1.5 w-1.5 animate-pulse rounded-full bg-neon shadow-neon"
          style={{ left: p.left, top: p.top, animationDelay: p.d, animationDuration: "2.6s" }}
        />
      ))}
      {/* Brilho dourado intimista */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-56 w-[130%] -translate-x-1/2 rounded-[100%] bg-gold/10 blur-3xl" />

      <div className="absolute bottom-5 left-5 right-5">
        <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-gold">
          <Waves className="h-4 w-4" /> Vista panorâmica — fundo do aquário
        </p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Luz baixa, poltronas reclináveis e 40 metros de vidro inteligente entre você e o oceano marciano.
        </p>
      </div>
    </div>
  );
}

function ReservaForm() {
  const submit = useServerFn(registrarReserva);
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setSuccess(false);
    const parsed = reservaSchema.safeParse({ nome_cliente: nome, data_reserva: data });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira os campos.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await submit({ data: parsed.data });
      setSuccess(true);
      setNome("");
      setData("");
    } catch {
      setError("Não foi possível salvar sua reserva. Seus dados continuam aqui para tentar novamente.");
    } finally {
      setBusy(false);
    }
  }

  const fieldClass = "mt-2 w-full rounded-lg border border-border bg-background/60 px-4 py-3 text-foreground outline-none focus:border-neon";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="relative border-t border-border/60 p-8 md:p-10">
      <div className="pointer-events-none absolute -top-10 left-1/3 h-40 w-40 rounded-full bg-neon/15 blur-3xl" />
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-gold/15 p-2.5 text-gold shadow-gold">
          <CalendarCheck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-xl font-bold">Reserva de Mesa VIP</h3>
          <p className="text-sm text-muted-foreground">Garanta sua noite no lounge subaquático.</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <fieldset disabled={busy} className="contents">
          <label className="text-sm text-muted-foreground">
            Nome do cliente
            <input name="nome_cliente" autoComplete="name" required maxLength={100} value={nome} onChange={(e) => setNome(e.target.value)} className={fieldClass} />
          </label>
          <label className="text-sm text-muted-foreground">
            Data da reserva
            <input name="data_reserva" type="date" required min={today} value={data} onChange={(e) => setData(e.target.value)} className={fieldClass} />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-[50px] items-center justify-center gap-2 rounded-full bg-gradient-gold px-6 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground shadow-gold disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> {busy ? "Reservando..." : "Reservar"}
          </button>
        </fieldset>
      </form>
      <div aria-live="polite" className="mt-4">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="flex items-center gap-2 text-sm text-neon">
            <Check className="h-4 w-4" /> Sua mesa VIP foi reservada. Até breve, sob o domo.
          </p>
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Reserva simulada · Projeto fictício, sem cobrança.</p>
    </div>
  );
}
