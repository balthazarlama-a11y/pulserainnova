import { NextResponse } from "next/server";

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";

// ─── Extrae JSON desde la respuesta del LLM ───────────────────────────────────
// Los LLMs a veces envuelven el JSON en markdown (```json...```) o agregan
// texto introductorio. Esta función maneja todos los casos.
function extractJSON(text) {
  // 1. Intento directo
  try { return JSON.parse(text.trim()); } catch {}

  // 2. Bloque markdown ```json...```
  const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (mdMatch) {
    try { return JSON.parse(mdMatch[1].trim()); } catch {}
  }

  // 3. Primer objeto JSON en el texto
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch {}
  }

  throw new Error("No se pudo extraer JSON válido de la respuesta del modelo");
}

// ─── Normaliza los íconos al set disponible en la UI ─────────────────────────
const VALID_ICONS = ["wind", "gamepad", "music", "book", "heart"];
function safeIcon(icon) {
  return VALID_ICONS.includes(icon) ? icon : "heart";
}

// ─── Construye el prompt con los datos biométricos ────────────────────────────
function buildPrompt({ stress, bpm, bpmResting, stressKey, childName, childAge, hour }) {
  const period = hour < 12 ? "morning" : hour < 19 ? "afternoon" : "evening";
  const bpmDelta = bpm - bpmResting;
  const bpmTrend = bpmDelta > 8 ? `elevated (+${bpmDelta} BPM above resting)` : bpmDelta < -5 ? `low (${bpmDelta} BPM below resting)` : "near baseline";

  const phaseMap = {
    calm:     "maintenance — child is calm, focus on positive reinforcement",
    mild:     "early prevention — metrics rising, intervene before escalation",
    moderate: "active intervention — child needs support now",
    high:     "crisis management — immediate calming actions required",
  };

  return {
    system: `You are a pediatric anxiety and emotional regulation specialist with expertise in evidence-based interventions for children. You analyze biometric data to provide personalized, age-appropriate activity recommendations.

Always respond with valid JSON only — no prose, no markdown, no explanation outside the JSON object.`,

    user: `A child's wearable device has sent the following biometric data. Provide 3 personalized activity recommendations.

CHILD PROFILE:
- Name: ${childName}
- Age: ${childAge} years old
- Time of day: ${period}

BIOMETRIC DATA:
- Heart rate: ${bpm} BPM (${bpmTrend})
- Resting baseline: ${bpmResting} BPM
- Stress index: ${stress}/100
- Emotional state category: ${stressKey}
- Intervention phase: ${phaseMap[stressKey] || phaseMap.mild}

REQUIREMENTS:
- Recommend exactly 3 activities
- Each must be doable in ${childAge <= 8 ? "under 8 minutes" : "under 10 minutes"}
- Activities must be appropriate for a ${childAge}-year-old child
- Reference the specific biometric data in the deepExplanation
- For high stress: prioritize grounding, breathing, and sensory regulation
- For calm: prioritize creative and positive reinforcement activities

Respond ONLY with this JSON structure (no other text):
{
  "recommendations": [
    {
      "title": "Short activity name (2-4 words, in Spanish)",
      "detail": "One sentence for the parent/caregiver (max 15 words, in Spanish)",
      "duration": "X min",
      "icon": "wind",
      "deepExplanation": "2-3 sentence scientific explanation in Spanish, mentioning the ${bpm} BPM reading and stress index of ${stress}"
    }
  ]
}

icon must be exactly one of: wind, gamepad, music, book, heart
All text must be in Spanish.`,
  };
}

export async function POST(request) {
  const apiKey = process.env.NVIDIA_API_KEY;

  // ── Sin API key: devolver indicación de fallback ──────────────────────────
  if (!apiKey) {
    return NextResponse.json(
      { error: "NVIDIA_API_KEY no configurada en .env.local", fallback: true },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const {
    stress = 35,
    bpm = 80,
    bpmResting = 78,
    stressKey = "mild",
    childName = "Simón",
    childAge = 10,
  } = body;

  const hour = new Date().getHours();
  const { system, user } = buildPrompt({ stress, bpm, bpmResting, stressKey, childName, childAge, hour });

  // ── Llamada a NVIDIA NIM (compatible con OpenAI) ──────────────────────────
  let nvidiaRes;
  try {
    nvidiaRes = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user",   content: user   },
        ],
        temperature: 0.65,
        top_p: 0.9,
        max_tokens: 900,
      }),
      // Tiempo límite de 15s para no bloquear la UI
      signal: AbortSignal.timeout(15000),
    });
  } catch (fetchErr) {
    console.error("[recommendations] Error de red:", fetchErr.message);
    return NextResponse.json(
      { error: `Error de red: ${fetchErr.message}`, fallback: true },
      { status: 502 }
    );
  }

  if (!nvidiaRes.ok) {
    const errText = await nvidiaRes.text().catch(() => "");
    console.error(`[recommendations] NVIDIA API ${nvidiaRes.status}:`, errText);
    return NextResponse.json(
      { error: `NVIDIA API respondió ${nvidiaRes.status}`, detail: errText, fallback: true },
      { status: nvidiaRes.status }
    );
  }

  let apiData;
  try {
    apiData = await nvidiaRes.json();
  } catch {
    return NextResponse.json({ error: "Respuesta inválida de NVIDIA", fallback: true }, { status: 502 });
  }

  const rawContent = apiData.choices?.[0]?.message?.content ?? "";
  if (!rawContent) {
    return NextResponse.json({ error: "Respuesta vacía del modelo", fallback: true }, { status: 502 });
  }

  // ── Parsear y validar la respuesta ────────────────────────────────────────
  let parsed;
  try {
    parsed = extractJSON(rawContent);
  } catch (parseErr) {
    console.error("[recommendations] Error al parsear JSON:", parseErr.message);
    console.error("[recommendations] Raw content:", rawContent.slice(0, 500));
    return NextResponse.json(
      { error: "El modelo no devolvió JSON válido", fallback: true },
      { status: 502 }
    );
  }

  if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) {
    return NextResponse.json(
      { error: "Estructura de respuesta incorrecta", fallback: true },
      { status: 502 }
    );
  }

  const recommendations = parsed.recommendations.slice(0, 3).map((rec) => ({
    title:           String(rec.title || "Actividad de calma"),
    detail:          String(rec.detail || ""),
    duration:        String(rec.duration || "5 min"),
    icon:            safeIcon(rec.icon),
    deepExplanation: String(rec.deepExplanation || ""),
  }));

  return NextResponse.json({
    recommendations,
    ai: true,
    model: MODEL,
    // Tokens usados — útil para monitoreo
    usage: apiData.usage ?? null,
  });
}
