# Prompt: CalmBand — Prototipo funcional completo con simulación de semana

## Contexto del proyecto

CalmBand es una app Next.js 14 (App Router) para monitorear el estrés infantil mediante una pulsera wearable. La app ya tiene:
- Auth mock funcional (registro, login, sesión con cookies, middleware)
- Dashboard de padre con StressRing, gráfica 24h, barras semanales, recomendaciones IA, timeline de actividad
- Vista infantil con personaje animado (CalmChar), ejercicio de respiración 4-4-6, juego de burbujas
- Historial de sesiones (14 días) y ejercicios completados
- Flujo de emparejamiento de pulsera (6 dígitos)
- Datos simulados en `lib/mockData.js` (estrés por hora, BPM, actividades, recomendaciones)

**Tech stack:** Next.js 14.2.5, React 18.2.0, Tailwind CSS 3.4.4, @supabase/ssr 0.3.0 (mock), @supabase/supabase-js 2.45.0 (mock)

---

## Qué necesito ahora

Agregar un **sistema de simulación profesional** que permita reproducir una semana completa en la vida del niño usando la pulsera. El objetivo es poder hacer demos para inversionistas o usuarios donde se vea cómo la app reacciona en tiempo real a diferentes niveles de estrés, eventos y actividades.

---

## FEATURE 1: Botón de simulación en el Dashboard

### Dónde colocarlo
En el dashboard (`components/dashboard/DashboardClient.jsx`), agregar un **botón flotante** en la esquina inferior derecha que diga "Simular semana" con un ícono de play. Debe verse premium y coherente con el diseño dark de la app.

### Comportamiento del botón
1. Al hacer click, abre un **panel/modal de control de simulación** que se desliza desde abajo o aparece como overlay
2. El panel muestra:
   - **Selector de día** (Lunes a Domingo) con pills/tabs navegables
   - **Timeline visual del día** mostrando todos los eventos hora por hora
   - **Controles de reproducción**: Play/Pausa, velocidad (1x, 2x, 5x, 10x), barra de progreso scrubable
   - **Indicador de hora simulada** en formato grande (ej: "Miércoles 14:35")
   - **Mini preview** del estrés actual, BPM y estado emocional durante la simulación

### Qué simula
Cuando se presiona Play, la simulación avanza hora por hora (a la velocidad elegida) y **actualiza en tiempo real** todos los componentes del dashboard:

- **StressRing**: El valor de estrés cambia según el momento del día simulado
- **Gráfica 24h**: Se va llenando progresivamente conforme avanza la simulación
- **Barras semanales**: Se actualizan con los datos de la semana simulada
- **Recomendaciones IA**: Cambian según el nivel de estrés del momento
- **Timeline de actividad**: Se llena con los eventos del día simulado
- **Stats** (BPM, ejercicios, sueño): Se actualizan en tiempo real
- **Pill "Pulsera conectada"**: Cambia a "Simulando · Mié 14:35" durante la simulación

---

## FEATURE 2: Datos de simulación de la semana completa

### Crear en `lib/mockData.js` (o en un nuevo archivo `lib/simulationData.js`)

Una semana completa con datos **realistas y narrativos** para Sofía (8 años). Cada día tiene una historia diferente que se refleja en los datos:

```
LUNES — "Vuelta al cole después del fin de semana"
- 06:30-07:00: Despertar tranquilo (estrés 15-20)
- 07:00-07:45: Prepararse para el cole (estrés sube a 30-35)
- 08:00-08:30: Camino al colegio (estrés 40, ansiedad leve)
- 08:30-10:00: Clases normales (estrés 35-45)
- 10:00-10:30: Recreo (estrés baja a 20)
- 10:30-13:00: Más clases (estrés 30-40)
- 13:00-14:00: Almuerzo (estrés 20-25)
- 14:00-16:00: Clases de tarde (estrés 35-40)
- 16:00-17:00: Vuelta a casa, merienda (estrés 25)
- 17:00-19:00: Juego libre en casa (estrés 15-20)
- 19:00-20:00: Cena en familia (estrés 15)
- 20:00-20:30: Rutina de noche, cuento (estrés 10-12)
- 20:30-06:30: Dormida (estrés 5-10)
Eventos: [07:15 Despertó tranquila, 08:40 Ansiedad camino al cole, 10:15 Jugó con amigas, 13:05 Almuerzo relajado, 17:30 Jugó en casa, 20:15 Respiración antes de dormir]
Ejercicios: 1 respiración nocturna

MARTES — "Examen de matemáticas"
- Mañana muy estresante: estrés sube a 65-75 durante el examen (10:00-11:00)
- La app recomienda respiración, Sofía hace ejercicio 4-4-6 a las 09:45 → estrés baja de 60 a 45
- Tarde más tranquila después del alivio del examen
- Pico de 70 a las 10:30 (peor momento)
Eventos: [09:45 Completó respiración 4-4-6, 10:00 Inicio examen (estrés alto), 10:30 Pico de ansiedad, 11:00 Terminó examen (alivio), 14:00 Juego de burbujas, 20:00 Respiración nocturna]
Ejercicios: 2 respiraciones + 1 juego de burbujas

MIÉRCOLES — "Clase de educación física + pelea con amiga"
- Mañana normal (estrés 25-35)
- Educación física baja el estrés a 15-20 (10:00-11:00)
- Pelea con su mejor amiga a las 13:30 → estrés sube a 80 (momento más alto de la semana)
- Intervención: la maestra sugiere respiración, Sofía usa la app → baja a 50
- Tarde difícil emocionalmente (estrés 45-55)
- Noche: se reconcilia con la amiga por mensaje → estrés baja a 25
Eventos: [10:00 Educación física (muy relajada), 13:30 Pelea con amiga (estrés alto), 13:45 Respiración guiada, 14:00 Abrazo mariposa, 18:00 Se reconcilió, 20:30 Dormida tranquila]
Ejercicios: 2 respiraciones + 1 abrazo mariposa

JUEVES — "Día tranquilo, excursión al parque"
- El mejor día de la semana
- Excursión escolar al parque natural (09:00-14:00)
- Estrés muy bajo todo el día (10-25)
- Un momento de estrés leve al perderse del grupo (11:30, estrés 45) pero se resuelve rápido
- Tarde feliz y relajada
Eventos: [09:00 Salida al parque, 11:30 Se perdió del grupo (resolvió rápido), 12:00 Picnic con compañeros, 15:00 Llegó a casa feliz, 17:00 Dibujo tranquilo, 20:00 Se durmió temprano]
Ejercicios: 0 (no los necesitó)

VIERNES — "Último día de la semana + fiesta de cumpleaños"
- Mañana con emoción positiva (estrés moderado 30-40 por excitación)
- Fiesta de cumpleaños de compañera a las 16:00
- Sobreestimulación en la fiesta → estrés sube a 55-60
- Usa juego de burbujas en un momento tranquilo → baja a 35
- Noche: agotada pero feliz (estrés 20)
Eventos: [08:00 Emocionada por la fiesta, 12:00 Último día de clases, 16:00 Fiesta de cumpleaños, 17:30 Juego de burbujas (en la fiesta), 19:00 Vuelta a casa agotada, 20:00 Se durmió rápido]
Ejercicios: 1 juego de burbujas

SÁBADO — "Mañana en familia + tarde de pantallas"
- Despertar tardío y relajado (estrés 10-15)
- Mañana en familia: parque + helado (estrés 8-15)
- Tarde viendo tablet → estrés sube gradualmente a 35-40 por sobreestimulación digital
- Padres limitan pantalla → frustración breve (estrés 50)
- Se calma con música relajante → baja a 20
Eventos: [09:30 Despertó tarde y feliz, 10:30 Parque con papás, 12:00 Helado, 15:00 Tablet (sube estrés gradual), 17:00 Límite de pantalla (frustración), 17:15 Música relajante, 19:00 Cena en familia, 21:00 Dormida]
Ejercicios: 1 sesión de música relajante

DOMINGO — "Día tranquilo + ansiedad anticipatoria por el lunes"
- Mañana ultra relajada (estrés 8-12)
- Mediodía normal (estrés 15-20)
- A partir de las 17:00: ansiedad anticipatoria por volver al cole (estrés sube gradualmente a 45)
- Padres hacen rutina de calma: respiración + cuento → baja a 20
- Se duerme tranquila
Eventos: [10:00 Mañana perezosa, 12:00 Comida familiar, 15:00 Juego libre, 17:00 Empieza ansiedad por el lunes, 19:00 Respiración 4-4-6 con mamá, 19:30 Cuento relajante, 20:30 Dormida tranquila]
Ejercicios: 1 respiración + 1 cuento
```

### Estructura de datos por día

Cada día debe tener:

```javascript
{
  day: "Lunes",
  date: "2026-04-27",
  narrative: "Vuelta al cole después del fin de semana",
  // Datos hora por hora (0-23), cada hora tiene:
  hourlyData: [
    { hour: 0, stress: 5, bpm: 62, sleeping: true },
    { hour: 1, stress: 5, bpm: 60, sleeping: true },
    // ... hasta hora 23
    { hour: 14, stress: 38, bpm: 82, sleeping: false },
  ],
  // Eventos del día
  events: [
    { time: "07:15", event: "Despertó tranquila", icon: "sun", color: "#F5D06F", stress: 18 },
    { time: "08:40", event: "Ansiedad camino al cole", icon: "activity", color: "#F59E4C", stress: 42 },
    // ...
  ],
  // Ejercicios completados ese día
  exercises: [
    { time: "20:15", type: "Respiración 4-4-6", duration: "3 min", mood_before: "mild", mood_after: "calm" }
  ],
  // Resumen del día
  summary: {
    avgStress: 28,
    peakStress: 42,
    avgBpm: 76,
    exercisesCount: 1,
    sleepHours: "10h 00m",
    bestMoment: "Jugó con amigas en el recreo",
    worstMoment: "Ansiedad camino al colegio"
  }
}
```

---

## FEATURE 3: Impacto de la simulación en la Vista Infantil

Cuando la simulación está activa, la vista infantil (`/kids`) también debe reaccionar:
- **CalmChar** cambia de mood según el estrés del momento simulado
- **El greeting** cambia dinámicamente
- **Las recomendaciones** de actividades se marcan como "RECOMENDADO" según el estrés
- Agregar un **banner sutil** arriba que diga "Modo simulación · Miércoles 13:30" para que se sepa que es una demo

---

## FEATURE 4: Estado de simulación global

### Crear `lib/simulationContext.js` (nuevo archivo)

Un React Context que maneje el estado de la simulación globalmente:

```javascript
{
  active: false,           // ¿Simulación corriendo?
  playing: false,          // ¿En play o pausa?
  speed: 1,                // 1x, 2x, 5x, 10x
  currentDay: 0,           // 0=Lunes, 6=Domingo
  currentHour: 0,          // 0-23
  currentMinute: 0,        // 0-59 (para granularidad)
  weekData: SIMULATION_WEEK, // Los datos de la semana completa
}
```

**Funciones que debe exponer:**
- `startSimulation()` → Activa la simulación desde Lunes 06:00
- `stopSimulation()` → Detiene y vuelve a datos en tiempo real
- `togglePlay()` → Play/Pausa
- `setSpeed(speed)` → Cambiar velocidad
- `jumpToDay(dayIndex)` → Saltar a un día
- `jumpToHour(hour)` → Saltar a una hora
- `getCurrentSimData()` → Retorna el estrés, BPM, eventos, etc. del momento actual simulado

### Envolver la app con el provider
En `app/layout.jsx`, envolver con `<SimulationProvider>` después de `<AuthProvider>`.

---

## FEATURE 5: Panel de control de simulación

### Diseño del panel (overlay bottom-sheet)

El panel de simulación debe verse **premium y profesional**:

```
┌──────────────────────────────────────────────────────────┐
│  🎬 Simulación de Semana                        [✕]     │
│  ─────────────────────────────────────────────────────── │
│                                                          │
│  [Lun] [Mar] [Mié] [Jue] [Vie] [Sáb] [Dom]            │
│                 ▲ activo                                  │
│                                                          │
│  Miércoles — "Clase de educación física + pelea"        │
│                                                          │
│  ══════════════●════════════════════════════  13:35      │
│  06:00                                       23:00       │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐       │
│  │ 😰 65   │  │ ♥ 88 lpm │  │ Estado: Moderado │       │
│  │ estrés  │  │ ritmo    │  │                   │       │
│  └─────────┘  └──────────┘  └──────────────────┘       │
│                                                          │
│  Próximo evento: 13:45 Respiración guiada               │
│                                                          │
│  [ ◀◀ ]  [ ▶ PLAY ]  [ ▶▶ ]    Velocidad: [2x ▾]      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Estilo visual
- Fondo: `rgba(10, 10, 26, 0.95)` con `backdrop-filter: blur(20px)`
- Bordes: `1px solid var(--border)` con border-radius 20px arriba
- Los tabs de días usan los mismos colores de estado de la app
- La barra de progreso es interactiva (se puede arrastrar/clickear)
- Transiciones suaves en todos los cambios de datos
- El botón Play/Pausa pulsa cuando está activo

---

## FEATURE 6: Botón flotante de simulación

### Diseño
- Posición: `fixed`, bottom-right (bottom: 24px, right: 24px)
- Estilo: Circular (56x56), gradiente púrpura `linear-gradient(135deg, #B8A4FF, #8B7FD8)`
- Icono: ▶ (play) cuando no hay simulación, ⏸ (pausa) cuando está activa
- Sombra: `0 8px 32px -8px rgba(184,164,255,0.5)`
- Hover: Escala 1.05 con box-shadow más grande
- Cuando la simulación está activa: el botón tiene un anillo pulsante alrededor (como el StressRing)
- Z-index alto para estar siempre visible
- Label tooltip: "Simular semana"

### Estados del botón
1. **Inactivo**: Ícono play + "Simular" → Click abre el panel
2. **Simulando**: Ícono pulsante + indicador de tiempo → Click abre el panel (si cerrado) o pausa
3. **Pausado**: Ícono play con anillo estático → Click reanuda

---

## Archivos a crear/modificar

### Archivos NUEVOS:
1. **`lib/simulationData.js`** — Datos completos de los 7 días (estructura descrita arriba)
2. **`lib/simulationContext.js`** — React Context + Provider para estado global de simulación
3. **`components/simulation/SimulationPanel.jsx`** — El panel de control overlay
4. **`components/simulation/SimulationFAB.jsx`** — El botón flotante

### Archivos a MODIFICAR:
5. **`app/layout.jsx`** — Agregar `<SimulationProvider>` y renderizar el FAB + Panel globalmente
6. **`components/dashboard/DashboardClient.jsx`** — Conectar con el contexto de simulación:
   - `useSimulation()` hook para obtener datos actuales
   - Cuando `active === true`, usar datos de simulación en vez de `getCurrentStress()` / `generate24hHistory()` / etc.
   - El StressRing, StressChart, WeekBars, RecommendationPanel, Stats y Timeline se alimentan de los datos simulados
   - La pill "Pulsera conectada" cambia a "Simulando · Mié 14:35"
7. **`components/kids/KidsClient.jsx`** — Conectar con simulación:
   - CalmChar reacciona al estrés simulado
   - Banner de modo simulación arriba
   - Greeting cambia con el estrés simulado
8. **`components/history/HistoryClient.jsx`** — Opcional: mostrar datos de la semana simulada en vez de los random
9. **`lib/mockData.js`** — NO modificar, pero el dashboard debe poder alternar entre mockData (modo normal) y simulationData (modo simulación)

### Archivos que NO se tocan:
- Todo el sistema de auth (`lib/supabase/*`, `components/auth/*`, `middleware.js`)
- `components/marketing/*` (primitives, icons, bracelet, etc.)
- `components/ui/*` (button, card, input, etc.)
- `components/pairing/PairingClient.jsx`
- `package.json` (no agregar dependencias)

---

## Lógica de la simulación

### Timer de simulación
- Cuando `playing === true`, un `setInterval` avanza el tiempo
- En velocidad 1x: avanza 1 minuto cada 1 segundo real (una hora simulada = 60 segundos reales)
- En velocidad 2x: avanza 1 minuto cada 500ms
- En velocidad 5x: avanza 1 minuto cada 200ms
- En velocidad 10x: avanza 1 minuto cada 100ms
- Al llegar a hora 23:59, salta al siguiente día automáticamente
- Al llegar al Domingo 23:59, vuelve al Lunes (loop) o se detiene

### Interpolación de datos
- Los datos están por hora, pero la simulación avanza por minuto
- Interpolar linealmente entre los valores de la hora actual y la siguiente para estrés y BPM
- Los eventos se disparan cuando el tiempo simulado pasa por su timestamp
- Cuando un evento se "dispara", mostrar una notificación sutil en el dashboard (toast o highlight en el timeline)

### Transiciones
- Todos los cambios de valores deben tener `transition` CSS suave (0.3s-0.6s)
- El StressRing debe animarse fluidamente, no saltar
- Los colores de estado (calm→mild→moderate→high) deben transicionar suavemente

---

## Resultado esperado

Después de implementar:

1. El dashboard funciona normal con datos en tiempo real (como antes) ✅
2. El botón flotante "Simular" aparece abajo a la derecha ✅
3. Click en el botón abre el panel de control de simulación ✅
4. Se puede elegir un día de la semana ✅
5. Al presionar Play, el dashboard cobra vida:
   - El StressRing se mueve fluidamente ✅
   - La gráfica 24h se va dibujando en tiempo real ✅
   - Las recomendaciones cambian según el estrés ✅
   - El timeline se llena con eventos conforme ocurren ✅
   - Los stats se actualizan ✅
6. Se puede pausar, cambiar velocidad, scrubbar en la timeline ✅
7. Al ir a la vista infantil durante la simulación, CalmChar reacciona ✅
8. Se puede detener la simulación y volver a datos normales ✅
9. La narrativa de cada día se ve en el panel (da contexto a la demo) ✅
10. Todo se ve premium, pulido, coherente con el diseño existente ✅

---

## Notas técnicas importantes

- **No agregar dependencias.** Todo se hace con React puro, CSS y los componentes existentes.
- **"use client"** en todos los componentes nuevos de simulación (son interactivos).
- El `SimulationProvider` debe envolver la app en `layout.jsx` (Client Component boundary).
- El panel de simulación y el FAB se renderizan en `layout.jsx` fuera de las rutas, así están disponibles en todas las páginas.
- Usar `requestAnimationFrame` o `setInterval` para el timer — NO `setTimeout` recursivo.
- La barra de progreso del panel debe ser interactiva: click para saltar a una hora, drag para scrubbar.
- Los datos de simulación deben ser determinísticos (mismo input = mismo output) para demos consistentes.
- El contexto de simulación expone un hook `useSimulation()` que cualquier componente puede consumir.
- Al cerrar el panel, la simulación sigue corriendo en background (el botón sigue pulsando).
- Performance: no re-renderizar todo el dashboard cada 100ms — usar `useMemo`, `useCallback`, y granular state updates.

---

## Estilo y colores (referencia rápida)

- Background: `var(--bg-2)` → `#0A0A1A`
- Texto principal: `var(--ink)` → `#EEEEF0`
- Texto dim: `var(--ink-dim)` → `rgba(255,255,255,0.65)`
- Borders: `var(--border)` → `rgba(255,255,255,0.08)`
- Púrpura principal: `#B8A4FF`
- Verde calm: `#A8E6CF` / `#5EDC9A`
- Amarillo mild: `#F5D06F`
- Naranja moderate: `#F59E4C` / `#FFB4A2`
- Rosa high: `#F4A6C0`
- Font serif: `Fraunces`
- Font sans: `Inter`
- Border radius cards: 16-20px
- Transiciones: `cubic-bezier(.4,0,.2,1)`
