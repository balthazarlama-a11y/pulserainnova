import { Button, GradientText } from "@/components/marketing/primitives";
import { IconArrowRight, IconPlay, IconStar } from "@/components/marketing/icons";

const ShapePlate = ({ delay = 0, width = 600, height = 140, rotate = 0, gradient, className = "" }) => (
  <div
    className={`absolute opacity-0 ${className}`}
    style={{
      animation: `heroShapeIn 2.4s cubic-bezier(.2,.8,.2,1) ${delay}s forwards, heroShapeFloat 12s ease-in-out ${delay + 2}s infinite`,
    }}
  >
    <div className="relative" style={{ width, height, transform: `rotate(${rotate}deg)` }}>
      <div
        className="absolute inset-0 rounded-full backdrop-blur-[2px] border-2 border-white/15"
        style={{
          background: gradient,
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.2), inset 0 0 40px rgba(255,255,255,0.1)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full mix-blend-plus-lighter"
        style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.2), transparent 70%)" }}
      />
    </div>
  </div>
);

const HeroKeyframes = () => (
  <style>{`
    @keyframes heroShapeIn {
      0%   { opacity: 0; transform: translateY(-120px) rotate(0deg) scale(0.9); }
      100% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
    }
    @keyframes heroShapeFloat {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(14px); }
    }
  `}</style>
);

const HeroGeometric = ({ onPrimary, onSecondary }) => {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 20%, #1a0f35 0%, #0A0A1A 60%)" }}
    >
      <HeroKeyframes />

      {/* Aurora wash diagonal */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(184,164,255,0.10), transparent 50%, rgba(255,180,162,0.06))" }}
      />

      {/* Halo de fondo */}
      <div className="aurora-layer animate-aurora-shift" aria-hidden style={{ "--aurora": "#B8A4FF" }} />

      {/* Plates flotantes */}
      <div className="absolute inset-0 overflow-hidden">
        <ShapePlate delay={0.3} width={600} height={140} rotate={12}
          gradient="linear-gradient(135deg, rgba(184,164,255,0.6), rgba(184,164,255,0.1))"
          className="left-[-10%] top-[15%]" />
        <ShapePlate delay={0.5} width={500} height={120} rotate={-15}
          gradient="linear-gradient(135deg, rgba(255,180,162,0.55), rgba(255,180,162,0.1))"
          className="right-[-5%] top-[68%]" />
        <ShapePlate delay={0.4} width={300} height={80} rotate={-8}
          gradient="linear-gradient(135deg, rgba(168,230,207,0.6), rgba(168,230,207,0.1))"
          className="left-[5%] bottom-[10%]" />
        <ShapePlate delay={0.6} width={200} height={60} rotate={20}
          gradient="linear-gradient(135deg, rgba(244,166,192,0.55), rgba(244,166,192,0.1))"
          className="right-[15%] top-[15%]" />
        <ShapePlate delay={0.7} width={150} height={45} rotate={-25}
          gradient="linear-gradient(135deg, rgba(217,184,255,0.5), rgba(217,184,255,0.1))"
          className="left-[20%] top-[10%]" />
      </div>

      {/* Vignette inferior */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, transparent 65%, #0A0A1A)" }}
      />

      <div className="relative z-[3] w-full max-w-[1040px] px-6 sm:px-8 py-24 sm:py-32 text-center">
        {/* Pill arriba */}
        <div
          className="inline-flex items-center gap-2.5 pl-3.5 pr-4 py-2 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-2xl mb-9 opacity-0"
          style={{ animation: "heroTextIn 0.8s 0.2s forwards" }}
        >
          <span className="w-[18px] h-[18px] rounded-md inline-flex items-center justify-center text-[10px]"
                style={{ background: "linear-gradient(135deg, #B8A4FF, #A8E6CF)" }}>
            *
          </span>
          <span className="text-[13px] text-ink-muted tracking-wide">
            CalmBand — Bienestar infantil con IA
          </span>
        </div>

        {/* Headline editorial */}
        <h1
          className="font-display font-medium m-0 mb-7 leading-[1.02] opacity-0"
          style={{
            fontSize: "clamp(52px, 8vw, 96px)",
            letterSpacing: "-0.03em",
            animation: "heroTextIn 0.9s 0.45s forwards",
          }}
        >
          <span className="block text-ink">Tranquilidad para</span>
          <span className="block"><GradientText>tus hijos,</GradientText></span>
          <span className="block text-ink-muted italic font-normal">paz para ti.</span>
        </h1>

        <p
          className="max-w-[620px] mx-auto mb-11 leading-relaxed text-ink-dim opacity-0"
          style={{
            fontSize: "clamp(16px, 1.6vw, 19px)",
            animation: "heroTextIn 0.9s 0.7s forwards",
          }}
        >
          La pulsera inteligente que detecta el estrés de tus hijos en tiempo real y les enseña a
          calmarse con ejercicios guiados por IA.
        </p>

        {/* CTAs */}
        <div
          className="flex gap-3.5 justify-center flex-wrap opacity-0"
          style={{ animation: "heroTextIn 0.9s 0.9s forwards" }}
        >
          <Button size="lg" onClick={onPrimary}>
            Empezar gratis <IconArrowRight size={16} />
          </Button>
          <Button size="lg" variant="glass" onClick={onSecondary}>
            <IconPlay size={14} /> Ver cómo funciona
          </Button>
        </div>

        {/* Social proof */}
        <div
          className="mt-16 sm:mt-20 flex justify-center gap-9 flex-wrap text-ink-faint text-[13px] opacity-0"
          style={{ animation: "heroTextIn 0.9s 1.1s forwards" }}
        >
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <IconStar key={i} size={12} style={{ fill: "#F5D06F", color: "#F5D06F" }} />
              ))}
            </span>
            4.9 en App Store
          </span>
          <span className="opacity-40">·</span>
          <span>+12,000 familias</span>
          <span className="opacity-40">·</span>
          <span>Respaldado por pediatras</span>
        </div>
      </div>
    </section>
  );
};

export default HeroGeometric;
