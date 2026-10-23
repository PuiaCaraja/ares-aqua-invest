export const tiers = [
  {
    name: "Explorer",
    price: 25000,
    yieldPct: 8,
    perks: ["7 dias de férias em Marte a cada ano", "20% de desconto no voo Terra–Marte", "Rendimentos pagos a cada trimestre", "Kit de viagem em titânio"],
  },
  {
    name: "Terraformer",
    price: 120000,
    yieldPct: 12,
    featured: true,
    perks: ["45 dias de férias a cada ano", "Suíte privativa dentro do domo", "Voo ida e volta incluso 1×/ano", "Dividendos + bônus de ocupação", "Fila prioritária no Tobogã Olympus"],
  },
  {
    name: "Imperador",
    price: 750000,
    yieldPct: 18,
    perks: ["Acesso vitalício e ilimitado", "Villa com piscina de gravidade zero", "Nave privativa na sua cota", "Assento no conselho de Ares", "Noite exclusiva no Bar Subaquático"],
  },
];

export const priorities = [
  { id: "familia", label: "Férias em família" },
  { id: "retorno", label: "Retorno financeiro" },
  { id: "status", label: "Exclusividade e status" },
  { id: "adrenalina", label: "Aventura e adrenalina" },
  { id: "social", label: "Vida social e eventos" },
  { id: "explorar", label: "Explorar Marte a fundo" },
];
