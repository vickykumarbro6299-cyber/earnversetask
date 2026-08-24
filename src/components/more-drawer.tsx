import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid,
  ListChecks,
  Wallet,
  History,
  Gift,
  Trophy,
  CalendarCheck,
  Disc3,

  UserCircle,
  ShieldCheck,
  Rocket,
  Mail,
  FileText,
  ScrollText,
  ReceiptText,

  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CoinIcon } from "./brand";
import { TelegramLogo, InstagramLogo } from "./social-logos";
import { useMe } from "@/lib/use-earn";
import { useTheme } from "./theme-toggle";

type Item = { to: string; label: string; Icon: typeof Wallet };

const socials = [
  { href: "https://t.me/EarnVerseTask", label: "Telegram", Logo: TelegramLogo },
  {
    href: "https://www.instagram.com/earnversetask?igsi=MWxtZXNpbXlwZzQ2cA==",
    label: "Instagram",
    Logo: InstagramLogo,
  },
];

const groups: { title: string; items: Item[] }[] = [
  {
    title: "Overview",
    items: [
      { to: "/tasks", label: "Dashboard", Icon: LayoutGrid },
      { to: "/my-tasks", label: "My Tasks", Icon: ListChecks },
      { to: "/creator-studio", label: "Creator Studio", Icon: Rocket },
    ],
  },
  {
    title: "Earnings",
    items: [
      { to: "/wallet", label: "Wallet", Icon: Wallet },
      { to: "/history", label: "Earning History", Icon: History },
      { to: "/leaderboard", label: "Leaderboard", Icon: Trophy },
      { to: "/daily-bonus", label: "Daily Bonus", Icon: CalendarCheck },
      { to: "/spin-win", label: "Spin & Win", Icon: Disc3 },
      { to: "/refer-earn", label: "Refer & Earn", Icon: Gift },
    ],
  },

  {
    title: "More",
    items: [
      { to: "/profile", label: "Profile", Icon: UserCircle },
      { to: "/contact", label: "Contact Us", Icon: Mail },
      { to: "/privacy", label: "Privacy Policy", Icon: FileText },
      { to: "/terms", label: "Terms & Conditions", Icon: ScrollText },
      { to: "/refund", label: "Refund & Cancellation", Icon: ReceiptText },
    ],
  },
];


export function MoreDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const me = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { theme, toggle } = useTheme();
  const p = me.data?.profile;
  const isAdmin = me.data?.isAdmin ?? false;
  const initials = (p?.name ?? "U")
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const mobile = p?.mobile ?? "";
  const masked = mobile.length > 6 ? `${mobile.slice(0, 2)}****${mobile.slice(-4)}` : mobile || "—";

  async function signOut() {
    onClose();
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-foreground/60 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col overflow-y-auto bg-card shadow-pop transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-4 pb-3 pt-5">
          <CoinIcon className="h-8 w-8" />
          <span className="text-2xl font-extrabold tracking-tight">
            <span className="text-foreground">Earn</span>
            <span className="text-primary">Verse</span>
          </span>
        </div>

        <Link
          to="/profile"
          onClick={onClose}
          className="mx-3 flex items-center gap-3 rounded-2xl bg-muted p-3"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-base font-extrabold text-primary-foreground">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-bold text-foreground">
              {p?.name ?? "EarnVerse User"}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{masked}</span>
          </span>
          <span className="text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Balance
            </span>
            <span className="block text-base font-extrabold text-success">{p?.coins ?? 0}</span>
          </span>
        </Link>

        <nav className="mt-3 flex-1 px-3 pb-2">
          {groups.map((g) => (
            <div key={g.title} className="mb-2">
              <p className="px-2 pb-1 pt-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {g.title}
              </p>
              {g.items.map(({ to, label, Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={onClose}
                  activeProps={{ className: "bg-primary/10 text-primary" }}
                  inactiveProps={{ className: "text-foreground" }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}
              {g.title === "More" && isAdmin && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-foreground"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Admin Console
                </Link>
              )}
            </div>
          ))}

          <div className="mb-2">
            <p className="px-2 pb-1 pt-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Social
            </p>
            {socials.map(({ href, label, Logo }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-foreground"
              >
                <Logo className="h-5 w-5" />
                {label}
              </a>
            ))}
          </div>
        </nav>


        <div className="border-t border-border px-3 py-2">
          <button
            onClick={toggle}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-foreground"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-bold text-destructive"
          >
            <LogOut className="h-5 w-5" /> Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}
