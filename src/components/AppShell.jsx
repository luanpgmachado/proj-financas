import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";

export default function AppShell() {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-[-10%] h-80 w-80 rounded-full bg-amber-200/60 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] h-96 w-96 rounded-full bg-teal-200/50 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.8),transparent_55%)]" />
      </div>
      <AppHeader />
      <main className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-32">
        <Outlet />
      </main>
    </div>
  );
}
