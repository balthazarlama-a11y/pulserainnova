// Parent dashboard — stress circle, 24h chart, AI recs, weekly history

const StressRing = ({ value, size = 260 }) => {
  const state = stressState(value);
  const r = size / 2 - 22;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="stressGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={state.hex}/>
            <stop offset="100%" stopColor={state.hex} stopOpacity="0.6"/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="14" fill="none"/>
        <circle cx={size/2} cy={size/2} r={r}
          stroke="url(#stressGrad)" strokeWidth="14" fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1), stroke 0.4s' }}/>
      </svg>
      {/* glow */}
      <div style={{
        position: 'absolute', inset: 12, borderRadius: '50%',
        background: `radial-gradient(circle, ${state.hex}22, transparent 70%)`,
        pointerEvents: 'none', transition: 'background 0.4s'
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 8 }}>
          Nivel de calma
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 72, fontWeight: 500, lineHeight: 1, color: state.hex, letterSpacing: '-0.04em', transition: 'color 0.4s' }}>
          {100 - value}
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-muted)', marginTop: 6, fontWeight: 500 }}>
          {state.label}
        </div>
      </div>
    </div>
  );
};

// 24h chart — uses synthetic curve driven by stress value
const StressChart = ({ stress }) => {
  const w = 640, h = 180;
  // Build a 24-hour curve that averages around current stress
  const points = React.useMemo(() => {
    const seed = stress;
    const arr = [];
    for (let i = 0; i < 24; i++) {
      const wobble = Math.sin(i * 0.6 + seed * 0.05) * 10
                   + Math.sin(i * 1.3) * 5
                   + Math.sin(i * 0.3 + seed * 0.1) * 8;
      // push higher peaks toward school hours (8-14)
      const schoolBump = (i >= 8 && i <= 14) ? 10 : 0;
      const v = Math.max(5, Math.min(95, seed + wobble + schoolBump - 10));
      arr.push(v);
    }
    return arr;
  }, [stress]);

  const xFor = i => 20 + (i / 23) * (w - 40);
  const yFor = v => h - 20 - (v / 100) * (h - 40);

  const d = points.map((v, i) => (i ? 'L' : 'M') + xFor(i) + ' ' + yFor(v)).join(' ');
  const dFill = d + ` L ${xFor(23)} ${h-20} L ${xFor(0)} ${h-20} Z`;

  const state = stressState(stress);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={state.hex} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={state.hex} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* horizontal guides */}
        {[0.25, 0.5, 0.75].map(g => (
          <line key={g} x1="20" x2={w-20} y1={20 + g*(h-40)} y2={20 + g*(h-40)}
                stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4"/>
        ))}
        <path d={dFill} fill="url(#chartFill)" style={{ transition: 'd 0.6s' }}/>
        <path d={d} stroke={state.hex} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'd 0.6s, stroke 0.3s' }}/>
        {/* current marker */}
        <circle cx={xFor(23)} cy={yFor(points[23])} r="5" fill={state.hex}/>
        <circle cx={xFor(23)} cy={yFor(points[23])} r="10" fill={state.hex} opacity="0.25"/>
        {/* x labels */}
        {[0, 6, 12, 18, 23].map(i => (
          <text key={i} x={xFor(i)} y={h - 4} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.3)" fontFamily="Inter">
            {i === 23 ? 'Ahora' : `${i.toString().padStart(2,'0')}:00`}
          </text>
        ))}
      </svg>
    </div>
  );
};

const Stat = ({ label, value, sub, accent }) => (
  <div style={{
    padding: 18,
    borderRadius: 14,
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid var(--border)'
  }}>
    <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -1, color: accent || 'var(--ink)' }}>{value}</div>
    <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>{sub}</div>
  </div>
);

const WeekBars = ({ stress }) => {
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const vals = React.useMemo(() => {
    return days.map((_, i) => {
      const base = stress + Math.sin(i * 1.8) * 18 + Math.cos(i) * 8;
      return Math.max(10, Math.min(95, base));
    });
  }, [stress]);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
      {vals.map((v, i) => {
        const s = stressState(v);
        const isToday = i === 6;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: '100%',
              height: `${v}%`,
              borderRadius: 8,
              background: `linear-gradient(180deg, ${s.hex}, ${s.hex}77)`,
              boxShadow: isToday ? `0 0 16px ${s.hex}66` : 'none',
              border: isToday ? `1px solid ${s.hex}` : 'none',
              transition: 'height 0.6s, background 0.3s'
            }}/>
            <div style={{ fontSize: 11, color: isToday ? s.hex : 'var(--ink-faint)', fontWeight: isToday ? 600 : 400 }}>{days[i]}</div>
          </div>
        );
      })}
    </div>
  );
};

const RecommendationPanel = ({ stress }) => {
  const [recs, setRecs] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const state = stressState(stress);

  const fetchRecs = React.useCallback(async () => {
    setLoading(true);
    try {
      const prompt = `Eres una psicóloga infantil experta. Sofía, 8 años, tiene un nivel de estrés de ${stress}/100 (${state.label}). Da 3 recomendaciones MUY concretas (no genéricas) para los próximos 15 minutos. Formato JSON estricto, sin markdown, sin texto fuera del JSON:
{"recommendations":[{"title":"...", "detail":"...", "duration":"X min", "icon":"wind|game|music|book|hug"}]}
- title: 4-6 palabras, acción clara
- detail: 1 frase, cálida y específica
- duration: minutos realistas
- icon: uno de wind/game/music/book/hug
Responde SOLO el JSON.`;
      const raw = await window.claude.complete(prompt);
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setRecs(parsed.recommendations || []);
    } catch (e) {
      // Fallback
      setRecs([
        { title: 'Respiración 4-7-8', detail: 'Ejercicio corto para bajar el ritmo cardíaco antes de la tarea.', duration: '3 min', icon: 'wind' },
        { title: 'Mini-juego burbujas', detail: 'Reventar burbujas sincronizado con la respiración.', duration: '5 min', icon: 'game' },
        { title: 'Playlist tranquila', detail: 'Sonidos de lluvia suave para concentración.', duration: '10 min', icon: 'music' }
      ]);
    }
    setLoading(false);
  }, [stress, state.label]);

  React.useEffect(() => { fetchRecs(); }, [fetchRecs]);

  const iconMap = {
    wind: <IconWind size={18}/>, game: <IconGamepad size={18}/>,
    music: <IconMusic size={18}/>, book: <IconBook size={18}/>,
    hug: <IconHeart size={18}/>
  };

  return (
    <Card style={{ padding: 26, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(184,164,255,0.9)', marginBottom: 6 }}>
            <IconSparkles size={12}/> Recomendación IA
          </div>
          <h3 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 500, letterSpacing: -0.3 }}>
            Para este momento
          </h3>
        </div>
        <button onClick={fetchRecs} disabled={loading} style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: 8, padding: '6px 10px',
          color: 'var(--ink-muted)', cursor: 'pointer', fontSize: 12,
          display: 'inline-flex', alignItems: 'center', gap: 6
        }}>
          {loading ? (
            <span style={{
              width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.2)',
              borderTopColor: '#B8A4FF', borderRadius: 5, animation: 'spin-slow 0.8s linear infinite'
            }}/>
          ) : <IconSparkles size={12}/>}
          {loading ? 'Pensando' : 'Actualizar'}
        </button>
      </div>

      {loading && !recs ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              height: 72, borderRadius: 12,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              backgroundSize: '200% 100%',
              animation: 'sheen 1.8s linear infinite'
            }}/>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(recs || []).map((r, i) => (
            <div key={i} style={{
              padding: 14,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(184,164,255,0.08)'; e.currentTarget.style.borderColor='rgba(184,164,255,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor='var(--border)'; }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `linear-gradient(135deg, ${state.hex}33, ${state.hex}10)`,
                border: `1px solid ${state.hex}40`,
                color: state.hex,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{iconMap[r.icon] || <IconSparkles size={18}/>}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-dim)', lineHeight: 1.4 }}>{r.detail}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontVariantNumeric: 'tabular-nums' }}>{r.duration}</div>
              <IconChevronRight size={14} style={{ color: 'var(--ink-faint)' }}/>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

const Dashboard = ({ stress, setStress, onGoKids, onSignOut }) => {
  const state = stressState(stress);
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-2)', color: 'var(--ink)', position: 'relative' }}>
      <AmbientOrbs/>

      {/* Sidebar */}
      <aside style={{
        position: 'fixed', left: 0, top: 0, bottom: 0,
        width: 76, zIndex: 5,
        borderRight: '1px solid var(--border)',
        background: 'rgba(10,10,26,0.7)',
        backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '24px 0'
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #B8A4FF, #A8E6CF)',
          marginBottom: 32
        }}/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {[
            { i: <IconHome size={18}/>, active: true, label: 'Inicio' },
            { i: <IconChart size={18}/>, label: 'Historial' },
            { i: <IconBell size={18}/>, label: 'Alertas' },
            { i: <IconSettings size={18}/>, label: 'Ajustes' }
          ].map((x, k) => (
            <button key={k} title={x.label} style={{
              width: 44, height: 44, borderRadius: 12,
              background: x.active ? 'rgba(184,164,255,0.15)' : 'transparent',
              border: x.active ? '1px solid rgba(184,164,255,0.25)' : '1px solid transparent',
              color: x.active ? '#B8A4FF' : 'var(--ink-dim)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}>{x.i}</button>
          ))}
        </div>
        <button onClick={onSignOut} title="Salir" style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'transparent', border: '1px solid transparent',
          color: 'var(--ink-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}><IconLogOut size={18}/></button>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 76, padding: '32px 40px 80px', position: 'relative', zIndex: 2, maxWidth: 1440 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--ink-dim)', marginBottom: 4 }}>{greeting}, Carolina</div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 500, margin: 0, letterSpacing: '-0.02em' }}>
              Así está <GradientText>Sofía</GradientText> hoy
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Pill dot={state.hex}>Pulsera conectada</Pill>
            <Button variant="soft" size="sm" onClick={onGoKids}>
              Abrir vista de Sofía <IconArrowRight size={12}/>
            </Button>
            <div style={{
              width: 38, height: 38, borderRadius: 19,
              background: 'linear-gradient(135deg, #FFB4A2, #F4A6C0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, color: '#2A0E16', fontSize: 14
            }}>S</div>
          </div>
        </div>

        {/* Row 1: ring + recommendations */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, marginBottom: 24 }}>
          <Card style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <StressRing value={stress} size={260}/>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '10px 16px 10px 12px',
              borderRadius: 999,
              background: `${state.hex}18`,
              border: `1px solid ${state.hex}40`,
              color: state.hex, fontSize: 13, fontWeight: 500,
              transition: 'all 0.3s'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: state.hex, boxShadow: `0 0 8px ${state.hex}`}}/>
              {state.key === 'calm' && 'Tranquila · puede concentrarse'}
              {state.key === 'mild' && 'Un poco inquieta · observar'}
              {state.key === 'moderate' && 'Estresada · necesita apoyo'}
              {state.key === 'high' && 'Muy ansiosa · intervenir ya'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
              Basado en HRV (variabilidad cardíaca), ritmo y temperatura de los últimos 10 minutos.
            </div>
          </Card>

          <RecommendationPanel stress={stress}/>
        </div>

        {/* Row 2: chart */}
        <Card style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 4 }}>Últimas 24 horas</div>
              <h3 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 500, letterSpacing: -0.3 }}>Línea del día</h3>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['24h', 'Semana', 'Mes'].map((t, i) => (
                <button key={t} style={{
                  padding: '6px 12px', fontSize: 12,
                  borderRadius: 8,
                  background: i === 0 ? 'rgba(184,164,255,0.15)' : 'transparent',
                  border: '1px solid ' + (i === 0 ? 'rgba(184,164,255,0.3)' : 'var(--border)'),
                  color: i === 0 ? '#D4C5FF' : 'var(--ink-muted)', cursor: 'pointer'
                }}>{t}</button>
              ))}
            </div>
          </div>
          <StressChart stress={stress}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 24 }}>
            <Stat label="Promedio hoy" value={`${Math.round(100 - stress * 0.95)}`} sub="nivel de calma" accent={state.hex}/>
            <Stat label="Ejercicios" value="4" sub="completados"/>
            <Stat label="Ritmo cardíaco" value={`${72 + Math.floor(stress/5)}`} sub="lpm promedio"/>
            <Stat label="Sueño" value="8h 20m" sub="anoche"/>
          </div>
        </Card>

        {/* Row 3: week + insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
          <Card style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 4 }}>Esta semana</div>
                <h3 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 500, letterSpacing: -0.3 }}>Patrón semanal</h3>
              </div>
              <Pill>{state.label}</Pill>
            </div>
            <WeekBars stress={stress}/>
            <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--ink)' }}>Observación:</strong> los miércoles muestran picos más altos, coinciden con clases de matemáticas.
            </div>
          </Card>

          <Card style={{ padding: 28 }}>
            <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 4 }}>Actividad</div>
            <h3 style={{ margin: '0 0 18px', fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 500, letterSpacing: -0.3 }}>Hoy</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { t: '07:15', e: 'Despertó tranquila', icon: <IconSun size={14}/>, c: '#F5D06F' },
                { t: '08:40', e: 'Pico leve camino al cole', icon: <IconActivity size={14}/>, c: '#F59E4C' },
                { t: '10:22', e: 'Respiración 4-7-8 completada', icon: <IconWind size={14}/>, c: '#A8E6CF' },
                { t: '13:05', e: 'Almuerzo, muy relajada', icon: <IconHeart size={14}/>, c: '#5EDC9A' },
                { t: '16:30', e: 'Mini-juego burbujas', icon: <IconGamepad size={14}/>, c: '#B8A4FF' }
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontVariantNumeric: 'tabular-nums', width: 44 }}>{x.t}</div>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: `${x.c}20`, border: `1px solid ${x.c}40`, color: x.c,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{x.icon}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-muted)', flex: 1 }}>{x.e}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

Object.assign(window, { Dashboard });
