import { Link } from "@tanstack/react-router";
import { CoinIcon } from "./brand";
import { ThemeToggle } from "./theme-toggle";


export function TopBar({ coins, name }: { coins: number; name: string }) {
  const initial = (name || "U").charAt(0).toUpperCase();
  return (
    <header className="bg-gradient-brand px-4 pb-4 pt-5">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <Link
          to="/profile"
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-primary-foreground/70 bg-brand-deep text-lg font-bold text-primary-foreground"
          aria-label="Open profile"
        >
          {initial}
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/wallet"
            className="flex items-center gap-2 rounded-full border border-primary-foreground/40 bg-brand-deep px-3 py-1.5 shadow-card"
          >
            <CoinIcon className="h-7 w-7" />
            <span className="pr-1 text-lg font-bold text-primary-foreground">{coins}</span>
          </Link>
        </div>

      </div>
    </header>
  );
}
