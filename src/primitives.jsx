// Shared UI primitives

// Gradient text
const GradientText = ({ children, className = '', style = {} }) => (
  <span className={className} style={{
    background: 'linear-gradient(92deg, #E9D6FF 0%, #B8A4FF 30%, #A8E6CF 65%, #FFB4A2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    ...style
  }}>{children}</span>
);

// Pill badge
const Pill = ({ children, dot, style = {}, onClick }) => (
  <span onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 14px 6px 12px',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.04)',
    fontSize: 13, color: 'var(--ink-muted)',
    letterSpacing: 0.2,
    cursor: onClick ? 'pointer' : 'default',
    ...style
  }}>
    {dot && <span style={{
      width: 6, height: 6, borderRadius: 3, background: dot,
      boxShadow: `0 0 8px ${dot}`
    }}/>}
    {children}
  </span>
);

// Primary button
const Button = ({ children, variant = 'primary', size = 'md', onClick, style = {}, ...rest }) => {
  const sizes = {
    sm: { padding: '8px 14px', fontSize: 13, borderRadius: 10 },
    md: { padding: '12px 20px', fontSize: 14, borderRadius: 12 },
    lg: { padding: '16px 26px', fontSize: 15, borderRadius: 14 }
  };
  const variants = {
    primary: {
      background: 'linear-gradient(180deg, #B8A4FF, #8B7FD8)',
      color: '#0D0824',
      boxShadow: '0 8px 24px -6px rgba(184,164,255,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
      border: '1px solid rgba(255,255,255,0.2)',
      fontWeight: 600
    },
    glass: {
      background: 'rgba(255,255,255,0.06)',
      color: 'var(--ink)',
      border: '1px solid rgba(255,255,255,0.12)',
      backdropFilter: 'blur(20px)',
      fontWeight: 500
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-muted)',
      border: '1px solid transparent',
      fontWeight: 500
    },
    soft: {
      background: 'rgba(184,164,255,0.12)',
      color: '#D4C5FF',
      border: '1px solid rgba(184,164,255,0.25)',
      fontWeight: 500
    }
  };
  return (
    <button onClick={onClick} {...rest} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      cursor: 'pointer',
      transition: 'transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease',
      fontFamily: 'Inter, sans-serif',
      ...sizes[size], ...variants[variant], ...style
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {children}
    </button>
  );
};

// Card
const Card = ({ children, style = {}, hover = false, onClick, ...rest }) => {
  const [h, setH] = React.useState(false);
  return (
    <div onClick={onClick}
         onMouseEnter={() => hover && setH(true)}
         onMouseLeave={() => hover && setH(false)}
         {...rest}
         style={{
      position: 'relative',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.015))',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      transition: 'transform 0.25s ease, border-color 0.25s ease',
      transform: h ? 'translateY(-2px)' : 'none',
      borderColor: h ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }}>
      {children}
    </div>
  );
};

// Section label
const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 12, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase',
    color: 'rgba(184,164,255,0.9)',
    marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 10
  }}>
    <span style={{ width: 28, height: 1, background: 'linear-gradient(90deg, transparent, rgba(184,164,255,0.6))' }}/>
    {children}
  </div>
);

// Maps a stress value (0-100) to state info
const stressState = (v) => {
  if (v <= 30) return { key: 'calm', label: 'Tranquilo', color: 'var(--calm)', hex: '#5EDC9A', range: '0 – 30', mood: '😌' };
  if (v <= 55) return { key: 'mild', label: 'Leve estrés', color: 'var(--mild)', hex: '#F5D06F', range: '31 – 55', mood: '🤔' };
  if (v <= 75) return { key: 'moderate', label: 'Estrés moderado', color: 'var(--moderate)', hex: '#F59E4C', range: '56 – 75', mood: '😟' };
  return { key: 'high', label: 'Ansiedad alta', color: 'var(--high)', hex: '#EC5B6B', range: '76 – 100', mood: '😣' };
};

// Safe portal-free blurred ambient lights
const AmbientOrbs = ({ intense = false }) => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    <div style={{
      position: 'absolute', top: '-10%', left: '-10%',
      width: 600, height: 600, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(184,164,255,0.35), transparent 60%)',
      filter: 'blur(40px)',
      opacity: intense ? 0.9 : 0.6
    }}/>
    <div style={{
      position: 'absolute', bottom: '-20%', right: '-10%',
      width: 700, height: 700, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(168,230,207,0.25), transparent 60%)',
      filter: 'blur(40px)',
      opacity: intense ? 0.8 : 0.5
    }}/>
    <div style={{
      position: 'absolute', top: '30%', right: '25%',
      width: 400, height: 400, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,180,162,0.2), transparent 60%)',
      filter: 'blur(40px)',
      opacity: intense ? 0.7 : 0.4
    }}/>
  </div>
);

Object.assign(window, {
  GradientText, Pill, Button, Card, SectionLabel, stressState, AmbientOrbs
});
