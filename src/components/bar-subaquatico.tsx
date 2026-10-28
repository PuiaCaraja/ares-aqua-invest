import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, Check, Martini, Plus, Send, Waves, Wine, X } from "lucide-react";
import imgBar from "@/assets/attractions/bar.jpg";
import { reservaSchema } from "@/lib/reserva-schema";
import { registrarReserva } from "@/lib/reservas.functions";

const hotspots = [
  {
    id: "balcao",
    icon: Martini,
    title: "Balcão de Gravidade Zero",
    text: "Doze metros de balcão suspenso onde os coquetéis flutuam até a sua mão. Cada drink é servido em esferas de vidro que pairam a 0,38 g — beber devagar nunca foi tão literal.",
    detail: "Capacidade: 40 convidados · Drinks signature a partir de 120 coins",
    x: 22,
    y: 62,
  },
  {
    id: "lounge",
    icon: Waves,
    title: "Lounge VIP de Observação Subaquática",
    text: "Poltronas reclináveis coladas em 40 metros de vidro inteligente, a 12 metros de profundidade. Peixes bioluminescentes passam a centímetros de você enquanto Fobos cruza o céu acima da água.",
    detail: "Apenas 8 mesas por noite · Exclusivo para cotistas Terraformer e Imperador",
    x: 68,
    y: 30,
  },
  {
    id: "menu",
    icon: Wine,
    title: "Menu de Coquetéis Marcianos",
    text: "Carta com 31 criações do nosso mixologista-chefe: do 'Poeira de Jezero' (espumante de algas locais) ao 'Eclipse Duplo', servido apenas quando Fobos e Deimos se alinham.",
    detail: "Degustação guiada: 350 coins · Menu degustação completo: 890 coins",
    x: 50,
    y: 78,
  },
];

export function BarSubaquatico() {
  const [active, setActive] = useState<string | null>(null);
  const spot = hotspots.find((h) => h.id === active) ?? null;

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
          Toque nos pontos de luz para conhecer cada canto do bar mais profundo do sistema solar.
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
          <img src={imgBar} alt="Interior do Bar Subaquático sob o domo" width={1024} height={768} loading="lazy" className="h-[420px] w-full object-cover md:h-[520px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/60" />
          {/* Iluminação ciano + dourado */}
          <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-neon/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />

          {hotspots.map((h) => (
            <button
              key={h.id}
              onClick={() => setActive(active === h.id ? null : h.id)}
              aria-label={h.title}
              aria-expanded={active === h.id}
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
            >
              <span className={`absolute inset-0 animate-ping rounded-full ${active === h.id ? "bg-gold/40" : "bg-neon/40"}`} />
              <span
                className={`relative flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-all ${
                  active === h.id
                    ? "border-gold bg-gold/30 text-gold shadow-gold"
                    : "border-neon/60 bg-background/40 text-neon shadow-neon group-hover:scale-110"
                }`}
              >
                {active === h.id ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </span>
            </button>
          ))}

          {/* Painel do hotspot ativo */}
          <AnimatePresence>
            {spot && (
              <motion.div
                key={spot.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.3 }}
                className="glass absolute inset-x-4 bottom-4 rounded-2xl border-neon/30 p-5 md:inset-x-auto md:right-6 md:max-w-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-neon/15 p-2.5 text-neon shadow-neon">
                    <spot.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-lg font-bold">{spot.title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{spot.text}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-gold">{spot.detail}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reserva de mesa VIP */}
        <ReservaForm />
      </motion.div>
    </section>
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
