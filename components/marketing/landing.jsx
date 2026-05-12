import React from "react";
import Bracelet from "@/components/marketing/bracelet";
import HeroGeometric from "@/components/marketing/hero";
import { Button, GradientText, SectionLabel } from "@/components/marketing/primitives";
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
  IconWind,
} from "@/components/marketing/icons";

const smoothScroll = (id) => {
  if (typeof window === "undefined") return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

// ─── NavBar ───────────────────────────────────────────────────────────────────
const NavBar = ({ onSignIn, onSignUp }) => {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between transition-all duration-300 ${
        scrolled
          ? "py-3.5 px-6 sm:px-8 bg-[rgba(10,10,26,0.72)] backdrop-blur-xl backdrop-saturate-150 border-b border-white/[0.06]"
          : "py-5 px-6 sm:px-8 bg-transparent border-b border-transparent"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #B8A4FF, #A8E6CF)",
            boxShadow: "0 4px 16px rgba(184,164,255,0.4)",
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[#0A0A1A]" />
        </div>
        <span className="font-bold text-[17px] tracking-tight">CalmBand</span>
      </div>
      <div className="nav-links hidden md:flex gap-8 text-sm text-ink-muted">
        {[
          ["#producto", "Producto"],
          ["#features", "Características"],
          ["#how-it-works", "Cómo funciona"],
          ["#testimonials", "Familias"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            onClick={(e) => {
              e.preventDefault();
              smoothScroll(href.slice(1));
            }}
            className="cursor-pointer no-underline text-inherit hover:text-ink transition-colors"
          >
            {label}
          </a>
        ))}
      </div>
      <div className="flex gap-2">
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

// ─── FeatureCard ──────────────────────────────────────────────────────────────
const FeatureCard = ({ icon, title, desc, accent, delay }) => (
  <div
    className="card-elevated p-7 opacity-0 transition-transform hover:-translate-y-1"
    style={{
      animation: `heroTextIn 0.7s ${delay}s forwards`,
      "--card-glow": `${accent}33`,
    }}
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
      style={{
        background: `linear-gradient(135deg, ${accent}40, ${accent}10)`,
        border: `1px solid ${accent}30`,
        color: accent,
      }}
    >
      {icon}
    </div>
    <h3 className="text-lg font-semibold m-0 mb-2 tracking-tight">{title}</h3>
    <p className="text-sm leading-relaxed text-ink-dim m-0">{desc}</p>
  </div>
);

// ─── Features ─────────────────────────────────────────────────────────────────
const Features = () => (
  <section id="features" className="py-24 sm:py-32 px-6 sm:px-8 relative">
    {/* Aurora regional */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(184,164,255,0.08), transparent 70%)",
      }}
    />
    <div className="max-w-[1160px] mx-auto relative">
      <div className="text-center mb-16">
        <SectionLabel>Características</SectionLabel>
        <h2
          className="font-display font-medium m-0 mb-4 mx-auto max-w-[700px] leading-[1.1]"
          style={{ fontSize: "clamp(36px, 5vw, 56px)", letterSpacing: "-0.02em" }}
        >
          Diseñado para <GradientText>proteger lo que más importa</GradientText>
        </h2>
        <p className="text-ink-dim max-w-[540px] mx-auto text-base leading-relaxed">
          Tecnología médica suave, IA empática y una experiencia que los niños aman usar.
        </p>
      </div>

      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
      >
        <FeatureCard delay={0.05} accent="#B8A4FF" icon={<IconHeart size={22} />}
          title="Monitoreo continuo"
          desc="HRV, ritmo cardíaco y temperatura en tiempo real. Sin que el niño lo note." />
        <FeatureCard delay={0.1} accent="#A8E6CF" icon={<IconBrain size={22} />}
          title="IA empática"
          desc="Detecta patrones de ansiedad y recomienda la actividad adecuada a cada edad." />
        <FeatureCard delay={0.15} accent="#FFB4A2" icon={<IconWind size={22} />}
          title="Respiración guiada"
          desc="Ejercicios animados que los niños siguen con una mascota. Calman en 2 minutos." />
        <FeatureCard delay={0.2} accent="#F4A6C0" icon={<IconBell size={22} />}
          title="Alertas para padres"
          desc="Avisos discretos cuando tu hijo necesita atención, no para vigilarlo: para ayudarlo." />
        <FeatureCard delay={0.25} accent="#B8A4FF" icon={<IconShield size={22} />}
          title="Privacidad total"
          desc="Los datos se quedan contigo. Cifrado de extremo a extremo. Sin venta a terceros." />
        <FeatureCard delay={0.3} accent="#A8E6CF" icon={<IconSparkles size={22} />}
          title="Mini-juegos y música"
          desc="Herramientas de regulación emocional que parecen juego. Diseñadas con psicólogas." />
      </div>
    </div>
  </section>
);

// ─── BraceletShowcase ─────────────────────────────────────────────────────────
const BraceletShowcase = () => (
  <section id="producto" className="py-20 sm:py-28 px-6 sm:px-8 relative overflow-hidden">
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 50% 60% at 25% 50%, rgba(184,164,255,0.10), transparent 60%)",
      }}
    />
    <div className="max-w-[1160px] mx-auto grid gap-12 lg:gap-16 lg:grid-cols-2 items-center relative">
      <div>
        <SectionLabel>La pulsera</SectionLabel>
        <h2
          className="font-display font-medium m-0 mb-5 leading-[1.1]"
          style={{ fontSize: "clamp(36px, 4.5vw, 52px)", letterSpacing: "-0.02em" }}
        >
          Ligera. Suave. <em className="text-ink-muted">Olvidate de que está ahí.</em>
        </h2>
        <p className="text-ink-dim text-base leading-relaxed mb-7">
          Silicona médica hipoalergénica en tres colores. Batería de 7 días. Resistente al agua.
          Diseñada para muñecas desde los 5 años.
        </p>

        <div className="flex gap-3 mb-7 flex-wrap">
          {[
            { c: "#B8A4FF", name: "Lavanda" },
            { c: "#A8E6CF", name: "Menta" },
            { c: "#FFB4A2", name: "Coral" },
          ].map((tone) => (
            <div
              key={tone.c}
              className="inline-flex items-center gap-2 pl-2.5 pr-3.5 py-2 border border-white/10 rounded-full bg-white/[0.03] text-[13px] text-ink-muted"
            >
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ background: tone.c, boxShadow: `0 0 10px ${tone.c}55` }}
              />
              {tone.name}
            </div>
          ))}
        </div>

        <div className="flex gap-8 text-[13px] text-ink-dim">
          {[
            ["7d", "Batería"],
            ["18g", "Peso"],
            ["IP68", "Al agua"],
          ].map(([num, label]) => (
            <div key={label}>
              <div className="font-display text-2xl font-medium text-ink mb-0.5">{num}</div>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <Bracelet size={420} tone="lavender" />
      </div>
    </div>
  </section>
);

// ─── HowItWorks ───────────────────────────────────────────────────────────────
const HowItWorks = () => {
  const steps = [
    {
      n: "01", title: "La pulsera escucha",
      desc: "Sensores biométricos detectan signos tempranos de ansiedad en tu hijo.",
      icon: <IconWatch size={20} />, color: "#B8A4FF",
    },
    {
      n: "02", title: "La IA entiende",
      desc: "Patrones de HRV + contexto de la hora y actividad se traducen en un nivel de calma.",
      icon: <IconBrain size={20} />, color: "#A8E6CF",
    },
    {
      n: "03", title: "Tu hijo se calma",
      desc: "La pulsera se prende una luz suave y sugiere un ejercicio de respiración o un minijuego.",
      icon: <IconWind size={20} />, color: "#FFB4A2",
    },
    {
      n: "04", title: "Tu te enteras",
      desc: "Un resumen claro en el dashboard. Sin alarmas innecesarias, solo lo importante.",
      icon: <IconSmartphone size={20} />, color: "#F4A6C0",
    },
  ];
  return (
    <section id="how-it-works" className="py-24 sm:py-32 px-6 sm:px-8 relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 55% at 75% 50%, rgba(168,230,207,0.08), transparent 65%)",
        }}
      />
      <div className="max-w-[1160px] mx-auto relative">
        <div className="text-center mb-16 sm:mb-20">
          <SectionLabel>Cómo funciona</SectionLabel>
          <h2
            className="font-display font-medium m-0 mb-4 mx-auto max-w-[700px] leading-[1.1]"
            style={{ fontSize: "clamp(36px, 5vw, 56px)", letterSpacing: "-0.02em" }}
          >
            Cuatro pasos. <GradientText>Un momento de calma.</GradientText>
          </h2>
        </div>

        <div className="grid gap-4">
          {steps.map((step) => (
            <div
              key={step.n}
              className="card-elevated p-6 sm:p-7 grid items-center gap-5 sm:gap-6 grid-cols-[60px_44px_1fr_auto] sm:grid-cols-[80px_44px_1fr_auto] hover:-translate-y-0.5 transition-transform"
              style={{ "--card-glow": `${step.color}22` }}
            >
              <div
                className="font-display italic font-normal"
                style={{ fontSize: "clamp(28px, 3vw, 36px)", color: step.color, opacity: 0.55 }}
              >
                {step.n}
              </div>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${step.color}30, ${step.color}08)`,
                  border: `1px solid ${step.color}30`,
                  color: step.color,
                }}
              >
                {step.icon}
              </div>
              <div>
                <h3 className="m-0 mb-1 text-base sm:text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="m-0 text-ink-dim text-[13px] sm:text-sm leading-relaxed">{step.desc}</p>
              </div>
              <IconChevronRight size={18} className="text-ink-faint" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Testimonials ─────────────────────────────────────────────────────────────
const Testimonials = () => {
  const quotes = [
    {
      q: "Mi hijo pasó de tener crisis cada semana a manejarlas solo con los ejercicios. Ha sido transformador.",
      name: "Marcela R.", role: "Mamá de Simón, 10 años", color: "#B8A4FF",
    },
    {
      q: "Como pediatra, lo recomiendo. Los datos de HRV son consistentes y los ejercicios están bien diseñados.",
      name: "Dr. Andrés Luna", role: "Pediatra, CDMX", color: "#A8E6CF",
    },
    {
      q: "Lo mejor: no se siente invasiva. Mi hijo piensa que es un reloj guay y yo tengo tranquilidad.",
      name: "Pablo M.", role: "Papá de Mateo, 10 años", color: "#FFB4A2",
    },
  ];
  return (
    <section id="testimonials" className="py-24 sm:py-32 px-6 sm:px-8 relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 40% 30%, rgba(244,166,192,0.08), transparent 65%)",
        }}
      />
      <div className="max-w-[1160px] mx-auto relative">
        <div className="text-center mb-14">
          <SectionLabel>Familias</SectionLabel>
          <h2
            className="font-display font-medium m-0 mb-4 mx-auto max-w-[720px] leading-[1.1]"
            style={{ fontSize: "clamp(36px, 5vw, 56px)", letterSpacing: "-0.02em" }}
          >
            Lo que dicen quienes ya <em className="text-ink-muted">duermen mejor</em>.
          </h2>
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {quotes.map((item, index) => (
            <div
              key={index}
              className="card-elevated p-7 hover:-translate-y-1 transition-transform"
              style={{ "--card-glow": `${item.color}33` }}
            >
              <div className="flex gap-0.5 mb-4">
                {[0, 1, 2, 3, 4].map((star) => (
                  <IconStar key={star} size={14} style={{ fill: "#F5D06F", color: "#F5D06F" }} />
                ))}
              </div>
              <p className="font-display text-[19px] leading-snug font-normal m-0 mb-6 text-ink">
                &ldquo;{item.q}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-line">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[#0A0A1A]"
                  style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}55)` }}
                >
                  {item.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-xs text-ink-dim">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── FinalCTA ─────────────────────────────────────────────────────────────────
const FinalCTA = ({ onSignUp, onTalk }) => (
  <section id="pricing" className="py-24 sm:py-28 px-6 sm:px-8 relative">
    <div
      className="max-w-[960px] mx-auto relative rounded-[32px] overflow-hidden py-16 sm:py-20 px-6 sm:px-8 text-center"
      style={{
        background:
          "linear-gradient(135deg, rgba(184,164,255,0.14), rgba(168,230,207,0.08) 50%, rgba(255,180,162,0.14))",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
        boxShadow:
          "0 32px 80px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 120px -20px rgba(184,164,255,0.4)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(184,164,255,0.2), transparent 70%)" }}
      />
      <div className="relative">
        <h2
          className="font-display font-medium m-0 mb-4 mx-auto max-w-[620px] leading-[1.1]"
          style={{ fontSize: "clamp(36px, 5vw, 56px)", letterSpacing: "-0.02em" }}
        >
          Dale a tu hijo la <GradientText>herramienta que tú no tuviste</GradientText>.
        </h2>
        <p className="text-ink-dim text-base leading-relaxed max-w-[480px] mx-auto mb-8">
          30 días de prueba. Sin compromiso. Incluye pulsera, app y sesión inicial con psicóloga.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button size="lg" onClick={onSignUp}>
            Empezar prueba gratis <IconArrowRight size={16} />
          </Button>
          <Button size="lg" variant="glass" onClick={onTalk}>
            Hablar con una experta
          </Button>
        </div>
        <div className="mt-6 text-xs text-ink-faint">Envío en 48h · Garantía de 90 días</div>
      </div>
    </div>
  </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="py-10 px-6 sm:px-8 pb-16 border-t border-line">
    <div className="max-w-[1160px] mx-auto flex justify-between flex-wrap gap-5 text-[13px] text-ink-dim">
      <div className="flex items-center gap-2.5">
        <div
          className="w-[22px] h-[22px] rounded-md"
          style={{ background: "linear-gradient(135deg, #B8A4FF, #A8E6CF)" }}
        />
        <span className="text-ink font-semibold">CalmBand</span>
        <span>© 2026</span>
      </div>
      <div className="flex gap-6">
        <a href="#precios" className="no-underline text-inherit hover:text-ink transition-colors">Privacidad</a>
        <a href="#precios" className="no-underline text-inherit hover:text-ink transition-colors">Términos</a>
        <a href="#precios" className="no-underline text-inherit hover:text-ink transition-colors">Soporte</a>
        <a href="mailto:hola@calmband.com" className="no-underline text-inherit hover:text-ink transition-colors">Contacto</a>
      </div>
    </div>
  </footer>
);

// ─── Página completa ─────────────────────────────────────────────────────────
const LandingPage = ({ onSignUp, onSignIn, onTalk }) => {
  const handleSecondary = () => smoothScroll("features");
  return (
    <div className="bg-[#0A0A1A] text-ink">
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
