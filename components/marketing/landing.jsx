import React from "react";
import Bracelet from "@/components/marketing/bracelet";
import HeroGeometric from "@/components/marketing/hero";
import {
  Button,
  Card,
  GradientText,
  SectionLabel
} from "@/components/marketing/primitives";
import {
  IconArrowRight,
  IconBell,
  IconBrain,
  IconChevronRight,
  IconHeart,
  IconShield,
  IconSmartphone,
  IconSparkles,
  IconStar,
  IconWatch,
  IconWind
} from "@/components/marketing/icons";

const smoothScroll = (id) => {
  if (typeof window === "undefined") return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const NavBar = ({ onSignIn, onSignUp }) => {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: scrolled ? "14px 32px" : "20px 32px",
        background: scrolled ? "rgba(10,10,26,0.72)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        transition: "all 0.3s ease"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "linear-gradient(135deg, #B8A4FF, #A8E6CF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(184,164,255,0.4)"
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: 5, background: "#0A0A1A" }} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.3 }}>CalmBand</span>
      </div>
      <div style={{ display: "flex", gap: 32, fontSize: 14, color: "var(--ink-muted)" }} className="nav-links">
        <a href="#producto" onClick={(e) => { e.preventDefault(); smoothScroll("producto"); }} style={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}>
          Producto
        </a>
        <a href="#features" onClick={(e) => { e.preventDefault(); smoothScroll("features"); }} style={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}>
          Características
        </a>
        <a href="#how-it-works" onClick={(e) => { e.preventDefault(); smoothScroll("how-it-works"); }} style={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}>
          Cómo funciona
        </a>
        <a href="#testimonials" onClick={(e) => { e.preventDefault(); smoothScroll("testimonials"); }} style={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}>
          Familias
        </a>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="ghost" size="sm" onClick={onSignIn}>
          Iniciar sesión
        </Button>
        <Button size="sm" onClick={onSignUp}>
          Empezar
        </Button>
      </div>
    </nav>
  );
};

const FeatureCard = ({ icon, title, desc, accent, delay }) => (
  <Card
    hover
    style={{
      padding: 28,
      opacity: 0,
      animation: `heroTextIn 0.7s ${delay}s forwards`
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${accent}40, ${accent}10)`,
        border: `1px solid ${accent}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: accent,
        marginBottom: 20
      }}
    >
      {icon}
    </div>
    <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", letterSpacing: -0.2 }}>{title}</h3>
    <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-dim)", margin: 0 }}>{desc}</p>
  </Card>
);

const Features = () => (
  <section id="features" style={{ padding: "120px 32px", position: "relative" }}>
    <div style={{ maxWidth: 1160, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <SectionLabel>Caracteristicas</SectionLabel>
        <h2
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 500,
            margin: "0 auto 16px",
            maxWidth: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em"
          }}
        >
          Disenado para <GradientText>proteger lo que mas importa</GradientText>
        </h2>
        <p style={{ color: "var(--ink-dim)", maxWidth: 540, margin: "0 auto", fontSize: 16, lineHeight: 1.55 }}>
          Tecnologia medica suave, IA empatica y una experiencia que los ninos aman usar.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))"
        }}
      >
        <FeatureCard
          delay={0.05}
          accent="#B8A4FF"
          icon={<IconHeart size={22} />}
          title="Monitoreo continuo"
          desc="HRV, ritmo cardiaco y temperatura en tiempo real. Sin que el nino lo note."
        />
        <FeatureCard
          delay={0.1}
          accent="#A8E6CF"
          icon={<IconBrain size={22} />}
          title="IA empatica"
          desc="Detecta patrones de ansiedad y recomienda la actividad adecuada a cada edad."
        />
        <FeatureCard
          delay={0.15}
          accent="#FFB4A2"
          icon={<IconWind size={22} />}
          title="Respiracion guiada"
          desc="Ejercicios animados que los ninos siguen con una mascota. Calman en 2 minutos."
        />
        <FeatureCard
          delay={0.2}
          accent="#F4A6C0"
          icon={<IconBell size={22} />}
          title="Alertas para padres"
          desc="Avisos discretos cuando tu hijo necesita atencion, no para vigilarlo: para ayudarlo."
        />
        <FeatureCard
          delay={0.25}
          accent="#B8A4FF"
          icon={<IconShield size={22} />}
          title="Privacidad total"
          desc="Los datos se quedan contigo. Cifrado de extremo a extremo. Sin venta a terceros."
        />
        <FeatureCard
          delay={0.3}
          accent="#A8E6CF"
          icon={<IconSparkles size={22} />}
          title="Mini-juegos y musica"
          desc="Herramientas de regulacion emocional que parecen juego. Disenadas con psicologas."
        />
      </div>
    </div>
  </section>
);

const BraceletShowcase = () => (
  <section id="producto" style={{ padding: "100px 32px", position: "relative", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 30% 50%, rgba(184,164,255,0.08), transparent 60%)",
        pointerEvents: "none"
      }}
    />
    <div
      style={{
        maxWidth: 1160,
        margin: "0 auto",
        display: "grid",
        gap: 60,
        gridTemplateColumns: "minmax(300px, 1fr) minmax(300px, 1fr)",
        alignItems: "center"
      }}
    >
      <div>
        <SectionLabel>La pulsera</SectionLabel>
        <h2
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: "clamp(36px, 4.5vw, 52px)",
            fontWeight: 500,
            margin: "0 0 20px",
            lineHeight: 1.1,
            letterSpacing: "-0.02em"
          }}
        >
          Ligera. Suave. <em style={{ color: "var(--ink-muted)" }}>Olvidate de que esta ahi.</em>
        </h2>
        <p style={{ color: "var(--ink-dim)", fontSize: 16, lineHeight: 1.65, marginBottom: 28 }}>
          Silicona medica hipoalergenica en tres colores. Bateria de 7 dias. Resistente al agua.
          Disenada para munecas desde los 5 anos.
        </p>
        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          {[
            { c: "#B8A4FF", name: "Lavanda" },
            { c: "#A8E6CF", name: "Menta" },
            { c: "#FFB4A2", name: "Coral" }
          ].map((tone) => (
            <div
              key={tone.c}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px 8px 10px",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.03)",
                fontSize: 13,
                color: "var(--ink-muted)"
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: tone.c,
                  boxShadow: `0 0 10px ${tone.c}55`
                }}
              />
              {tone.name}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 13, color: "var(--ink-dim)" }}>
          <div>
            <div style={{ fontSize: 24, color: "var(--ink)", fontWeight: 600, marginBottom: 2 }}>7d</div>
            Bateria
          </div>
          <div>
            <div style={{ fontSize: 24, color: "var(--ink)", fontWeight: 600, marginBottom: 2 }}>18g</div>
            Peso
          </div>
          <div>
            <div style={{ fontSize: 24, color: "var(--ink)", fontWeight: 600, marginBottom: 2 }}>IP68</div>
            Al agua
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Bracelet size={420} tone="lavender" />
      </div>
    </div>
  </section>
);

const HowItWorks = () => {
  const steps = [
    {
      n: "01",
      title: "La pulsera escucha",
      desc: "Sensores biometricos detectan signos tempranos de ansiedad en tu hijo.",
      icon: <IconWatch size={20} />,
      color: "#B8A4FF"
    },
    {
      n: "02",
      title: "La IA entiende",
      desc: "Patrones de HRV + contexto de la hora y actividad se traducen en un nivel de calma.",
      icon: <IconBrain size={20} />,
      color: "#A8E6CF"
    },
    {
      n: "03",
      title: "Tu hijo se calma",
      desc: "La pulsera se prende una luz suave y sugiere un ejercicio de respiración o un minijuego.",
      icon: <IconWind size={20} />,
      color: "#FFB4A2"
    },
    {
      n: "04",
      title: "Tu te enteras",
      desc: "Un resumen claro en el dashboard. Sin alarmas innecesarias, solo lo importante.",
      icon: <IconSmartphone size={20} />,
      color: "#F4A6C0"
    }
  ];
  return (
    <section id="how-it-works" style={{ padding: "120px 32px", position: "relative" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <SectionLabel>Como funciona</SectionLabel>
          <h2
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 500,
              margin: "0 auto 16px",
              maxWidth: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em"
            }}
          >
            Cuatro pasos. <GradientText>Un momento de calma.</GradientText>
          </h2>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {steps.map((step) => (
            <Card
              key={step.n}
              style={{
                padding: 28,
                display: "grid",
                gridTemplateColumns: "80px 44px 1fr auto",
                alignItems: "center",
                gap: 24
              }}
            >
              <div
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 36,
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: step.color,
                  opacity: 0.55
                }}
              >
                {step.n}
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${step.color}30, ${step.color}08)`,
                  border: `1px solid ${step.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: step.color
                }}
              >
                {step.icon}
              </div>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, letterSpacing: -0.2 }}>
                  {step.title}
                </h3>
                <p style={{ margin: 0, color: "var(--ink-dim)", fontSize: 14, lineHeight: 1.5 }}>{step.desc}</p>
              </div>
              <IconChevronRight size={18} style={{ color: "var(--ink-faint)" }} />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const quotes = [
    {
      q: "Mi hijo pasó de tener crisis cada semana a manejarlas solo con los ejercicios. Ha sido transformador.",
      name: "Marcela R.",
      role: "Mamá de Simón, 10 años",
      color: "#B8A4FF"
    },
    {
      q: "Como pediatra, lo recomiendo. Los datos de HRV son consistentes y los ejercicios estan bien disenados.",
      name: "Dr. Andres Luna",
      role: "Pediatra, CDMX",
      color: "#A8E6CF"
    },
    {
      q: "Lo mejor: no se siente invasiva. Mi hijo piensa que es un reloj guay y yo tengo tranquilidad.",
      name: "Pablo M.",
      role: "Papa de Mateo, 10 anos",
      color: "#FFB4A2"
    }
  ];
  return (
    <section id="testimonials" style={{ padding: "120px 32px", position: "relative" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <SectionLabel>Familias</SectionLabel>
          <h2
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 500,
              margin: "0 auto 16px",
              maxWidth: 720,
              lineHeight: 1.1,
              letterSpacing: "-0.02em"
            }}
          >
            Lo que dicen quienes ya <em style={{ color: "var(--ink-muted)" }}>duermen mejor</em>.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {quotes.map((item, index) => (
            <Card key={index} style={{ padding: 28 }}>
              <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                {[0, 1, 2, 3, 4].map((star) => (
                  <IconStar key={star} size={14} style={{ fill: "#F5D06F", color: "#F5D06F" }} />
                ))}
              </div>
              <p
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 19,
                  lineHeight: 1.45,
                  fontWeight: 400,
                  margin: "0 0 24px",
                  color: "var(--ink)"
                }}
              >
                &quot;{item.q}&quot;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    background: `linear-gradient(135deg, ${item.color}, ${item.color}55)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    color: "#0A0A1A"
                  }}
                >
                  {item.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>{item.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

const FinalCTA = ({ onSignUp, onTalk }) => (
  <section id="pricing" style={{ padding: "100px 32px 140px", position: "relative" }}>
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        position: "relative",
        borderRadius: 32,
        overflow: "hidden",
        padding: "72px 32px",
        textAlign: "center",
        background: "linear-gradient(135deg, rgba(184,164,255,0.12), rgba(168,230,207,0.08) 50%, rgba(255,180,162,0.12))",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, rgba(184,164,255,0.2), transparent 70%)",
          pointerEvents: "none"
        }}
      />
      <div style={{ position: "relative" }}>
        <h2
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 500,
            margin: "0 auto 18px",
            maxWidth: 620,
            lineHeight: 1.1,
            letterSpacing: "-0.02em"
          }}
        >
          Dale a tu hijo la <GradientText>herramienta que tu no tuviste</GradientText>.
        </h2>
        <p style={{ color: "var(--ink-dim)", fontSize: 16, lineHeight: 1.55, maxWidth: 480, margin: "0 auto 32px" }}>
          30 dias de prueba. Sin compromiso. Incluye pulsera, app y sesion inicial con psicologa.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Button size="lg" onClick={onSignUp}>
            Empezar prueba gratis <IconArrowRight size={16} />
          </Button>
          <Button size="lg" variant="glass" onClick={onTalk}>
            Hablar con una experta
          </Button>
        </div>
        <div style={{ marginTop: 24, fontSize: 12, color: "var(--ink-faint)" }}>Envio en 48h - Garantia de 90 dias</div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer style={{ padding: "40px 32px 60px", borderTop: "1px solid var(--border)" }}>
    <div
      style={{
        maxWidth: 1160,
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 20,
        fontSize: 13,
        color: "var(--ink-dim)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: "linear-gradient(135deg, #B8A4FF, #A8E6CF)"
          }}
        />
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>CalmBand</span>
        <span>(c) 2025</span>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        <a href="#precios" style={{ color: "inherit", textDecoration: "none" }}>Privacidad</a>
        <a href="#precios" style={{ color: "inherit", textDecoration: "none" }}>Terminos</a>
        <a href="#precios" style={{ color: "inherit", textDecoration: "none" }}>Soporte</a>
        <a href="mailto:hola@calmband.com" style={{ color: "inherit", textDecoration: "none" }}>Contacto</a>
      </div>
    </div>
  </footer>
);

const LandingPage = ({ onSignUp, onSignIn, onTalk }) => {
  const handleSecondary = () => {
    smoothScroll("features");
  };

  return (
    <div style={{ background: "var(--bg-2)", color: "var(--ink)" }}>
      <NavBar onSignIn={onSignIn} onSignUp={onSignUp} />
      <HeroGeometric onPrimary={onSignUp} onSecondary={handleSecondary} />
      <BraceletShowcase />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FinalCTA onSignUp={onSignUp} onTalk={onTalk} />
      <Footer />
    </div>
  );
};

export default LandingPage;
