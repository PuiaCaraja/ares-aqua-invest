import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAccountAccess } from "@/lib/access.functions";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Ares Aquatics" },
      {
        name: "description",
        content: "Entre ou crie sua conta para acompanhar suas cotas e reservas no Ares Aquatics.",
      },
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
  const fetchAccess = useServerFn(getAccountAccess);
  const checkingAccess = useRef(false);
  const goToAccount = useCallback(async () => {
    if (checkingAccess.current) return;
    checkingAccess.current = true;
    try {
      const { role } = await fetchAccess();
      await navigate({ to: role === "admin" ? "/admin" : "/minha-conta", replace: true });
    } catch {
      setMsg({
        ok: false,
        text: "Você entrou, mas não foi possível carregar seu acesso. Tente entrar novamente em instantes.",
      });
    } finally {
      checkingAccess.current = false;
    }
  }, [fetchAccess, navigate]);

  // Resolve the role on the server for password, confirmation and magic-link sessions alike.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) void goToAccount();
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Avoid awaiting another Supabase call inside its auth-state callback.
      if (event === "SIGNED_IN" && session) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (active) void goToAccount();
        }, 0);
      }
    });
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, [goToAccount]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const redirect = `${window.location.origin}/auth`;
    try {
      if (tab === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error)
          return setMsg({
            ok: false,
            text: error.message.includes("confirm")
              ? "Confirme seu e-mail antes de entrar."
              : "E-mail ou senha inválidos.",
          });
        await goToAccount();
      } else if (tab === "criar") {
        if (password.length < 8)
          return setMsg({ ok: false, text: "A senha precisa ter ao menos 8 caracteres." });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirect },
        });
        if (error)
          return setMsg({
            ok: false,
            text:
              error.message.toLowerCase().includes("pwned") ||
              error.message.toLowerCase().includes("weak")
                ? "Essa senha é muito comum. Escolha outra."
                : "Não foi possível criar a conta. Tente outro e-mail.",
          });
        if (data.session) return await goToAccount();
        setMsg({
          ok: true,
          text: "Conta criada! Enviamos um link de confirmação para o seu e-mail.",
        });
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirect },
        });
        if (error)
          return setMsg({
            ok: false,
            text: "Não foi possível enviar o link. Tente novamente em instantes.",
          });
        setMsg({ ok: true, text: "Link mágico enviado! Abra seu e-mail para entrar." });
      }
    } catch {
      setMsg({
        ok: false,
        text: "Não foi possível conectar ao serviço de acesso. Tente novamente em instantes.",
      });
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
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-neon"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar ao site
        </Link>
        <form onSubmit={onSubmit} className="glass space-y-4 rounded-2xl border-neon/20 p-8">
          <div>
            <h1 className="font-display text-2xl text-gold-gradient">Acessar minha conta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe suas cotas, reservas VIP e conversas com o assistente.
            </p>
          </div>
          <div
            role="tablist"
            className="grid grid-cols-3 gap-1 rounded-full border border-border bg-background/50 p-1 text-xs"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => {
                  setTab(t.id);
                  setMsg(null);
                }}
                className={`rounded-full py-2 font-semibold transition ${tab === t.id ? "bg-primary text-primary-foreground shadow-neon" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {tab !== "link" && (
            <Input
              type="password"
              required
              autoComplete={tab === "criar" ? "new-password" : "current-password"}
              placeholder={tab === "criar" ? "Senha (mín. 8 caracteres)" : "Senha"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          {msg && (
            <p
              role={msg.ok ? "status" : "alert"}
              className={`text-sm ${msg.ok ? "text-neon" : "text-destructive"}`}
            >
              {msg.text}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy
              ? "Aguarde…"
              : tab === "entrar"
                ? "Entrar"
                : tab === "criar"
                  ? "Criar conta"
                  : "Enviar link mágico"}
          </Button>
        </form>
      </div>
    </main>
  );
}
