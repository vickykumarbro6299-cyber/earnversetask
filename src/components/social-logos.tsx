/** Official-style brand marks for social links. */

export function YouTubeLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className} role="img" aria-label="YouTube">
      <path
        fill="#FF0000"
        d="M27.4 3.1c-.3-1.2-1.3-2.2-2.5-2.5C22.7 0 14 0 14 0S5.3 0 3.1.6C1.9.9.9 1.9.6 3.1 0 5.3 0 10 0 10s0 4.7.6 6.9c.3 1.2 1.3 2.2 2.5 2.5C5.3 20 14 20 14 20s8.7 0 10.9-.6c1.2-.3 2.2-1.3 2.5-2.5.6-2.2.6-6.9.6-6.9s0-4.7-.6-6.9z"
      />
      <path fill="#fff" d="M11.2 14.3V5.7L18.5 10l-7.3 4.3z" />
    </svg>
  );
}

export function FacebookLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Facebook">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M16.5 12h-2.7v8h-3.6v-8H8.4V9.3h1.8V7.5c0-2.1 1-3.5 3.7-3.5h2.6v2.9h-1.9c-.9 0-1.1.4-1.1 1.1v1.3h3.1l-.5 2.7z"
      />
    </svg>
  );
}

export function AppLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="App task">
      <rect x="2" y="2" width="9" height="9" rx="2.5" fill="#4285F4" />
      <rect x="13" y="2" width="9" height="9" rx="2.5" fill="#EA4335" />
      <rect x="2" y="13" width="9" height="9" rx="2.5" fill="#FBBC05" />
      <rect x="13" y="13" width="9" height="9" rx="4.5" fill="#34A853" />
    </svg>
  );
}

export function OtherLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Other">
      <circle cx="12" cy="12" r="11" fill="oklch(0.85 0.17 88)" />
      <path
        fill="oklch(0.3 0.1 70)"
        d="M12 4.5l2.2 4.5 5 .7-3.6 3.5.9 4.9L12 15.9l-4.5 2.2.9-4.9-3.6-3.5 5-.7z"
      />
    </svg>
  );
}
export function TelegramLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" className={className} role="img" aria-label="Telegram">
      <circle cx="120" cy="120" r="120" fill="#2AABEE" />
      <path
        fill="#fff"
        d="M53 118.5l112-43.2c5.2-1.9 9.7 1.3 8 9.1l-19.1 90c-1.4 6.3-5.2 7.8-10.5 4.9l-29-21.4-14 13.5c-1.5 1.5-2.8 2.8-5.8 2.8l2-29.5 53.7-48.5c2.3-2-.5-3.2-3.6-1.2l-66.4 41.8-28.6-8.9c-6.2-2-6.4-6.3 1.3-9.4z"
      />
    </svg>
  );
}

export function InstagramLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Instagram">
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="6" fill="url(#ig-grad)" />
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="4.5"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3.6" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="16.9" cy="7.1" r="1.1" fill="#fff" />
    </svg>
  );
}

export function GmailLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Gmail">
      <path fill="#EA4335" d="M2 6.5l4.8 3.6L2 18V6.5z" />
      <path fill="#34A853" d="M22 6.5v11.5l-4.8-7.9L22 6.5z" />
      <path fill="#FBBC05" d="M22 6.5l-4.8 3.6L12 12 6.8 10.1 2 6.5l10-7.5 10 7.5z" />
      <path fill="#C5221F" d="M2 6.5v11.5l4.8-7.9L2 6.5z" />
      <path fill="#4285F4" d="M6.8 10.1V20h10.4v-9.9L12 12l-5.2-1.9z" />
    </svg>
  );
}
