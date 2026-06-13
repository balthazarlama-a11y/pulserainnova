import { NextResponse } from "next/server";

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

// meta/llama-3.2-3b-instruct: modelo 3B, ~1-3s de respuesta, ideal para JSON corto.
// Override con NVIDIA_MODEL en .env.local si querés probar otro tamaño.
const MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.2-3b-instruct";

// ─── Extrae el primer objeto JSON del texto del LLM ───────────────────────────
function extractJSON(text) {
  try { return JSON.parse(text.trim()); } catch {}
  const md = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (md) { try { return JSON.parse(md[1].trim()); } catch {} }
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  throw new Error("JSON inválido en respuesta del modelo");
}

const VALID_ICONS = ["wind", "gamepad", "music", "book", "heart"];
const safeIcon = (i) => (VALID_ICONS.includes(i) ? i : "heart");

// ─── Prompt mínimo — menos tokens = respuesta más rápida ─────────────────────
function buildPrompt({ stress, bpm, bpmResting, stressKey, childName, childAge }) {
  const levelMap = {
    calm:     "tranquilo — actividades de mantenimiento y creatividad",
    mild:     "levemente ansioso — prevención temprana",
    moderate: "ansioso — intervención activa necesaria",
    high:     "crisis de ansiedad — acción inmediata requerida",
  };

  return {
    system: "Eres un especialista en ansiedad infantil. Responde ÚNICAMENTE con JSON válido, sin texto adicional.",

    user: `Niño: ${childName}${childAge ? `, ${childAge} años` : ""}.
BPM actual: ${bpm} (basal: ${bpmResting}). Nivel de ansiedad: ${stress}/100. Estado: ${levelMap[stressKey]}.

Devuelve exactamente este JSON con 3 recomendaciones en español:
{"recommendations":[{"title":"nombre corto","detail":"frase breve para el cuidador","duration":"X min","icon":"wind","deepExplanation":"explicación científica de 2 frases"}]}

Reglas: icon debe ser uno de [wind,gamepad,music,book,heart]. Para estado "high" usa técnicas de grounding y respiración. Para "calm" usa actividades creativas.`,
  };
}

export async function POST(request) {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "NVIDIA_API_KEY no configurada en .env.local", fallback: true },
      { status: 503 }
    );
  }

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }); }

  const {
    stress = 35, bpm = 80, bpmResting = 78,
    stressKey = "mild", childName = "la persona", childAge = "",
  } = body;

  const { system, user } = buildPrompt({ stress, bpm, bpmResting, stressKey, childName, childAge });

  // ── Timeout manual 20s (modelo 3B responde en ~1-3s normalmente) ─────────
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 20000);

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
        temperature: 0.5,
        max_tokens: 350,   // 3 recomendaciones cortas caben en ~280 tokens
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err.name === "AbortError"
      ? `Timeout (20s) — modelo: ${MODEL}`
      : `Error de red: ${err.message}`;
    console.error("[recommendations]", msg);
    return NextResponse.json({ error: msg, fallback: true }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!nvidiaRes.ok) {
    const txt = await nvidiaRes.text().catch(() => "");
    console.error(`[recommendations] NVIDIA ${nvidiaRes.status}:`, txt.slice(0, 200));
    return NextResponse.json(
      { error: `NVIDIA respondió ${nvidiaRes.status}`, fallback: true },
      { status: nvidiaRes.status }
    );
  }

  let apiData;
  try { apiData = await nvidiaRes.json(); }
  catch { return NextResponse.json({ error: "Respuesta inválida de NVIDIA", fallback: true }, { status: 502 }); }

  const rawContent = apiData.choices?.[0]?.message?.content ?? "";
  if (!rawContent) {
    return NextResponse.json({ error: "Respuesta vacía", fallback: true }, { status: 502 });
  }

  let parsed;
  try { parsed = extractJSON(rawContent); }
  catch {
    console.error("[recommendations] No parseable:", rawContent.slice(0, 300));
    return NextResponse.json({ error: "El modelo no devolvió JSON válido", fallback: true }, { status: 502 });
  }

  if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) {
    return NextResponse.json({ error: "Estructura incorrecta", fallback: true }, { status: 502 });
  }

  const recommendations = parsed.recommendations.slice(0, 3).map((r) => ({
    title:           String(r.title || "Actividad de calma"),
    detail:          String(r.detail || ""),
    duration:        String(r.duration || "5 min"),
    icon:            safeIcon(r.icon),
    deepExplanation: String(r.deepExplanation || ""),
  }));

  return NextResponse.json({ recommendations, ai: true, model: MODEL });
}
