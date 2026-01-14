import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    login();
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-200/60 blur-3xl" />
        <div className="absolute bottom-[-30%] right-[-10%] h-96 w-96 rounded-full bg-teal-200/60 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-12 px-6 py-16 lg:flex-row">
        <div className="max-w-md text-center lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-soft">
            Financeiro B&L
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">
            Controle financeiro simples, direto e pronto para crescer.
          </h1>
          <p className="mt-4 text-base text-ink-soft">
            Autenticacao simulada (v1). Nenhuma credencial e enviada para o back-end.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-5 rounded-3xl border border-border bg-card/90 p-8 shadow-soft backdrop-blur"
        >
          <div>
            <label className="text-sm font-semibold text-ink">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
              placeholder="voce@financas.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none"
              placeholder="Sua senha"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lift transition hover:bg-[#c85f40]"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
