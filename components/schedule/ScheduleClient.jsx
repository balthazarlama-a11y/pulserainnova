"use client";

/**
 * HORARIO DE SIMÓN — Vista de calendario diario
 *
 * TODO (futuro): Este calendario será editable por el cuidador. Cada actividad
 * se cruzará con los datos biométricos registrados por la pulsera (estrés, BPM, HRV)
 * para que la IA identifique qué momentos del día generan mayor ansiedad y pueda
 * hacer predicciones preventivas antes de que ocurran los episodios.
 * Ejemplo: si cada martes a las 9:00 (clase de matemáticas) el estrés sube,
 * la IA alertará al cuidador a las 8:50 para preparar una intervención temprana.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GradientText, AmbientOrbs, Card } from "@/components/marketing/primitives";
import { IconArrowLeft, IconCalendar, IconActivity, IconBook, IconMusic, IconHeart, IconSun, IconWind } from "@/components/marketing/icons";
import { CHILD_PROFILE } from "@/lib/mockData";

// ─── Datos del horario semanal del estudiante ─────────────────────────────────
// En producción: editables por el cuidador y sincronizados con la base de datos.
const SCHEDULE = {
  Lun: [
    { time: "07:00", end: "07:30", label: "Desayuno", category: "routine",  color: "#F5D06F", icon: "sun" },
    { time: "08:00", end: "08:10", label: "Llegada al colegio", category: "school", color: "var(--brand)", icon: "activity" },
    { time: "08:15", end: "09:00", label: "Lengua y Literatura", category: "school", color: "var(--brand)", icon: "book" },
    { time: "09:00", end: "09:45", label: "Matemáticas ⚡", category: "school-hard", color: "#FFB4A2", icon: "book" },
    { time: "09:45", end: "10:15", label: "Recreo", category: "break", color: "#5EDC9A", icon: "heart" },
    { time: "10:15", end: "11:00", label: "Ciencias Naturales", category: "school", color: "var(--brand)", icon: "book" },
    { time: "11:00", end: "11:45", label: "Historia", category: "school", color: "var(--brand)", icon: "book" },
    { time: "11:45", end: "12:30", label: "Educación Física", category: "activity", color: "#A8E6CF", icon: "activity" },
    { time: "12:30", end: "13:30", label: "Almuerzo", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "13:30", end: "14:15", label: "Inglés", category: "school", color: "var(--brand)", icon: "book" },
    { time: "14:15", end: "15:00", label: "Arte y Creatividad", category: "creative", color: "#F4A6C0", icon: "music" },
    { time: "15:00", end: "15:30", label: "Salida · Merienda", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "16:00", end: "17:30", label: "Deberes", category: "study", color: "#8B7FD8", icon: "book" },
    { time: "18:00", end: "19:00", label: "Tiempo libre", category: "break", color: "#5EDC9A", icon: "heart" },
    { time: "19:00", end: "19:30", label: "Cena", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "20:00", end: "20:30", label: "Relajación · Lectura", category: "calm", color: "#A8E6CF", icon: "wind" },
    { time: "21:00", end: "07:00", label: "Dormir", category: "sleep", color: "#4A5568", icon: "moon" },
  ],
  Mar: [
    { time: "07:00", end: "07:30", label: "Desayuno", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "08:15", end: "09:00", label: "Matemáticas ⚡", category: "school-hard", color: "#FFB4A2", icon: "book" },
    { time: "09:00", end: "09:45", label: "Ciencias Sociales", category: "school", color: "var(--brand)", icon: "book" },
    { time: "09:45", end: "10:15", label: "Recreo", category: "break", color: "#5EDC9A", icon: "heart" },
    { time: "10:15", end: "11:45", label: "Tecnología", category: "school", color: "var(--brand)", icon: "activity" },
    { time: "11:45", end: "12:30", label: "Música", category: "creative", color: "#F4A6C0", icon: "music" },
    { time: "12:30", end: "13:30", label: "Almuerzo", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "13:30", end: "15:00", label: "Lengua y Literatura", category: "school", color: "var(--brand)", icon: "book" },
    { time: "15:00", end: "15:30", label: "Salida · Merienda", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "16:00", end: "17:00", label: "Deberes", category: "study", color: "#8B7FD8", icon: "book" },
    { time: "17:30", end: "19:00", label: "Natación 🏊", category: "activity", color: "#A8E6CF", icon: "activity" },
    { time: "19:00", end: "19:30", label: "Cena", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "21:00", end: "07:00", label: "Dormir", category: "sleep", color: "#4A5568", icon: "moon" },
  ],
  Mié: [
    { time: "07:00", end: "07:30", label: "Desayuno", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "08:15", end: "09:45", label: "Inglés (doble clase)", category: "school", color: "var(--brand)", icon: "book" },
    { time: "09:45", end: "10:15", label: "Recreo", category: "break", color: "#5EDC9A", icon: "heart" },
    { time: "10:15", end: "12:30", label: "Matemáticas ⚡ + Ciencias", category: "school-hard", color: "#FFB4A2", icon: "book" },
    { time: "12:30", end: "13:30", label: "Almuerzo", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "13:30", end: "15:00", label: "Educación Física + Arte", category: "activity", color: "#A8E6CF", icon: "activity" },
    { time: "15:00", end: "15:30", label: "Salida · Merienda", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "16:00", end: "17:30", label: "Deberes + Repaso", category: "study", color: "#8B7FD8", icon: "book" },
    { time: "18:00", end: "18:30", label: "Ejercicio de respiración", category: "calm", color: "#A8E6CF", icon: "wind" },
    { time: "19:00", end: "19:30", label: "Cena", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "21:00", end: "07:00", label: "Dormir", category: "sleep", color: "#4A5568", icon: "moon" },
  ],
  Jue: [
    { time: "07:00", end: "07:30", label: "Desayuno", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "08:15", end: "09:45", label: "Historia + Geografía", category: "school", color: "var(--brand)", icon: "book" },
    { time: "09:45", end: "10:15", label: "Recreo", category: "break", color: "#5EDC9A", icon: "heart" },
    { time: "10:15", end: "12:30", label: "Ciencias + Lengua", category: "school", color: "var(--brand)", icon: "book" },
    { time: "12:30", end: "13:30", label: "Almuerzo", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "13:30", end: "14:15", label: "Excursión / Proyecto", category: "creative", color: "#F4A6C0", icon: "heart" },
    { time: "14:15", end: "15:00", label: "Música", category: "creative", color: "#F4A6C0", icon: "music" },
    { time: "15:00", end: "15:30", label: "Salida · Merienda", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "16:00", end: "17:00", label: "Deberes ligeros", category: "study", color: "#8B7FD8", icon: "book" },
    { time: "17:00", end: "19:00", label: "Tiempo libre / Juego", category: "break", color: "#5EDC9A", icon: "heart" },
    { time: "19:00", end: "19:30", label: "Cena", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "21:00", end: "07:00", label: "Dormir", category: "sleep", color: "#4A5568", icon: "moon" },
  ],
  Vie: [
    { time: "07:00", end: "07:30", label: "Desayuno", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "08:15", end: "09:45", label: "Inglés + Tecnología", category: "school", color: "var(--brand)", icon: "book" },
    { time: "09:45", end: "10:15", label: "Recreo", category: "break", color: "#5EDC9A", icon: "heart" },
    { time: "10:15", end: "12:30", label: "Arte + Educación Física", category: "activity", color: "#A8E6CF", icon: "activity" },
    { time: "12:30", end: "13:30", label: "Almuerzo", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "13:30", end: "15:00", label: "Historia + Ciencias", category: "school", color: "var(--brand)", icon: "book" },
    { time: "15:00", end: "15:30", label: "Salida · ¡Fin de semana!", category: "break", color: "#5EDC9A", icon: "heart" },
    { time: "16:00", end: "17:30", label: "Merienda + Amigos", category: "break", color: "#5EDC9A", icon: "heart" },
    { time: "19:00", end: "19:30", label: "Cena familiar", category: "routine", color: "#F5D06F", icon: "sun" },
    { time: "20:00", end: "21:30", label: "Película / Juego de mesa", category: "creative", color: "#F4A6C0", icon: "music" },
    { time: "21:30", end: "07:00", label: "Dormir", category: "sleep", color: "#4A5568", icon: "moon" },
  ],
};

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];

const CATEGORY_LABELS = {
  routine:     "Rutina",
  school:      "Colegio",
  "school-hard": "Colegio · Alta exigencia",
  activity:    "Actividad física",
  creative:    "Creativo",
  break:       "Descanso",
  study:       "Estudio",
  calm:        "Calma",
  sleep:       "Sueño",
};

export default function ScheduleClient() {
  const router = useRouter();
  const today = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][new Date().getDay()];
  const [activeDay, setActiveDay] = useState(DAYS.includes(today) ? today : "Lun");

  const dayEvents = SCHEDULE[activeDay] || [];

  const iconMap = {
    sun:      <IconSun size={14}/>,
    activity: <IconActivity size={14}/>,
    book:     <IconBook size={14}/>,
    music:    <IconMusic size={14}/>,
    heart:    <IconHeart size={14}/>,
    wind:     <IconWind size={14}/>,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-2)", color: "var(--ink)", position: "relative" }}>
      <AmbientOrbs/>

      <button onClick={() => router.push("/dashboard")} style={{
        position: "fixed", top: 28, left: 28, zIndex: 10,
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "8px 14px", cursor: "pointer",
        color: "var(--ink-muted)", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
      }}>
        <IconArrowLeft size={14}/> Volver
      </button>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "88px 24px 80px", position: "relative", zIndex: 2 }}>

        {/* Encabezado */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "rgba(184,164,255,0.9)", marginBottom: 10 }}>
            <IconCalendar size={12}/> Horario Escolar
          </div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 36, fontWeight: 500, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Semana de <GradientText>{CHILD_PROFILE.name}</GradientText>
          </h1>
          <p style={{ color: "var(--ink-dim)", fontSize: 14, margin: "0 0 4px" }}>
            Horario predeterminado de estudiante de primaria.
          </p>
          {/* Nota sobre integración futura con IA */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8,
            padding: "6px 12px", borderRadius: 8, fontSize: 12,
            background: "rgba(184,164,255,0.08)", border: "1px solid rgba(184,164,255,0.2)",
            color: "rgba(184,164,255,0.8)",
          }}>
            <IconActivity size={11}/>
            Próximamente: horario editable · cruzado con datos biométricos de la IA
          </div>
        </div>

        {/* Selector de día */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {DAYS.map(day => {
            const isActive = day === activeDay;
            const isToday = day === today;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: 12,
                  background: isActive ? "rgb(var(--brand-rgb) / 0.15)" : "var(--surface)",
                  border: isActive ? "1px solid rgb(var(--brand-rgb) / 0.35)" : "1px solid var(--border)",
                  color: isActive ? "var(--brand)" : "var(--ink-dim)",
                  fontSize: 13, fontWeight: isActive ? 700 : 400,
                  cursor: "pointer", transition: "all 0.2s",
                  fontFamily: "Inter, sans-serif",
                  position: "relative",
                }}
              >
                {day}
                {isToday && (
                  <span style={{
                    position: "absolute", top: 4, right: 4,
                    width: 5, height: 5, borderRadius: "50%",
                    background: "var(--brand)",
                  }}/>
                )}
              </button>
            );
          })}
        </div>

        {/* Leyenda de categorías */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {[
            { cat: "school", label: "Colegio", color: "var(--brand)" },
            { cat: "school-hard", label: "Alta exigencia", color: "#FFB4A2" },
            { cat: "activity", label: "Actividad física", color: "#A8E6CF" },
            { cat: "break", label: "Descanso", color: "#5EDC9A" },
            { cat: "creative", label: "Creativo", color: "#F4A6C0" },
            { cat: "calm", label: "Calma", color: "#A8E6CF" },
          ].map(item => (
            <div key={item.cat} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 11, color: item.color,
              background: `${item.color}14`, border: `1px solid ${item.color}30`,
              borderRadius: 99, padding: "3px 10px",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: item.color, flexShrink: 0 }}/>
              {item.label}
            </div>
          ))}
        </div>

        {/* Lista de actividades */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {dayEvents.map((event, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 16px", borderRadius: 12,
                background: event.category === "sleep"
                  ? "var(--surface)"
                  : "var(--surface)",
                border: `1px solid ${event.color}25`,
                opacity: event.category === "sleep" ? 0.5 : 1,
                transition: "all 0.2s",
              }}
            >
              {/* Hora */}
              <div style={{ fontSize: 12, color: "var(--ink-faint)", fontVariantNumeric: "tabular-nums", width: 44, flexShrink: 0 }}>
                {event.time}
              </div>

              {/* Línea de color */}
              <div style={{ width: 3, height: 36, borderRadius: 2, background: event.color, flexShrink: 0 }}/>

              {/* Ícono */}
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: `${event.color}18`, border: `1px solid ${event.color}30`,
                color: event.color, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {iconMap[event.icon] || <IconBook size={14}/>}
              </div>

              {/* Contenido */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{event.label}</div>
                <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                  {event.time} – {event.end} · {CATEGORY_LABELS[event.category] || event.category}
                </div>
              </div>

              {/* Badge de alta exigencia */}
              {event.category === "school-hard" && (
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "#FFB4A2",
                  background: "rgba(255,180,162,0.12)", border: "1px solid rgba(255,180,162,0.3)",
                  borderRadius: 6, padding: "2px 8px", flexShrink: 0, letterSpacing: 0.3,
                }}>
                  Estrés potencial
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Nota informativa */}
        <div style={{
          marginTop: 24, padding: "14px 16px", borderRadius: 12,
          background: "var(--surface)", border: "1px solid var(--border)",
          fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.6,
        }}>
          <strong style={{ color: "var(--ink)" }}>Nota:</strong> Los momentos marcados como{" "}
          <span style={{ color: "#FFB4A2" }}>Alta exigencia</span> coinciden históricamente con
          picos de estrés en los datos de {CHILD_PROFILE.name}. La IA los utiliza como
          referencia para anticipar intervenciones preventivas.
        </div>
      </div>
    </div>
  );
}
