import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { UserPlus } from "lucide-react";
import { criarConta } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CriarContaForm() {
  const create = useServerFn(criarConta);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await create({ data: { email, password } });
      setMsg({ ok: true, text: `Conta criada para ${r.email}.` });
      setEmail("");
      setPassword("");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Erro ao criar conta.";
      setMsg({
        ok: false,
        text: text.startsWith("[") ? "Confira o e-mail e use uma senha de 8+ caracteres." : text,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl">
        <UserPlus className="h-5 w-5 text-primary" /> Criar conta de cliente
      </h2>
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-center">
        <Input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          required
          minLength={8}
          placeholder="Senha (8+ caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          Criar
        </Button>
      </form>
      {msg && (
        <p className={`mt-3 text-sm ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.text}</p>
      )}
    </section>
  );
}
