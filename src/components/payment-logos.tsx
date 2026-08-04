import upiLogo from "@/assets/upi-logo.png.asset.json";

export function UpiLogo({ className = "h-5" }: { className?: string }) {
  return <img src={upiLogo.url} alt="UPI — Unified Payments Interface" className={className} />;
}

/** Google Play triangle mark. */
export function GooglePlayLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-label="Google Play" role="img">
      <path fill="#00d0ff" d="M47 25 322 256 47 487c-9-6-15-17-15-31V56c0-14 6-25 15-31z" />
      <path fill="#00f076" d="M47 25c8-5 19-5 30 1l288 163-43 67L47 25z" />
      <path fill="#ffd400" d="M365 189l67 38c22 13 22 45 0 58l-67 38-43-67 43-67z" />
      <path fill="#f9413f" d="M322 323l43 67-288 163c-11 6-22 6-30 1l275-231z" />
    </svg>
  );
}
