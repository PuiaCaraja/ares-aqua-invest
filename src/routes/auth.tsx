import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Ares Aquatics Admin" },
      { name: "description", content: "Acesso restrito ao painel administrativo do Ares Aquatics." },
      { property: "og:title", content: "Entrar — Ares Aquatics Admin" },
      { property: "og:description", content: "Acesso restrito ao painel administrativo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg("E-mail ou senha inválidos.");
    navigate({ to: "/admin" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card/60 p-8 backdrop-blur-xl">
        <h1 className="font-display text-2xl">Painel restrito</h1>
        <p className="text-sm text-muted-foreground">Acesso apenas com conta criada por um administrador.</p>
        <Input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" required placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
        {msg && <p className="text-sm text-destructive">{msg}</p>}
        <Button type="submit" disabled={busy} className="w-full">Entrar</Button>
      </form>
    </main>
  );
}
