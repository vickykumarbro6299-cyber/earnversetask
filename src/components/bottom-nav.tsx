import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Wallet, ClipboardCheck, Menu } from "lucide-react";
import { MoreDrawer } from "./more-drawer";

const items = [
  { to: "/tasks", label: "Dashboard", Icon: LayoutGrid },
  { to: "/my-tasks", label: "My Tasks", Icon: ClipboardCheck },
  { to: "/wallet", label: "Wallet", Icon: Wallet },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <>
      <MoreDrawer open={open} onClose={() => setOpen(false)} />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
          {items.map(({ to, label, Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open more menu"
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold transition-colors ${
              open ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
