import { Trophy, CalendarRange, RadioTower } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { cn } from "../lib/utils";

const navItems = [
  { to: "/leagues", label: "Leagues", icon: Trophy },
  { to: "/matches", label: "Matches", icon: CalendarRange }
];

export function AppShell() {
  return (
    <main className="min-h-screen px-3 py-4 text-foreground sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 sm:gap-5">
        <header className="rounded-[24px] border border-white/10 bg-black/20 p-3 shadow-2xl backdrop-blur-xl sm:rounded-[28px] sm:p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link to="/leagues" className="flex items-center gap-3 text-white no-underline">
              <div className="rounded-2xl bg-primary/20 p-2.5 text-primary sm:p-3">
                <RadioTower className="h-5 w-5" />
              </div>
              <div>
                <p className="m-0 text-xs uppercase tracking-[0.28em] text-accent">Cricket Platform</p>
                <h1 className="m-0 text-xl font-bold sm:text-2xl">Cricket Exchange</h1>
              </div>
            </Link>

            <nav className="grid w-full grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1 md:w-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold no-underline transition sm:px-4 sm:py-3 sm:text-sm",
                        isActive ? "bg-white text-slate-950" : "text-muted-foreground hover:bg-white/5"
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </header>

        <Outlet />
      </div>
    </main>
  );
}
