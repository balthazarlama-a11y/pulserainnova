#!/usr/bin/env node
/**
 * Simulador de pulsera CalmBand.
 *
 * Envía lecturas biométricas periódicas a POST /api/biometria, imitando lo que
 * haría el hardware real. Sirve para probar el ciclo completo
 * (emparejar → enviar datos → visualizar en vivo) sin una pulsera física.
 *
 * Uso:
 *   node scripts/sim-pulsera.js --nino <UUID> [opciones]
 *
 * Opciones:
 *   --nino, -n     UUID de la persona (tabla `niños`). REQUERIDO.
 *   --url, -u      Base URL del servidor.   Por defecto: http://localhost:3000
 *   --interval,-i  Segundos entre lecturas. Por defecto: 5
 *   --token, -t    Token de dispositivo (si DEVICE_INGEST_TOKEN está activo).
 *   --count, -c    Nº de lecturas y termina. Por defecto: 0 (infinito).
 *   --scenario,-s  calm | variable | crisis. Por defecto: variable.
 *
 * También admite variables de entorno: NINO_ID, BASE_URL, DEVICE_INGEST_TOKEN.
 *
 * Ejemplos:
 *   node scripts/sim-pulsera.js --nino 1e9d...
 *   node scripts/sim-pulsera.js -n 1e9d... -u https://miapp.vercel.app -i 3 -s crisis
 *   NINO_ID=1e9d... DEVICE_INGEST_TOKEN=secreto node scripts/sim-pulsera.js
 *
 * Requiere Node 18+ (usa fetch global).
 */

function parseArgs(argv) {
  const aliases = { n: 'nino', u: 'url', i: 'interval', t: 'token', c: 'count', s: 'scenario' };
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    let key = argv[i];
    if (!key.startsWith('-')) continue;
    key = key.replace(/^--?/, '');
    key = aliases[key] || key;
    const val = argv[i + 1];
    if (val === undefined || val.startsWith('-')) { out[key] = true; }
    else { out[key] = val; i++; }
  }
  return out;
}

const args = parseArgs(process.argv);

const ninoId = args.nino || process.env.NINO_ID;
const baseUrl = (args.url || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const intervalSec = Number(args.interval || 5);
const token = args.token || process.env.DEVICE_INGEST_TOKEN || null;
const maxCount = Number(args.count || 0);
const scenario = args.scenario || 'variable';

if (!ninoId) {
  console.error('✖ Falta --nino <UUID>. Copia el id de la persona desde la tabla `niños`.');
  console.error('  Ejemplo: node scripts/sim-pulsera.js --nino 1e9d4c7a-...');
  process.exit(1);
}

const endpoint = `${baseUrl}/api/biometria`;

// Estado del paseo aleatorio del nivel de calma según escenario.
const START_CALMA = { calm: 80, variable: 60, crisis: 25 }[scenario] ?? 60;
let calma = START_CALMA;

function nextReading() {
  // Paseo aleatorio acotado, con sesgo hacia el rango del escenario.
  const bias = { calm: 0.6, variable: 0, crisis: -0.6 }[scenario] ?? 0;
  calma += (Math.random() - 0.5) * 16 + bias * 4;
  calma = Math.max(5, Math.min(98, calma));
  const calmaInt = Math.round(calma);

  // BPM correlacionado inversamente con la calma (menos calma → más pulso).
  const bpm = Math.round(70 + (100 - calmaInt) * 0.45 + (Math.random() - 0.5) * 6);
  // HRV correlacionado positivamente con la calma.
  const hrv = Math.round(20 + calmaInt * 0.7 + (Math.random() - 0.5) * 10);

  return { 'niño_id': ninoId, bpm, hrv, nivel_calma: calmaInt, estado: 'activo' };
}

async function send(reading) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(reading) });
    const body = await res.json().catch(() => ({}));
    const stamp = new Date().toLocaleTimeString('es');
    if (res.ok) {
      console.log(`✔ ${stamp}  calma=${reading.nivel_calma}  bpm=${reading.bpm}  hrv=${reading.hrv}  → ${res.status}`);
    } else {
      console.error(`✖ ${stamp}  ${res.status}: ${body.error || 'error desconocido'}`);
    }
  } catch (err) {
    console.error(`✖ Error de red enviando a ${endpoint}: ${err.message}`);
  }
}

let sent = 0;
console.log(`▶ Simulador CalmBand`);
console.log(`  Endpoint:  ${endpoint}`);
console.log(`  Persona:   ${ninoId}`);
console.log(`  Escenario: ${scenario}   Intervalo: ${intervalSec}s   Token: ${token ? 'sí' : 'no'}`);
console.log(`  Ctrl+C para detener.\n`);

async function tick() {
  await send(nextReading());
  sent++;
  if (maxCount && sent >= maxCount) {
    console.log(`\n■ Enviadas ${sent} lecturas. Fin.`);
    process.exit(0);
  }
}

tick();
const loop = setInterval(tick, intervalSec * 1000);
process.on('SIGINT', () => { clearInterval(loop); console.log('\n■ Detenido.'); process.exit(0); });
