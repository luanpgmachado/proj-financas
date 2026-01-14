import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Lancamentos", to: "/lancamentos" },
  { label: "Categorias", to: "/categorias" },
  { label: "Investimentos", to: "/investimentos" }
];

export default function AppHeader() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/70 bg-card/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold tracking-tight">Financeiro B&L</span>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-ink text-white"
                      : "text-ink-soft hover:bg-ink/10 hover:text-ink"
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink"
          >
            Trocar Conta
            <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink-soft">
              Simulado
            </span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lift transition hover:bg-[#c85f40]"
          >
            Sair
          </button>
        </div>
      </div>
      <nav className="flex w-full justify-center gap-2 border-t border-border/70 bg-card/90 px-4 py-2 md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                isActive
                  ? "bg-ink text-white"
                  : "text-ink-soft hover:bg-ink/10 hover:text-ink"
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
