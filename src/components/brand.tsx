import coinImg from "@/assets/earnverse-coin.png";

export function CoinIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground shadow-card ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[62%] w-[62%]">
        <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
      </svg>
    </span>
  );
}

export function BrandMark({ className = "h-40 w-40" }: { className?: string }) {
  return (
    <img
      src={coinImg}
      alt="EarnVerse coin logo"
      width={1024}
      height={1024}
      className={className}
    />
  );
}

export function Wordmark({ className = "text-5xl" }: { className?: string }) {
  return (
    <h1 className={`font-extrabold tracking-tight ${className}`}>
      <span className="text-primary-foreground">Earn</span>
      <span className="text-gold">Verse</span>
    </h1>
  );
}
