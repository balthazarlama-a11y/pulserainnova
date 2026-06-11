import React from "react";

export const GradientText = ({ children, className = "", style = {} }) => (
  <span
    className={className}
    style={{
      color: "var(--brand)",
      fontWeight: "bold",
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
      gap: 6,
      padding: "4px 10px",
      border: "1px solid var(--border)",
      borderRadius: 8,
      background: "var(--surface)",
      fontSize: 12,
      fontWeight: 500,
      color: "var(--ink-muted)",
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
          background: dot
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
    sm: { padding: "8px 14px", fontSize: 13, borderRadius: 8 },
    md: { padding: "10px 16px", fontSize: 14, borderRadius: 8 },
    lg: { padding: "14px 20px", fontSize: 15, borderRadius: 8 }
  };
  const variants = {
    primary: {
      background: "var(--brand)",
      color: "var(--ink-on-accent)",
      border: "1px solid transparent",
      fontWeight: 600
    },
    glass: {
      background: "var(--surface-elevated)",
      color: "var(--ink)",
      border: "1px solid var(--border-strong)",
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
        transition: "transform 0.15s ease, background 0.2s ease",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
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
        background: "var(--bg-elevated)",
        border: "1px solid",
        borderColor: h ? "var(--border-strong)" : "var(--border)",
        borderRadius: 12,
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        transform: h ? "translateY(-2px)" : "none",
        boxShadow: h ? "0 4px 12px rgba(0,0,0,0.05)" : "var(--shadow-card)",
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
      fontWeight: 600,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--brand)",
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 10
    }}
  >
    <span
      style={{
        width: 24,
        height: 2,
        background: "var(--brand)",
        borderRadius: 2
      }}
    />
    {children}
  </div>
);

export const stressState = (value) => {
  if (value <= 30) {
    return { key: "calm", label: "Tranquilo", color: "var(--calm)", hex: "#2A9D8F", range: "0 - 30", mood: ":)" };
  }
  if (value <= 55) {
    return { key: "mild", label: "Leve estrés", color: "var(--mild)", hex: "#D9A432", range: "31 - 55", mood: ":|" };
  }
  if (value <= 75) {
    return { key: "moderate", label: "Estrés moderado", color: "var(--moderate)", hex: "#DC4D55", range: "56 - 75", mood: ":/" };
  }
  return { key: "high", label: "Ansiedad alta", color: "var(--high)", hex: "#DC4D55", range: "76 - 100", mood: ":(" };
};

export const AmbientOrbs = () => null;
