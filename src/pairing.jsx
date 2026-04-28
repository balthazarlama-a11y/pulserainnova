// Pairing screen — OTP 6-digit code entry with success animation

const PairingScreen = ({ onContinue, onBack }) => {
  const [code, setCode] = React.useState(['', '', '', '', '', '']);
  const [step, setStep] = React.useState('code'); // code | verifying | success
  const inputsRef = React.useRef([]);

  const handle = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...code]; next[i] = v; setCode(next);
    if (v && i < 5) inputsRef.current[i+1]?.focus();
    if (next.every(x => x) && next.join('').length === 6) {
      setStep('verifying');
      setTimeout(() => {
        setStep('success');
        setTimeout(onContinue, 1800);
      }, 1500);
    }
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputsRef.current[i-1]?.focus();
  };

  const autofill = () => {
    const demo = ['4','8','2','1','0','5'];
    setCode(demo);
    setStep('verifying');
    setTimeout(() => { setStep('success'); setTimeout(onContinue, 1800); }, 1200);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-2)', position: 'relative', overflow: 'hidden',
      padding: 32
    }}>
      <AmbientOrbs/>

      <button onClick={onBack} style={{
        position: 'absolute', top: 28, left: 28, zIndex: 5,
        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
        color: 'var(--ink-muted)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13
      }}>
        <IconArrowLeft size={14}/> Volver
      </button>

      <div style={{
        maxWidth: 520, width: '100%',
        position: 'relative', zIndex: 2,
        textAlign: 'center'
      }}>
        {step === 'success' ? (
          <div style={{ animation: 'heroTextIn 0.5s forwards' }}>
            <div style={{
              width: 100, height: 100, borderRadius: 50,
              background: 'linear-gradient(135deg, #5EDC9A, #7DD3B8)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px',
              boxShadow: '0 0 0 12px rgba(94,220,154,0.12), 0 0 60px rgba(94,220,154,0.4)',
              animation: 'successPop 0.6s cubic-bezier(.2,1.3,.4,1)'
            }}>
              <IconCheck size={44} stroke={2.5} style={{ color: '#0A2A1A' }}/>
            </div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 40, fontWeight: 500, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              ¡<GradientText>Conectada</GradientText>!
            </h1>
            <p style={{ color: 'var(--ink-dim)', fontSize: 15 }}>
              La pulsera de Sofía está lista para empezar.
            </p>
            <style>{`@keyframes successPop { 0% {transform:scale(0.3);opacity:0;} 60% {transform:scale(1.1);opacity:1;} 100% {transform:scale(1);} }`}</style>
          </div>
        ) : (
          <>
            {/* Animated pulse around bracelet */}
            <div style={{
              position: 'relative', width: 180, height: 180,
              margin: '0 auto 32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {[0, 0.6, 1.2].map(d => (
                <div key={d} style={{
                  position: 'absolute', inset: 20,
                  borderRadius: '50%',
                  border: '2px solid rgba(184,164,255,0.4)',
                  animation: `pulse-ring 2.4s ${d}s ease-out infinite`
                }}/>
              ))}
              <div style={{
                width: 96, height: 96, borderRadius: 48,
                background: 'linear-gradient(135deg, #2a2035, #0f0a1f)',
                border: '1px solid rgba(184,164,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#B8A4FF',
                boxShadow: '0 0 40px rgba(184,164,255,0.3)'
              }}>
                <IconWatch size={42}/>
              </div>
            </div>

            <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(184,164,255,0.9)', fontWeight: 500, marginBottom: 12 }}>
              Paso 2 de 3 · Vinculación
            </div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 500, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Conecta la <GradientText>pulsera</GradientText>
            </h1>
            <p style={{ color: 'var(--ink-dim)', fontSize: 15, lineHeight: 1.55, maxWidth: 400, margin: '0 auto 36px' }}>
              Mantén pulsado el botón lateral de la pulsera 3 segundos. Verás un código en la pantalla.
            </p>

            {/* OTP inputs */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
              {code.map((c, i) => (
                <input
                  key={i}
                  ref={el => inputsRef.current[i] = el}
                  value={c}
                  onChange={e => handle(i, e.target.value)}
                  onKeyDown={e => handleKey(i, e)}
                  inputMode="numeric"
                  maxLength={1}
                  disabled={step === 'verifying'}
                  style={{
                    width: 54, height: 62,
                    textAlign: 'center',
                    fontSize: 26, fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                    borderRadius: 12,
                    border: `1px solid ${c ? 'rgba(184,164,255,0.4)' : 'var(--border-strong)'}`,
                    background: c ? 'rgba(184,164,255,0.08)' : 'rgba(255,255,255,0.03)',
                    color: 'var(--ink)',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxShadow: c ? '0 0 20px rgba(184,164,255,0.15)' : 'none'
                  }}
                />
              ))}
            </div>

            {step === 'verifying' ? (
              <div style={{ color: 'var(--ink-muted)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 14, height: 14, border: '2px solid rgba(184,164,255,0.3)',
                  borderTopColor: '#B8A4FF', borderRadius: 7, animation: 'spin-slow 0.8s linear infinite'
                }}/>
                Verificando...
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>
                ¿No ves el código? <a onClick={autofill} style={{ color: 'rgba(184,164,255,0.85)', textDecoration: 'none', cursor: 'pointer' }}>Demo · autocompletar</a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { PairingScreen });
