import { Button, GradientText } from "@/components/marketing/primitives";
import { IconArrowRight, IconPlay, IconStar } from "@/components/marketing/icons";

const ShapePlate = ({ delay = 0, width = 600, height = 140, rotate = 0, gradient, style = {} }) => {
  return (
    <div
      style={{
        position: "absolute",
        opacity: 0,
        animation: `heroShapeIn 2.4s cubic-bezier(.2,.8,.2,1) ${delay}s forwards, heroShapeFloat 12s ease-in-out ${delay + 2}s infinite`,
        ...style
      }}
    >
      <div style={{ position: "relative", width, height, transform: `rotate(${rotate}deg)` }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            background: gradient,
            backdropFilter: "blur(2px)",
            border: "2px solid rgba(255,255,255,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.2), inset 0 0 40px rgba(255,255,255,0.1)"
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.2), transparent 70%)",
            mixBlendMode: "plus-lighter"
          }}
        />
      </div>
    </div>
  );
};

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
    @keyframes heroTextIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes sheen {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `}</style>
);

const HeroGeometric = ({ onPrimary, onSecondary }) => {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 20%, #1a0f35 0%, #0A0A1A 60%)"
      }}
    >
      <HeroKeyframes />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(184,164,255,0.08), transparent 50%, rgba(255,180,162,0.05))",
          pointerEvents: "none"
        }}
      />

      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <ShapePlate
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="linear-gradient(135deg, rgba(184,164,255,0.6), rgba(184,164,255,0.1))"
          style={{ left: "-10%", top: "15%" }}
        />
        <ShapePlate
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="linear-gradient(135deg, rgba(255,180,162,0.55), rgba(255,180,162,0.1))"
          style={{ right: "-5%", top: "68%" }}
        />
        <ShapePlate
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="linear-gradient(135deg, rgba(168,230,207,0.6), rgba(168,230,207,0.1))"
          style={{ left: "5%", bottom: "10%" }}
        />
        <ShapePlate
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="linear-gradient(135deg, rgba(244,166,192,0.55), rgba(244,166,192,0.1))"
          style={{ right: "15%", top: "15%" }}
        />
        <ShapePlate
          delay={0.7}
          width={150}
          height={45}
          rotate={-25}
          gradient="linear-gradient(135deg, rgba(217,184,255,0.5), rgba(217,184,255,0.1))"
          style={{ left: "20%", top: "10%" }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, transparent 65%, #0A0A1A)",
          pointerEvents: "none"
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 3,
          maxWidth: 1040,
          width: "100%",
          padding: "120px 32px 100px",
          textAlign: "center"
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 16px 8px 14px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            marginBottom: 36,
            opacity: 0,
            animation: "heroTextIn 0.8s 0.2s forwards"
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: "linear-gradient(135deg, #B8A4FF, #A8E6CF)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10
            }}
          >
            *
          </span>
          <span style={{ fontSize: 13, color: "var(--ink-muted)", letterSpacing: 0.3 }}>
            CalmBand - Bienestar infantil con IA
          </span>
        </div>

        <h1
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: "clamp(52px, 8vw, 96px)",
            lineHeight: 1.02,
            fontWeight: 500,
            margin: "0 0 28px",
            letterSpacing: "-0.03em",
            opacity: 0,
            animation: "heroTextIn 0.9s 0.45s forwards"
          }}
        >
          <span style={{ display: "block", color: "var(--ink)" }}>Tranquilidad para</span>
          <span style={{ display: "block" }}>
            <GradientText>tus hijos,</GradientText>
          </span>
          <span
            style={{
              display: "block",
              color: "var(--ink-muted)",
              fontStyle: "italic",
              fontWeight: 400
            }}
          >
            paz para ti.
          </span>
        </h1>

        <p
          style={{
            maxWidth: 620,
            margin: "0 auto 44px",
            fontSize: "clamp(16px, 1.6vw, 19px)",
            lineHeight: 1.6,
            color: "var(--ink-dim)",
            fontWeight: 400,
            opacity: 0,
            animation: "heroTextIn 0.9s 0.7s forwards"
          }}
        >
          La pulsera inteligente que detecta el estres de tus hijos en tiempo real y les ensena a
          calmarse con ejercicios guiados por IA.
        </p>

        <div
          style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            flexWrap: "wrap",
            opacity: 0,
            animation: "heroTextIn 0.9s 0.9s forwards"
          }}
        >
          <Button size="lg" onClick={onPrimary}>
            Empezar gratis <IconArrowRight size={16} />
          </Button>
          <Button size="lg" variant="glass" onClick={onSecondary}>
            <IconPlay size={14} /> Ver como funciona
          </Button>
        </div>

        <div
          style={{
            marginTop: 72,
            display: "flex",
            justifyContent: "center",
            gap: 36,
            flexWrap: "wrap",
            color: "var(--ink-faint)",
            fontSize: 13,
            opacity: 0,
            animation: "heroTextIn 0.9s 1.1s forwards"
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-flex", gap: 2 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <IconStar key={i} size={12} style={{ fill: "#F5D06F", color: "#F5D06F" }} />
              ))}
            </span>
            4.9 en App Store
          </span>
          <span>-</span>
          <span>+12,000 familias</span>
          <span>-</span>
          <span>Respaldado por pediatras</span>
        </div>
      </div>
    </section>
  );
};

export default HeroGeometric;
