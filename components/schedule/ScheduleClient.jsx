"use client";

/**
 * HORARIO — Calendario semanal de clases editable por el cuidador.
 *
 * Cada bloque (día + hora inicio + hora fin + título + categoría) se guarda en
 * `horario_actividades` (Supabase, scopeado por persona vía RLS). A futuro se
 * cruza con los datos biométricos de la pulsera para anticipar momentos de
 * mayor ansiedad (p. ej. transiciones entre clases).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft, IconCalendar, IconClock, IconX, IconWatch,
  IconBook, IconHeart, IconDroplet, IconGamepad, IconActivity, IconChevronDown,
} from "@/components/marketing/icons";
import { usePeople } from "@/lib/peopleContext";
import { useAuth } from "@/hooks/useAuth";

// dia: 0 = Lun … 6 = Dom
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAYS_LONG = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const todayIdx = (new Date().getDay() + 6) % 7;

// Categorías de actividad con color e icono propios.
const CATEGORIES = {
  clase:   { label: "Clase",   rgb: "42 157 143",  Icon: IconBook },
  terapia: { label: "Terapia", rgb: "139 124 246", Icon: IconHeart },
  comida:  { label: "Comida",  rgb: "232 163 61",  Icon: IconDroplet },
  recreo:  { label: "Recreo",  rgb: "91 155 213",  Icon: IconGamepad },
  otro:    { label: "Otro",    rgb: "148 163 184", Icon: IconActivity },
};
const CAT_KEYS = Object.keys(CATEGORIES);
const catOf = (k) => CATEGORIES[k] || CATEGORIES.otro;

// ─────────────────────────────────────────────────────────────────────────────
// Selector de hora propio (la entrada nativa <input type=time> se ve mal y
// hereda mal el color-scheme entre temas). Dos columnas: horas y minutos.
// ─────────────────────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

function TimeField({ value, onChange, placeholder = "--:--", accent = "42 157 143" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [h, m] = value ? value.split(":") : ["", ""];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (nh, nm) => {
    const hh = nh ?? h ?? "08";
    const mm = nm ?? m ?? "00";
    onChange(`${hh}:${mm}`);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--surface-elevated)", border: `1px solid ${open ? `rgb(${accent})` : "var(--border)"}`,
          borderRadius: 10, padding: "10px 12px", cursor: "pointer",
          color: value ? "var(--ink)" : "var(--ink-faint)", fontSize: 14,
          fontFamily: "Inter, sans-serif", fontWeight: value ? 600 : 400,
          fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em",
          transition: "border-color 0.15s", minWidth: 96, justifyContent: "space-between",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <IconClock size={14} style={{ color: value ? `rgb(${accent})` : "var(--ink-faint)" }} />
          {value || placeholder}
        </span>
        <IconChevronDown size={13} style={{ color: "var(--ink-faint)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div className="timepop" style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 40,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4,
          background: "var(--bg-elevated)", border: "1px solid var(--border)",
          borderRadius: 12, padding: 6, boxShadow: "0 12px 32px rgb(0 0 0 / 0.18)",
          width: 168,
        }}>
          {[["Hora", HOURS, h, (v) => pick(v, null)], ["Min", MINUTES, m, (v) => pick(null, v)]].map(
            ([label, items, sel, fn]) => (
              <div key={label}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--ink-faint)", padding: "4px 6px 6px", fontWeight: 700 }}>{label}</div>
                <div className="timecol" style={{ maxHeight: 168, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                  {items.map((it) => {
                    const active = it === sel;
                    return (
                      <button key={it} type="button" onClick={() => fn(it)} style={{
                        padding: "7px 8px", borderRadius: 8, border: "none", cursor: "pointer",
                        textAlign: "center", fontSize: 14, fontFamily: "Inter, sans-serif",
                        fontVariantNumeric: "tabular-nums",
                        background: active ? `rgb(${accent} / 0.16)` : "transparent",
                        color: active ? `rgb(${accent})` : "var(--ink-dim)",
                        fontWeight: active ? 700 : 500,
                      }}>{it}</button>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function ScheduleClient() {
  const router = useRouter();
  const { selectedPerson } = usePeople();
  const { supabase } = useAuth();
  const ninoId = selectedPerson?.id || null;

  const [activeDay, setActiveDay] = useState(todayIdx);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hora, setHora] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("clase");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadActivities = useCallback(async () => {
    if (!ninoId) { setActivities([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("horario_actividades")
      .select("id, dia, hora, hora_fin, titulo, categoria")
      .eq("niño_id", ninoId)
      .order("hora", { ascending: true });
    if (error) setError(error.message);
    setActivities(data || []);
    setLoading(false);
  }, [supabase, ninoId]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  const dayActivities = activities
    .filter((a) => a.dia === activeDay)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const finInvalid = hora && horaFin && horaFin <= hora;

  const addActivity = async () => {
    if (!ninoId || !hora || !titulo.trim() || saving || finInvalid) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("horario_actividades").insert({
      "niño_id": ninoId,
      dia: activeDay,
      hora,
      hora_fin: horaFin || null,
      titulo: titulo.trim(),
      categoria,
    });
    if (error) {
      setError(error.message);
    } else {
      setHora("");
      setHoraFin("");
      setTitulo("");
      await loadActivities();
    }
    setSaving(false);
  };

  const deleteActivity = async (id) => {
    setActivities((prev) => prev.filter((a) => a.id !== id)); // optimista
    const { error } = await supabase.from("horario_actividades").delete().eq("id", id);
    if (error) { setError(error.message); await loadActivities(); }
  };

  const canSave = hora && titulo.trim() && !saving && !finInvalid;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", position: "relative" }}>
      <button onClick={() => router.push("/dashboard")} style={{
        position: "fixed", top: 28, left: 28, zIndex: 10,
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "8px 14px", cursor: "pointer",
        color: "var(--ink-muted)", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
      }}>
        <IconArrowLeft size={14}/> Volver
      </button>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "88px 24px 80px", position: "relative", zIndex: 2 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "var(--brand)", marginBottom: 10, fontWeight: 700 }}>
            <IconCalendar size={12}/> Horario de clases
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Semana{selectedPerson ? <> de <span className="text-brand font-bold">{selectedPerson.nombre}</span></> : ""}
          </h1>
          <p style={{ color: "var(--ink-dim)", fontSize: 14, margin: "0 0 4px" }}>
            Arma su horario de clases y actividades para cruzarlo con los datos de la pulsera.
          </p>
        </div>

        {!selectedPerson ? (
          <div className="card" style={{ padding: "40px 24px", textAlign: "center", color: "var(--ink-dim)" }}>
            <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--ink-faint)" }}><IconWatch size={28}/></div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Sin persona vinculada</div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>Conecta una pulsera a una persona para configurar su horario.</div>
            <Link href="/pairing" style={{ fontSize: 13, fontWeight: 600, color: "var(--brand)", textDecoration: "none" }}>Conectar pulsera →</Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {DAYS.map((day, idx) => {
                const isActive = idx === activeDay;
                const isToday = idx === todayIdx;
                const count = activities.filter((a) => a.dia === idx).length;
                return (
                  <button key={day} onClick={() => setActiveDay(idx)} style={{
                    flex: 1, padding: "10px 6px", borderRadius: 12,
                    background: isActive ? "rgb(var(--brand-rgb) / 0.15)" : "var(--surface)",
                    border: isActive ? "1px solid rgb(var(--brand-rgb) / 0.35)" : "1px solid var(--border)",
                    color: isActive ? "var(--brand)" : "var(--ink-dim)",
                    fontSize: 13, fontWeight: isActive ? 700 : 400, cursor: "pointer", transition: "all 0.2s",
                    fontFamily: "Inter, sans-serif", position: "relative",
                  }}>
                    {day}
                    {isToday && <span style={{ position: "absolute", top: 4, right: 4, width: 5, height: 5, borderRadius: "50%", background: "var(--brand)" }}/>}
                    {count > 0 && <span style={{ display: "block", fontSize: 10, marginTop: 2, opacity: 0.7 }}>{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* Lista de actividades del día */}
            {loading ? (
              <div className="card" style={{ padding: "32px 24px", textAlign: "center", color: "var(--ink-dim)", fontSize: 13 }}>Cargando…</div>
            ) : dayActivities.length === 0 ? (
              <div className="card" style={{ padding: "36px 24px", textAlign: "center", color: "var(--ink-dim)" }}>
                <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--ink-faint)" }}><IconCalendar size={26}/></div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Sin clases el {DAYS_LONG[activeDay]}</div>
                <div style={{ fontSize: 13 }}>Agrega la primera abajo.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {dayActivities.map((a) => {
                  const c = catOf(a.categoria);
                  return (
                    <div key={a.id} className="card" style={{
                      padding: "14px 16px", display: "flex", alignItems: "center", gap: 14,
                      borderLeft: `3px solid rgb(${c.rgb})`,
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 78 }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: `rgb(${c.rgb})`, fontWeight: 700, fontSize: 14, fontFamily: "Inter, sans-serif", fontVariantNumeric: "tabular-nums" }}>
                          {a.hora.slice(0, 5)}
                        </div>
                        {a.hora_fin && (
                          <div style={{ fontSize: 11, color: "var(--ink-faint)", fontVariantNumeric: "tabular-nums", marginTop: 1 }}>
                            {a.hora_fin.slice(0, 5)}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>{a.titulo}</div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 3, fontSize: 11, fontWeight: 600, color: `rgb(${c.rgb})` }}>
                          <c.Icon size={11}/> {c.label}
                        </div>
                      </div>
                      <button onClick={() => deleteActivity(a.id)} aria-label="Eliminar actividad" style={{
                        background: "transparent", border: "none", cursor: "pointer",
                        color: "var(--ink-faint)", display: "inline-flex", padding: 4, borderRadius: 6,
                      }}>
                        <IconX size={16}/>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Formulario de alta */}
            <div className="card" style={{ marginTop: 18, padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Categorías */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {CAT_KEYS.map((k) => {
                  const c = CATEGORIES[k];
                  const active = categoria === k;
                  return (
                    <button key={k} type="button" onClick={() => setCategoria(k)} style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "7px 12px", borderRadius: 999, cursor: "pointer",
                      fontSize: 12.5, fontWeight: 600, fontFamily: "Inter, sans-serif",
                      background: active ? `rgb(${c.rgb} / 0.16)` : "var(--surface)",
                      border: active ? `1px solid rgb(${c.rgb} / 0.5)` : "1px solid var(--border)",
                      color: active ? `rgb(${c.rgb})` : "var(--ink-dim)",
                      transition: "all 0.15s",
                    }}>
                      <c.Icon size={13}/> {c.label}
                    </button>
                  );
                })}
              </div>

              {/* Horas + título */}
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <TimeField value={hora} onChange={setHora} placeholder="Inicio" accent={catOf(categoria).rgb} />
                  <span style={{ color: "var(--ink-faint)", fontSize: 14 }}>–</span>
                  <TimeField value={horaFin} onChange={setHoraFin} placeholder="Fin" accent={catOf(categoria).rgb} />
                </div>
                <input type="text" value={titulo} placeholder="Nombre de la clase (ej. Matemáticas)"
                  onChange={(e) => setTitulo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addActivity()}
                  style={{
                    flex: 1, minWidth: 180, background: "var(--surface-elevated)",
                    border: "1px solid var(--border)", borderRadius: 10, padding: "11px 12px",
                    color: "var(--ink)", fontSize: 14,
                  }}/>
                <button onClick={addActivity} disabled={!canSave} style={{
                  padding: "11px 18px", borderRadius: 10, border: "none", cursor: canSave ? "pointer" : "default",
                  background: "linear-gradient(135deg, #5EDC9A, #7DD3B8)", color: "#06281a",
                  fontWeight: 700, fontSize: 14, opacity: canSave ? 1 : 0.5, transition: "opacity 0.15s",
                }}>
                  {saving ? "Guardando…" : "+ Agregar"}
                </button>
              </div>

              {finInvalid && (
                <div style={{ fontSize: 12, color: "var(--danger, #ec5b6b)" }}>
                  La hora de fin debe ser posterior a la de inicio.
                </div>
              )}
            </div>

            {error && (
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--danger, #ec5b6b)" }}>
                No se pudo guardar: {error}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .timecol::-webkit-scrollbar { width: 6px; }
        .timecol::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        .timecol { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
        .timepop { animation: tpop 0.12s ease-out; transform-origin: top left; }
        @keyframes tpop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
