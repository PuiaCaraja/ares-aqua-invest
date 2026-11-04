import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Ares Aquatics" },
      { name: "description", content: "Entre ou crie sua conta para acompanhar suas cotas e reservas no Ares Aquatics." },
      { property: "og:title", content: "Entrar — Ares Aquatics" },
      { property: "og:description", content: "Acesse a área do cliente Ares Aquatics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Tab = "entrar" | "criar" | "link";

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in (or returning from a confirmation / magic link): go to the dashboard.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/minha-conta", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/minha-conta", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const redirect = `${window.location.origin}/auth`;
    try {
      if (tab === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return setMsg({ ok: false, text: error.message.includes("confirm") ? "Confirme seu e-mail antes de entrar." : "E-mail ou senha inválidos." });
        navigate({ to: "/minha-conta" });
      } else if (tab === "criar") {
        if (password.length < 8) return setMsg({ ok: false, text: "A senha precisa ter ao menos 8 caracteres." });
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirect } });
        if (error) return setMsg({ ok: false, text: error.message.toLowerCase().includes("pwned") || error.message.toLowerCase().includes("weak") ? "Essa senha é muito comum. Escolha outra." : "Não foi possível criar a conta. Tente outro e-mail." });
        if (data.session) return navigate({ to: "/minha-conta" });
        setMsg({ ok: true, text: "Conta criada! Enviamos um link de confirmação para o seu e-mail." });
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
        if (error) return setMsg({ ok: false, text: "Não foi possível enviar o link. Tente novamente em instantes." });
        setMsg({ ok: true, text: "Link mágico enviado! Abra seu e-mail para entrar." });
      }
    } finally {
      setBusy(false);
    }
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "entrar", label: "Entrar" },
    { id: "criar", label: "Criar conta" },
    { id: "link", label: "Link mágico" },
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-neon">
          <ArrowLeft className="h-3 w-3" /> Voltar ao site
        </Link>
        <form onSubmit={onSubmit} className="glass space-y-4 rounded-2xl border-neon/20 p-8">
          <div>
            <h1 className="font-display text-2xl text-gold-gradient">Área do Cliente</h1>
            <p className="mt-1 text-sm text-muted-foreground">Acompanhe suas cotas, reservas VIP e conversas com o assistente.</p>
          </div>
          <div role="tablist" className="grid grid-cols-3 gap-1 rounded-full border border-border bg-background/50 p-1 text-xs">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => { setTab(t.id); setMsg(null); }}
                className={`rounded-full py-2 font-semibold transition ${tab === t.id ? "bg-primary text-primary-foreground shadow-neon" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Input type="email" required autoComplete="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          {tab !== "link" && (
            <Input type="password" required autoComplete={tab === "criar" ? "new-password" : "current-password"} placeholder={tab === "criar" ? "Senha (mín. 8 caracteres)" : "Senha"} value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
          {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-neon" : "text-destructive"}`}>{msg.text}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Aguarde…" : tab === "entrar" ? "Entrar" : tab === "criar" ? "Criar conta" : "Enviar link mágico"}
          </Button>
        </form>
      </div>
    </main>
  );
}
