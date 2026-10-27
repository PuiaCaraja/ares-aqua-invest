import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { RefreshCw, Search, Users, Coins, Crown, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listarInteresses } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CriarContaForm } from "@/components/criar-conta-form";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel Administrativo — Ares Aquatics" },
      { name: "description", content: "Leads e indicadores das cotas do Ares Aquatics." },
      { property: "og:title", content: "Painel Administrativo — Ares Aquatics" },
      { property: "og:description", content: "Leads e indicadores das cotas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const fmt = (n: number) => `${n.toLocaleString("pt-BR")} coins`;

function AdminPage() {
  const navigate = useNavigate();
  const fetchLeads = useServerFn(listarInteresses);
  const { data, isLoading, isFetching, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: () => fetchLeads(),
    refetchInterval: 15000,
  });
  const [q, setQ] = useState("");

  const leads = data?.leads ?? [];
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? leads.filter((l) => l.nome_cliente.toLowerCase().includes(t) || l.email.toLowerCase().includes(t)) : leads;
  }, [leads, q]);

  const total = leads.reduce((s, l) => s + l.valor_investimento, 0);
  const counts = leads.reduce<Record<string, number>>((m, l) => ({ ...m, [l.categoria_cota]: (m[l.categoria_cota] ?? 0) + 1 }), {});
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (data && !data.allowed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <p>Sua conta não tem permissão de administrador.</p>
        <Button variant="outline" onClick={signOut}>Sair</Button>
      </main>
    );
  }

  const kpis = [
    { icon: Users, label: "Total de Leads Registrados", value: leads.length.toLocaleString("pt-BR") },
    { icon: Coins, label: "Valor Total Potencial", value: fmt(total) },
    { icon: Crown, label: "Cota mais popular", value: top ? `${top[0]} (${top[1]})` : "—" },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">
              {dataUpdatedAt ? `Atualizado às ${new Date(dataUpdatedAt).toLocaleTimeString("pt-BR")} · atualiza sozinho a cada 15s` : "Carregando…"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? "animate-spin" : ""} /> Atualizar
            </Button>
            <Button variant="outline" onClick={signOut}><LogOut /> Sair</Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
              <k.icon className="mb-3 h-6 w-6 text-primary" />
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <p className="mt-1 font-display text-2xl">{isLoading ? "…" : k.value}</p>
            </div>
          ))}
        </section>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {error && <p className="text-destructive">Não foi possível carregar os leads.</p>}

        <div className="overflow-x-auto rounded-2xl border border-border bg-card/60 backdrop-blur-xl">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="p-4">Cliente</th><th className="p-4">E-mail</th><th className="p-4">Cota</th>
                <th className="p-4 text-right">Valor</th><th className="p-4">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="p-4 font-medium">{l.nome_cliente}</td>
                  <td className="p-4 text-muted-foreground">{l.email}</td>
                  <td className="p-4"><span className="rounded-full border border-primary/40 px-2 py-0.5 text-xs text-primary">{l.categoria_cota}</span></td>
                  <td className="p-4 text-right tabular-nums">{fmt(l.valor_investimento)}</td>
                  <td className="p-4 text-muted-foreground">{new Date(l.data_criacao).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum lead encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <CriarContaForm />
      </div>
    </main>
  );
}
