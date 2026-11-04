import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CheckCircle2, MessageCircle, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildWhatsAppLink, type AtendimentoTipo } from "@/lib/whatsapp";
import { useSession } from "@/hooks/use-session";

export type SucessoInfo = {
  tipo: AtendimentoTipo;
  nome: string;
  /** Cota escolhida (tipo "cota") ou data formatada (tipo "reserva"). */
  detalhe: string;
  linhas: Array<{ label: string; value: string }>;
};

export function SucessoAssistente({ info, onClose }: { info: SucessoInfo | null; onClose: () => void }) {
  const { user } = useSession();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!info) return;
    setStep(0);
    const timers = [1, 2, 3, 4].map((n) => setTimeout(() => setStep(n), n * 700));
    return () => timers.forEach(clearTimeout);
  }, [info]);

  const primeiroNome = info?.nome.trim().split(/\s+/)[0] ?? "";
  const link = info ? buildWhatsAppLink({ nome: info.nome, tipo: info.tipo, detalhe: info.detalhe }) : "#";

  const mensagens = info
    ? [
        `Olá, ${primeiroNome}! Sou a ARIA, assistente de boas-vindas do Ares Aquatics. 🚀`,
        info.tipo === "cota"
          ? `Recebi seu interesse na cota ${info.detalhe}. Confira os dados que registrei:`
          : `Sua mesa VIP no Bar Subaquático está registrada. Confira os dados:`,
        "__dados__",
        "Quer falar agora com um especialista? Preparei uma mensagem personalizada para o WhatsApp.",
      ]
    : [];

  return (
    <Dialog open={Boolean(info)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass max-h-[90vh] overflow-y-auto border-neon/30 sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <CheckCircle2 className="h-5 w-5 text-neon" />
            {info?.tipo === "reserva" ? "Reserva confirmada!" : "Interesse registrado!"}
          </DialogTitle>
          <DialogDescription>Seus dados foram salvos com segurança.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3" aria-live="polite">
          <AnimatePresence>
            {mensagens.slice(0, step).map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2">
                <span className="mt-0.5 rounded-full bg-neon/15 p-1.5 text-neon">
                  <Bot className="h-3.5 w-3.5" />
                </span>
                {m === "__dados__" && info ? (
                  <dl className="flex-1 rounded-2xl rounded-tl-sm border border-border bg-background/60 p-3 text-sm">
                    {info.linhas.map((l) => (
                      <div key={l.label} className="flex justify-between gap-4 py-0.5">
                        <dt className="text-muted-foreground">{l.label}</dt>
                        <dd className="text-right font-semibold">{l.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="flex-1 rounded-2xl rounded-tl-sm border border-border bg-background/60 p-3 text-sm">{m}</p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {step < mensagens.length && (
            <p className="pl-9 text-xs text-muted-foreground">ARIA está digitando…</p>
          )}
        </div>

        {step >= mensagens.length && info && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-2">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold py-3 font-display text-sm font-bold text-accent-foreground shadow-gold"
            >
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </a>
            <Link
              to={user ? "/minha-conta" : "/auth"}
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-neon/50 py-3 text-sm font-semibold text-neon hover:bg-neon/10"
            >
              <UserRound className="h-4 w-4" />
              {user ? "Ver na Minha Conta" : "Entrar para acompanhar o status"}
            </Link>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
