"use client";

/**
 * HORARIO — Vista de calendario diario (en construcción).
 *
 * TODO (futuro): calendario editable por el cuidador. Cada actividad se cruzará
 * con los datos biométricos de la pulsera (estrés, BPM, HRV) para que la IA
 * identifique qué momentos del día generan mayor ansiedad y anticipe
 * intervenciones preventivas antes de que ocurran los episodios.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconCalendar, IconActivity, IconWatch } from "@/components/marketing/icons";
import { usePeople } from "@/lib/peopleContext";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];

export default function ScheduleClient() {
  const router = useRouter();
  const { selectedPerson } = usePeople();
  const today = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][new Date().getDay()];
  const [activeDay, setActiveDay] = useState(DAYS.includes(today) ? today : "Lun");

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
            <IconCalendar size={12}/> Horario
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Semana{selectedPerson ? <> de <span className="text-brand font-bold">{selectedPerson.nombre}</span></> : ""}
          </h1>
          <p style={{ color: "var(--ink-dim)", fontSize: 14, margin: "0 0 4px" }}>
            Organiza las actividades de la semana para cruzarlas con los datos de la pulsera.
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
              {DAYS.map(day => {
                const isActive = day === activeDay;
                const isToday = day === today;
                return (
                  <button key={day} onClick={() => setActiveDay(day)} style={{
                    flex: 1, padding: "10px 8px", borderRadius: 12,
                    background: isActive ? "rgb(var(--brand-rgb) / 0.15)" : "var(--surface)",
                    border: isActive ? "1px solid rgb(var(--brand-rgb) / 0.35)" : "1px solid var(--border)",
                    color: isActive ? "var(--brand)" : "var(--ink-dim)",
                    fontSize: 13, fontWeight: isActive ? 700 : 400, cursor: "pointer", transition: "all 0.2s",
                    fontFamily: "Inter, sans-serif", position: "relative",
                  }}>
                    {day}
                    {isToday && <span style={{ position: "absolute", top: 4, right: 4, width: 5, height: 5, borderRadius: "50%", background: "var(--brand)" }}/>}
                  </button>
                );
              })}
            </div>

            <div className="card" style={{ padding: "40px 24px", textAlign: "center", color: "var(--ink-dim)" }}>
              <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--ink-faint)" }}><IconCalendar size={28}/></div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Aún no hay horario configurado</div>
              <div style={{ fontSize: 13, maxWidth: 380, margin: "0 auto" }}>
                No hay actividades para {activeDay.toLowerCase()}. La edición del horario estará disponible próximamente.
              </div>
            </div>

            <div style={{
              marginTop: 24, display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: 8, fontSize: 12,
              background: "rgba(42, 157, 143, 0.08)", border: "1px solid rgba(42, 157, 143, 0.2)",
              color: "var(--brand)", fontWeight: 500,
            }}>
              <IconActivity size={11}/>
              Próximamente: horario editable cruzado con los datos biométricos de la IA
            </div>
          </>
        )}
      </div>
    </div>
  );
}
