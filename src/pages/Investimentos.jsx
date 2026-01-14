const investments = [
  {
    name: "Fundo Reserva",
    type: "Renda fixa",
    status: "Ativo"
  },
  {
    name: "Acoes Longo Prazo",
    type: "Renda variavel",
    status: "Ativo"
  },
  {
    name: "Previdencia",
    type: "Planejamento",
    status: "Em estudo"
  }
];

export default function Investimentos() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Investimentos
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Carteira inicial</h1>
        <p className="mt-2 text-base text-ink-soft">
          Dados mockados no v1 com estrutura pronta para evolucao.
        </p>
      </div>

      <div className="surface overflow-hidden">
        <div className="grid grid-cols-[1.4fr,1fr,0.8fr] gap-4 border-b border-border px-6 py-4 text-sm font-semibold text-ink-soft">
          <span>Investimento</span>
          <span>Tipo</span>
          <span>Status</span>
        </div>
        {investments.map((item) => (
          <div
            key={item.name}
            className="grid grid-cols-[1.4fr,1fr,0.8fr] gap-4 border-b border-border/60 px-6 py-4 text-sm text-ink"
          >
            <span className="font-semibold text-ink">{item.name}</span>
            <span className="text-ink-soft">{item.type}</span>
            <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold text-ink-soft">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
