import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tiers } from "@/lib/cotas";
import { interesseSchema } from "@/lib/interesse-schema";
import { registrarInteresse } from "@/lib/interesses.functions";
import { SucessoAssistente, type SucessoInfo } from "@/components/sucesso-assistente";
import { useSession } from "@/hooks/use-session";
import { Link } from "@tanstack/react-router";

export function InteresseForm() {
  const submit = useServerFn(registrarInteresse);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [categoria, setCategoria] = useState("Explorer");
  const [valor, setValor] = useState("25000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [info, setInfo] = useState<SucessoInfo | null>(null);
  const { user } = useSession();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setSuccess(false);
    const parsed = interesseSchema.safeParse({ nome_cliente: nome, email, categoria_cota: categoria, valor_investimento: Number(valor) });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira os campos.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await submit({ data: parsed.data });
      setSuccess(true);
      setInfo({
        tipo: "cota",
        nome: parsed.data.nome_cliente,
        detalhe: parsed.data.categoria_cota,
        linhas: [
          { label: "Nome", value: parsed.data.nome_cliente },
          { label: "E-mail", value: parsed.data.email },
          { label: "Cota", value: parsed.data.categoria_cota },
          { label: "Investimento", value: `${parsed.data.valor_investimento.toLocaleString("pt-BR")} coins` },
        ],
      });
      setNome("");
      setEmail("");
    } catch {
      setError("Não foi possível salvar seu interesse. Seus dados continuam aqui para tentar novamente.");
    } finally {
      setBusy(false);
    }
  }

  const fieldClass = "mt-2 w-full rounded-lg border border-border bg-background/60 px-4 py-3 text-foreground outline-none focus:border-neon";
  return (
    <section id="interesse" className="mx-auto max-w-6xl scroll-mt-28 px-6 py-28">
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-copper">Seu próximo destino</p>
        <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">Tenho interesse em uma cota</h2>
      </div>
      <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
        <fieldset disabled={busy} className="grid gap-6 md:grid-cols-2">
          <label className="text-sm text-muted-foreground">Nome completo
            <input name="nome_cliente" autoComplete="name" required maxLength={100} value={nome} onChange={(e) => setNome(e.target.value)} className={fieldClass} />
          </label>
          <label className="text-sm text-muted-foreground">E-mail
            <input name="email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
          </label>
          <label className="text-sm text-muted-foreground">Categoria da cota
            <select name="categoria_cota" value={categoria} onChange={(e) => { setCategoria(e.target.value); const tier = tiers.find((t) => t.name === e.target.value); if (tier) setValor(String(tier.price)); }} className={fieldClass}>
              {tiers.map((tier) => <option key={tier.name} value={tier.name}>{tier.name}</option>)}
            </select>
          </label>
          <label className="text-sm text-muted-foreground">Valor do investimento (coins)
            <input name="valor_investimento" type="number" min="0.01" max="999999999999.99" step="0.01" required value={valor} onChange={(e) => setValor(e.target.value)} className={fieldClass} />
          </label>
        </fieldset>
        <Button type="submit" disabled={busy} className="h-auto w-full bg-gradient-gold py-4 font-display font-bold text-accent-foreground shadow-gold"><Send />{busy ? "Salvando..." : "Enviar interesse"}</Button>
        <div aria-live="polite">
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {success && <p role="status" className="flex items-center gap-2 text-sm text-neon"><Check className="h-4 w-4" />Seu interesse foi registrado com sucesso.</p>}
        </div>
        {!user && (
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/auth" className="font-semibold text-neon hover:underline">Entre ou crie sua conta</Link> para acompanhar o status da sua cota.
          </p>
        )}
        <p className="text-center text-xs text-muted-foreground">Cadastro de interesse · Projeto fictício, sem cobrança ou reserva de cota.</p>
      </form>
      <SucessoAssistente info={info} onClose={() => setInfo(null)} />
    </section>
  );
}