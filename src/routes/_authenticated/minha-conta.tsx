import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot, CalendarCheck, Coins, LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { minhaConta } from "@/lib/conta.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha Conta — Ares Aquatics" },
      { name: "description", content: "Acompanhe o status das suas cotas, reservas VIP e conversas com o assistente." },
      { property: "og:title", content: "Minha Conta — Ares Aquatics" },
      { property: "og:description", content: "Área do cliente Ares Aquatics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MinhaContaPage,
});

const statusLabel: Record<string, { label: string; className: string }> = {
  em_analise: { label: "Em análise", className: "border-gold/50 text-gold" },
  aprovada: { label: "Aprovada", className: "border-neon/50 text-neon" },
  recusada: { label: "Recusada", className: "border-destructive/50 text-destructive" },
};

const dataBr = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

function MinhaContaPage() {
  const fetchConta = useServerFn(minhaConta);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, isFetching, error, refetch } = useQuery({ queryKey: ["minha-conta"], queryFn: () => fetchConta() });

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const card = "rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl";

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-neon">
              <ArrowLeft className="h-3 w-3" /> Voltar ao site
            </Link>
            <h1 className="font-display text-3xl">Minha Conta</h1>
            <p className="text-sm text-muted-foreground">{data?.email ?? "…"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? "animate-spin" : ""} /> Atualizar
            </Button>
            <Button variant="outline" onClick={sair}>
              <LogOut /> Sair
            </Button>
          </div>
        </header>

        {error && <p role="alert" className="text-sm text-destructive">Não foi possível carregar sua conta. Tente atualizar.</p>}

        <section className={card}>
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl"><Coins className="h-5 w-5 text-gold" /> Minhas cotas</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : data?.cotas.length ? (
            <ul className="divide-y divide-border">
              {data.cotas.map((c) => {
                const s = statusLabel[c.status] ?? { label: c.status, className: "border-border text-muted-foreground" };
                return (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-semibold">{c.categoria_cota}</p>
                      <p className="text-xs text-muted-foreground">{c.valor_investimento.toLocaleString("pt-BR")} coins · {dataBr(c.data_criacao)}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${s.className}`}>{s.label}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma cota ainda. <Link to="/" hash="interesse" className="text-neon hover:underline">Registrar interesse</Link>
            </p>
          )}
        </section>

        <div className="grid gap-8 md:grid-cols-2">
          <section className={card}>
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl"><CalendarCheck className="h-5 w-5 text-neon" /> Reservas VIP</h2>
            {data?.reservas.length ? (
              <ul className="space-y-2 text-sm">
                {data.reservas.map((r) => (
                  <li key={r.id} className="flex justify-between rounded-lg border border-border bg-background/40 px-3 py-2">
                    <span>Lounge VIP · Bar Subaquático</span>
                    <span className="font-semibold">{r.data_reserva.split("-").reverse().join("/")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{isLoading ? "Carregando…" : "Nenhuma reserva feita com esta conta."}</p>
            )}
          </section>

          <section className={card}>
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl"><Bot className="h-5 w-5 text-neon" /> Conversas com o assistente</h2>
            {data?.historico.length ? (
              <ul className="space-y-2 text-sm">
                {data.historico.map((h) => (
                  <li key={h.id} className="rounded-lg border border-border bg-background/40 px-3 py-2">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold">Recomendação: {h.cota_recomendada ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">{dataBr(h.data_interacao)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{h.pergunta_usuario}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{isLoading ? "Carregando…" : "Nenhuma análise feita com esta conta ainda."}</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
