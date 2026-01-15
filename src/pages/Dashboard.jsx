const cards = [
  {
    title: "Total de lancamentos",
    value: "128",
    note: "Base geral do periodo"
  },
  {
    title: "Mes atual",
    value: "Outubro 2026",
    note: "Fechamento em andamento"
  },
  {
    title: "Fluxo previsto",
    value: "R$ 12.450",
    note: "Valor ilustrativo (v1)"
  }
];

const indicators = [
  { label: "Receitas", value: "R$ 18.200", tone: "bg-emerald-400" },
  { label: "Despesas", value: "R$ 8.750", tone: "bg-rose-400" },
  { label: "Investimentos", value: "R$ 3.400", tone: "bg-sky-400" }
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Resumo geral</h1>
        <p className="mt-2 text-base text-ink-soft">
          Indicadores simples para acompanhamento inicial do MVP.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title} className="surface p-6">
            <p className="text-sm font-semibold text-ink-soft">{card.title}</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{card.value}</p>
            <p className="mt-2 text-sm text-ink-soft">{card.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Indicadores visuais</h2>
            <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold text-ink-soft">
              Simulado v1
            </span>
          </div>
          <div className="mt-6 space-y-5">
            {indicators.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-ink">
                  <span>{item.label}</span>
                  <span className="text-ink-soft">{item.value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-ink/10">
                  <div className={`h-full w-2/3 rounded-full ${item.tone}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="surface p-6">
          <h2 className="section-title">Atalhos rapidos</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Links prontos para acelerar o fluxo principal.
          </p>
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm">
              Criar novo lancamento
            </div>
            <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm">
              Revisar categorias
            </div>
            <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm">
              Ver investimentos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
