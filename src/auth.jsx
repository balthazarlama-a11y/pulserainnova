// Auth screen — email/password + Google (visual only)

const AuthScreen = ({ onContinue, onBack }) => {
  const [mode, setMode] = React.useState('signup'); // signup | login
  const [email, setEmail] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const submit = (e) => {
    e?.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onContinue(); }, 900);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-2)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <AmbientOrbs/>

      {/* Left: brand panel */}
      <div style={{
        flex: 1, minWidth: 420,
        padding: '60px 56px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', zIndex: 2,
        borderRight: '1px solid var(--border)'
      }} className="auth-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #B8A4FF, #A8E6CF)'
          }}/>
          <span style={{ fontWeight: 700, fontSize: 17 }}>CalmBand</span>
        </div>

        <div>
          <Bracelet size={360} tone="mint"/>
          <h2 style={{
            fontFamily: 'Fraunces, serif', fontSize: 40, fontWeight: 500,
            margin: '40px 0 16px', maxWidth: 420, lineHeight: 1.1, letterSpacing: '-0.02em'
          }}>
            Un minuto para crear la cuenta. <GradientText>Una vida de calma.</GradientText>
          </h2>
          <p style={{ color: 'var(--ink-dim)', maxWidth: 380, fontSize: 15, lineHeight: 1.55 }}>
            Vincula hasta 4 pulseras por cuenta. Gestiona perfiles de cada hijo desde un solo lugar.
          </p>
        </div>

        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
          Tus datos nunca se venden. Cifrado de extremo a extremo.
        </div>
      </div>

      {/* Right: form */}
      <div style={{
        width: 520, maxWidth: '100%',
        padding: '60px 48px',
        display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 2,
        background: 'rgba(10,10,26,0.55)',
        backdropFilter: 'blur(20px)'
      }}>
        <button onClick={onBack} style={{
          alignSelf: 'flex-start',
          background: 'none', border: 'none', color: 'var(--ink-muted)',
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: 0, fontSize: 13, marginBottom: 40
        }}>
          <IconArrowLeft size={14}/> Volver
        </button>

        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 32 }}>
          {['signup', 'login'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '10px 16px',
              borderRadius: 8, border: 'none', cursor: 'pointer',
              background: mode === m ? 'rgba(184,164,255,0.18)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--ink-dim)',
              fontWeight: 500, fontSize: 13,
              transition: 'all 0.2s'
            }}>
              {m === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          ))}
        </div>

        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 500, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          {mode === 'signup' ? 'Bienvenida a CalmBand' : 'Hola de nuevo'}
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: 14, margin: '0 0 32px' }}>
          {mode === 'signup' ? 'Configura tu cuenta en menos de un minuto.' : 'Continúa donde te quedaste.'}
        </p>

        <Button variant="glass" size="lg" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </Button>
        <Button variant="glass" size="lg" style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }}>
           Continuar con Apple
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 24px', color: 'var(--ink-faint)', fontSize: 12 }}>
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          o con tu email
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-dim)', fontWeight: 500 }}>Email</span>
            <div style={{ position: 'relative' }}>
              <IconMail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}/>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
                placeholder="hola@calmband.com" style={inputStyle}/>
            </div>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-dim)', fontWeight: 500 }}>Contraseña</span>
            <div style={{ position: 'relative' }}>
              <IconLock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}/>
              <input value={pass} onChange={e => setPass(e.target.value)} type={showPass ? 'text' : 'password'} required minLength={6}
                placeholder="Mínimo 6 caracteres" style={inputStyle}/>
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--ink-faint)', padding: 4
              }}>
                <IconEye size={16}/>
              </button>
            </div>
          </label>

          {mode === 'login' && (
            <div style={{ textAlign: 'right' }}>
              <a style={{ color: 'rgba(184,164,255,0.85)', fontSize: 12, textDecoration: 'none', cursor: 'pointer' }}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}

          <Button type="submit" size="lg" disabled={loading} style={{
            width: '100%', justifyContent: 'center', marginTop: 8,
            opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer'
          }}>
            {loading ? (
              <span style={{
                width: 16, height: 16, border: '2px solid rgba(10,8,36,0.25)',
                borderTopColor: '#0D0824', borderRadius: 8, animation: 'spin-slow 0.8s linear infinite'
              }}/>
            ) : (
              <>{mode === 'signup' ? 'Crear mi cuenta' : 'Entrar'} <IconArrowRight size={14}/></>
            )}
          </Button>
        </form>

        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--ink-faint)', textAlign: 'center', lineHeight: 1.55 }}>
          Al continuar aceptas los <a style={{ color: 'var(--ink-dim)' }}>Términos</a> y la <a style={{ color: 'var(--ink-dim)' }}>Política de privacidad</a>.
        </p>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '13px 14px 13px 40px',
  borderRadius: 10,
  border: '1px solid var(--border-strong)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--ink)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.2s, background 0.2s'
};

Object.assign(window, { AuthScreen });
