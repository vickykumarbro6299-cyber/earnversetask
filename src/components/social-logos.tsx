/** Official-style brand marks for social links. */
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
