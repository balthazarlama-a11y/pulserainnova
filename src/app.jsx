// App shell — wires screens together with flow + Tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "stressLevel": 42
}/*EDITMODE-END*/;

const SCREENS = ['landing', 'auth', 'pairing', 'dashboard', 'kids'];
const SCREEN_LABELS = {
  landing: '01 Landing',
  auth: '02 Auth',
  pairing: '03 Pairing',
  dashboard: '04 Dashboard',
  kids: '05 Kids'
};

const ScreenSwitcher = ({ current, onChange }) => (
  <div style={{
    position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)',
    zIndex: 999,
    display: 'flex', gap: 4, padding: 4,
    background: 'rgba(10,10,26,0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    boxShadow: '0 12px 40px rgba(0,0,0,0.4)'
  }}>
    {SCREENS.map(s => (
      <button key={s} onClick={() => onChange(s)} style={{
        padding: '8px 14px', borderRadius: 10, border: 'none',
        background: current === s ? 'rgba(184,164,255,0.22)' : 'transparent',
        color: current === s ? '#E9D6FF' : 'rgba(255,255,255,0.55)',
        fontWeight: current === s ? 600 : 400, fontSize: 12,
        cursor: 'pointer', fontFamily: 'inherit',
        letterSpacing: 0.3
      }}>{SCREEN_LABELS[s]}</button>
    ))}
  </div>
);

const TweaksPanel = ({ open, stress, onChange, onClose }) => {
  if (!open) return null;
  const state = stressState(stress);
  return (
    <div style={{
      position: 'fixed', bottom: 72, right: 20, zIndex: 1000,
      width: 320,
      padding: 20,
      borderRadius: 16,
      background: 'rgba(10,10,26,0.92)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 13, letterSpacing: 0.5 }}>Tweaks</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}>
          <IconX size={16}/>
        </button>
      </div>
      <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>
        Nivel de estrés de Sofía
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <input
          type="range" min="0" max="100" value={stress}
          onChange={e => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: state.hex }}
        />
        <div style={{
          minWidth: 40, textAlign: 'center',
          padding: '4px 8px', borderRadius: 8,
          background: `${state.hex}20`, border: `1px solid ${state.hex}40`,
          color: state.hex, fontSize: 13, fontWeight: 600
        }}>{stress}</div>
      </div>
      <div style={{ fontSize: 11, color: state.hex, marginBottom: 14 }}>
        {state.label} · {state.range}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {[15, 45, 65, 85].map(v => {
          const s = stressState(v);
          return (
            <button key={v} onClick={() => onChange(v)} style={{
              padding: '6px 4px', fontSize: 10,
              background: s.hex + '18', border: `1px solid ${s.hex}40`,
              color: s.hex, borderRadius: 6, cursor: 'pointer',
              fontFamily: 'inherit'
            }}>{s.label.split(' ')[0]}</button>
          );
        })}
      </div>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
        Afecta el anillo del dashboard, las recomendaciones IA, el ánimo del personaje y los colores.
      </div>
    </div>
  );
};

const App = () => {
  const [screen, setScreen] = React.useState(() => localStorage.getItem('cb_screen') || 'landing');
  const [stress, setStress] = React.useState(TWEAK_DEFAULTS.stressLevel);
  const [editMode, setEditMode] = React.useState(false);

  React.useEffect(() => { localStorage.setItem('cb_screen', screen); window.scrollTo(0, 0); }, [screen]);

  // Edit-mode wiring
  React.useEffect(() => {
    const onMsg = (e) => {
      const d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === '__activate_edit_mode') setEditMode(true);
      if (d.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const setStressPersist = (v) => {
    setStress(v);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { stressLevel: v } }, '*');
  };

  const go = (s) => setScreen(s);

  return (
    <div data-screen-label={SCREEN_LABELS[screen]}>
      {screen === 'landing'   && <LandingPage onGoAuth={() => go('auth')}/>}
      {screen === 'auth'      && <AuthScreen onContinue={() => go('pairing')} onBack={() => go('landing')}/>}
      {screen === 'pairing'   && <PairingScreen onContinue={() => go('dashboard')} onBack={() => go('auth')}/>}
      {screen === 'dashboard' && <Dashboard stress={stress} setStress={setStressPersist} onGoKids={() => go('kids')} onSignOut={() => go('landing')}/>}
      {screen === 'kids'      && <KidsView stress={stress} onBack={() => go('dashboard')}/>}

      <ScreenSwitcher current={screen} onChange={go}/>
      <TweaksPanel open={editMode} stress={stress} onChange={setStressPersist} onClose={() => {
        window.parent.postMessage({ type: '__deactivate_edit_mode' }, '*');
        setEditMode(false);
      }}/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
