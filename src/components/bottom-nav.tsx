import { Link, useRouterState } from "@tanstack/react-router";
import { ListChecks, Wallet, User, ClipboardCheck } from "lucide-react";

const items = [
  { to: "/tasks", label: "Tasks", Icon: ListChecks },
  { to: "/my-tasks", label: "My Tasks", Icon: ClipboardCheck },
  { to: "/wallet", label: "Wallet", Icon: Wallet },
  { to: "/profile", label: "Profile", Icon: User },
] as const;


export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        {items.map(({ to, label, Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-xs font-semibold transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
