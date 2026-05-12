import React from "react";

export const GradientText = ({ children, className = "", style = {} }) => (
  <span
    className={className}
    style={{
      background: "linear-gradient(92deg, var(--brand) 0%, var(--attention) 40%, var(--calm) 70%, var(--danger) 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      ...style
    }}
  >
    {children}
  </span>
);

export const Pill = ({ children, dot, style = {}, onClick }) => (
  <span
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 14px 6px 12px",
      border: "1px solid var(--border-strong)",
      borderRadius: 999,
      background: "var(--surface)",
      fontSize: 13,
      color: "var(--ink-muted)",
      letterSpacing: 0.2,
      cursor: onClick ? "pointer" : "default",
      ...style
    }}
  >
    {dot && (
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: dot,
          boxShadow: `0 0 8px ${dot}`
        }}
      />
    )}
    {children}
  </span>
);

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  style = {},
  ...rest
}) => {
  const sizes = {
    sm: { padding: "8px 14px", fontSize: 13, borderRadius: 10 },
    md: { padding: "12px 20px", fontSize: 14, borderRadius: 12 },
    lg: { padding: "16px 26px", fontSize: 15, borderRadius: 14 }
  };
  const variants = {
    primary: {
      background: "linear-gradient(180deg, var(--brand), rgb(var(--brand-rgb) / 0.78))",
      color: "var(--ink-on-accent)",
      boxShadow: "0 8px 24px -6px rgb(var(--brand-rgb) / 0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
      border: "1px solid rgba(255,255,255,0.2)",
      fontWeight: 600
    },
    glass: {
      background: "var(--surface-elevated)",
      color: "var(--ink)",
      border: "1px solid var(--border-strong)",
      backdropFilter: "blur(20px)",
      fontWeight: 500
    },
    ghost: {
      background: "transparent",
      color: "var(--ink-muted)",
      border: "1px solid transparent",
      fontWeight: 500
    },
    soft: {
      background: "rgb(var(--brand-rgb) / 0.12)",
      color: "var(--brand)",
      border: "1px solid rgb(var(--brand-rgb) / 0.25)",
      fontWeight: 500
    }
  };

  return (
    <button
      onClick={onClick}
      {...rest}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease",
        fontFamily: "Inter, sans-serif",
        ...sizes[size],
        ...variants[variant],
        ...style
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, style = {}, hover = false, onClick, ...rest }) => {
  const [h, setH] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => hover && setH(false)}
      {...rest}
      style={{
        position: "relative",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.4s ease",
        transform: h ? "translateY(-2px)" : "none",
        borderColor: h ? "var(--border-strong)" : "var(--border)",
        boxShadow: "var(--shadow-card), 0 0 32px var(--card-glow, transparent)",
        cursor: onClick ? "pointer" : "default",
        ...style
      }}
    >
      {children}
    </div>
  );
};

export const SectionLabel = ({ children }) => (
  <div
    style={{
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: "rgb(var(--brand-rgb) / 0.9)",
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 10
    }}
  >
    <span
      style={{
        width: 28,
        height: 1,
        background: "linear-gradient(90deg, transparent, rgb(var(--brand-rgb) / 0.6))"
      }}
    />
    {children}
  </div>
);

export const stressState = (value) => {
  if (value <= 30) {
    return { key: "calm", label: "Tranquilo", color: "var(--calm)", hex: "#5EDC9A", range: "0 - 30", mood: ":)" };
  }
  if (value <= 55) {
    return { key: "mild", label: "Leve estrés", color: "var(--mild)", hex: "#F5D06F", range: "31 - 55", mood: ":|" };
  }
  if (value <= 75) {
    return { key: "moderate", label: "Estrés moderado", color: "var(--moderate)", hex: "#EC5B6B", range: "56 - 75", mood: ":/" };
  }
  return { key: "high", label: "Ansiedad alta", color: "var(--high)", hex: "#EC5B6B", range: "76 - 100", mood: ":(" };
};

export const AmbientOrbs = ({ intense = false }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        top: "-10%",
        left: "-10%",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(184,164,255,0.35), transparent 60%)",
        filter: "blur(40px)",
        opacity: intense ? 0.9 : 0.6
      }}
    />
    <div
      style={{
        position: "absolute",
        bottom: "-20%",
        right: "-10%",
        width: 700,
        height: 700,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(94,220,154,0.25), transparent 60%)",
        filter: "blur(40px)",
        opacity: intense ? 0.8 : 0.5
      }}
    />
    <div
      style={{
        position: "absolute",
        top: "30%",
        right: "25%",
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,208,111,0.2), transparent 60%)",
        filter: "blur(40px)",
        opacity: intense ? 0.7 : 0.4
      }}
    />
  </div>
);
