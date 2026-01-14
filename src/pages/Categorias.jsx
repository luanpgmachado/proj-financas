const categories = [
  {
    name: "Moradia",
    description: "Aluguel, condominio e servicos fixos",
    status: "Ativa"
  },
  {
    name: "Alimentacao",
    description: "Mercado, refeicoes e delivery",
    status: "Ativa"
  },
  {
    name: "Transporte",
    description: "Combustivel, aplicativos e manutencao",
    status: "Ativa"
  },
  {
    name: "Lazer",
    description: "Experiencias, viagens e eventos",
    status: "Planejada"
  }
];

export default function Categorias() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Categorias
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Base de categorias</h1>
        <p className="mt-2 text-base text-ink-soft">
          Estrutura preparada para CRUD futuro. Dados mockados no v1.
        </p>
      </div>

      <div className="surface overflow-hidden">
        <div className="grid grid-cols-[1.2fr,2fr,0.8fr] gap-4 border-b border-border px-6 py-4 text-sm font-semibold text-ink-soft">
          <span>Categoria</span>
          <span>Descricao</span>
          <span>Status</span>
        </div>
        {categories.map((item) => (
          <div
            key={item.name}
            className="grid grid-cols-[1.2fr,2fr,0.8fr] gap-4 border-b border-border/60 px-6 py-4 text-sm text-ink"
          >
            <span className="font-semibold text-ink">{item.name}</span>
            <span className="text-ink-soft">{item.description}</span>
            <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold text-ink-soft">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
