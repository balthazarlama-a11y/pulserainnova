const Bracelet = ({ size = 340, tone = "lavender", floating = true, pulse = true }) => {
  const tones = {
    lavender: {
      strap: "linear-gradient(135deg, #C9B8FF 0%, #8B7FD8 40%, #6B5FB0 100%)",
      strapHi: "linear-gradient(180deg, rgba(255,255,255,0.3), transparent 40%)",
      accent: "#B8A4FF",
      screen: "#1a0f2e"
    },
    mint: {
      strap: "linear-gradient(135deg, #B8F0D8 0%, #7DD3B8 40%, #4FB394 100%)",
      strapHi: "linear-gradient(180deg, rgba(255,255,255,0.3), transparent 40%)",
      accent: "#A8E6CF",
      screen: "#0a1f17"
    },
    coral: {
      strap: "linear-gradient(135deg, #FFC9BA 0%, #FF9584 40%, #E06D5C 100%)",
      strapHi: "linear-gradient(180deg, rgba(255,255,255,0.3), transparent 40%)",
      accent: "#FFB4A2",
      screen: "#2e0f0a"
    }
  }[tone];

  const maxWidth = typeof window !== "undefined" ? Math.min(size, window.innerWidth - 64) : size;
  const w = Math.max(240, maxWidth);
  const h = w * 0.85;

  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        animation: floating ? "float 6s ease-in-out infinite" : "none",
        transformStyle: "preserve-3d",
        perspective: 1000
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          background: `radial-gradient(circle, ${tones.accent}44, transparent 60%)`,
          filter: "blur(40px)",
          pointerEvents: "none"
        }}
      />

      <svg viewBox="0 0 400 340" width={w} height={h} style={{ position: "relative", zIndex: 2 }}>
        <defs>
          <linearGradient id={`strap-${tone}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={tone === "lavender" ? "#D4C5FF" : tone === "mint" ? "#C8F5DE" : "#FFD4C8"} />
            <stop offset="45%" stopColor={tone === "lavender" ? "#9B8BE5" : tone === "mint" ? "#85D9BE" : "#FF9E8E"} />
            <stop offset="100%" stopColor={tone === "lavender" ? "#6B5FB0" : tone === "mint" ? "#4FB394" : "#D66756"} />
          </linearGradient>
          <linearGradient id={`strapShade-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
          </linearGradient>
          <linearGradient id={`module-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2035" />
            <stop offset="50%" stopColor="#15101F" />
            <stop offset="100%" stopColor="#05030A" />
          </linearGradient>
          <radialGradient id={`screen-${tone}`} cx="0.5" cy="0.4" r="0.7">
            <stop offset="0%" stopColor={tones.accent} stopOpacity="0.6" />
            <stop offset="45%" stopColor={tones.accent} stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.8" />
          </radialGradient>
          <filter id={`innerShadow-${tone}`}>
            <feGaussianBlur stdDeviation="4" />
            <feOffset dy="2" />
            <feComposite in2="SourceGraphic" operator="arithmetic" k2="-1" k3="1" />
          </filter>
        </defs>

        <path
          d="M 90 70 Q 40 110 50 180 Q 60 250 130 270"
          stroke={`url(#strap-${tone})`}
          strokeWidth="42"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 90 70 Q 40 110 50 180 Q 60 250 130 270"
          stroke={`url(#strapShade-${tone})`}
          strokeWidth="42"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        {[0.15, 0.3, 0.45, 0.6, 0.75].map((t) => {
          const x = 90 + (130 - 90) * t - 20 * Math.sin(t * Math.PI);
          const y = 70 + (270 - 70) * t + 40 * Math.sin(t * Math.PI * 1.1);
          return <circle key={t} cx={x} cy={y} r="2.5" fill="rgba(0,0,0,0.35)" />;
        })}

        <path
          d="M 280 80 Q 350 120 350 190 Q 348 250 290 275"
          stroke={`url(#strap-${tone})`}
          strokeWidth="42"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 280 80 Q 350 120 350 190 Q 348 250 290 275"
          stroke={`url(#strapShade-${tone})`}
          strokeWidth="42"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />

        <g transform="translate(130,70)">
          <rect
            x="0"
            y="0"
            width="160"
            height="200"
            rx="36"
            fill={`url(#module-${tone})`}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
          <rect x="6" y="6" width="148" height="60" rx="30" fill="rgba(255,255,255,0.08)" />
          <rect x="14" y="18" width="132" height="164" rx="26" fill="#000" />
          <rect x="14" y="18" width="132" height="164" rx="26" fill={`url(#screen-${tone})`} />

          <g transform="translate(80,100)" fill="none" stroke={tones.accent} strokeLinecap="round">
            <path
              d="M -44 0 L -28 0 L -22 -18 L -14 22 L -6 -10 L 2 6 L 10 0 L 44 0"
              strokeWidth="2"
              opacity="0.95"
            />
            <text
              x="0"
              y="-30"
              textAnchor="middle"
              fill={tones.accent}
              stroke="none"
              style={{ font: "600 18px Inter", letterSpacing: 0.5 }}
            >
              72
            </text>
            <text
              x="0"
              y="-14"
              textAnchor="middle"
              fill={tones.accent}
              stroke="none"
              opacity="0.6"
              style={{ font: "400 7px Inter", letterSpacing: 1 }}
            >
              BPM
            </text>

            <text
              x="0"
              y="34"
              textAnchor="middle"
              fill={tones.accent}
              stroke="none"
              opacity="0.9"
              style={{ font: "500 8px Inter", letterSpacing: 1.5 }}
            >
              CALMA
            </text>
            <circle r="14" cy="44" stroke={tones.accent} strokeWidth="1.5" opacity="0.4" />
            <path d="M 0 30 A 14 14 0 0 1 12 44" stroke={tones.accent} strokeWidth="1.5" opacity="0.95" />
          </g>

          <rect x="158" y="80" width="4" height="24" rx="2" fill="rgba(255,255,255,0.1)" />
          <path d="M 20 20 L 140 20 L 110 70 L 20 70 Z" fill="rgba(255,255,255,0.04)" />
        </g>

        {pulse && (
          <circle cx="210" cy="170" r="40" fill="none" stroke={tones.accent} strokeWidth="1.5" opacity="0.4">
            <animate attributeName="r" values="30;75" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0" dur="2.5s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
    </div>
  );
};

export default Bracelet;
