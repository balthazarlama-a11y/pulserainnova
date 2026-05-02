"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GradientText, AmbientOrbs, Card } from "@/components/marketing/primitives";
import { IconArrowLeft, IconWatch, IconCheck, IconWifi, IconRefresh } from "@/components/marketing/icons";
import { CHILD_PROFILE } from "@/lib/mockData";

// Dispositivos de ejemplo que aparecen en el escaneo BLE
const MOCK_DEVICES = [
  { id: "CB-A3F2", name: "CalmBand Pro", rssi: -48, battery: 87 },
  { id: "CB-9D1E", name: "CalmBand Mini", rssi: -61, battery: 62 },
];

export default function PairingClient() {
  const router = useRouter();
  const [step, setStep] = useState("idle"); // idle | scanning | found | connecting | success
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const handleScan = () => {
    setStep("scanning");
    setDevices([]);
    // Simula descubrimiento progresivo de dispositivos
    setTimeout(() => setDevices([MOCK_DEVICES[0]]), 900);
    setTimeout(() => {
      setDevices(MOCK_DEVICES);
      setStep("found");
    }, 1800);
  };

  const handleConnect = (device) => {
    setSelectedDevice(device);
    setStep("connecting");
    setTimeout(() => {
      setStep("success");
      setTimeout(() => router.push("/dashboard"), 2000);
    }, 1600);
  };

  const signalBars = (rssi) => {
    // rssi: -40 (fuerte) a -80 (débil)
    const strength = Math.max(1, Math.min(4, Math.round((rssi + 80) / 10)));
    return Array.from({ length: 4 }, (_, i) => (
      <div
        key={i}
        style={{
          width: 3, borderRadius: 2,
          height: 4 + i * 3,
          background: i < strength ? "#A8E6CF" : "rgba(255,255,255,0.15)",
        }}
      />
    ));
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-2)", position: "relative",
      overflow: "hidden", padding: 32,
    }}>
      <AmbientOrbs/>

      <button onClick={() => router.push("/dashboard")} style={{
        position: "absolute", top: 28, left: 28, zIndex: 5,
        background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "8px 14px", cursor: "pointer",
        color: "var(--ink-muted)", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13
      }}>
        <IconArrowLeft size={14}/> Volver
      </button>

      <div style={{ maxWidth: 520, width: "100%", margin: "0 auto", position: "relative", zIndex: 2, paddingTop: 80 }}>

        {/* Icono animado */}
        <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {step === "scanning" && [0, 0.5, 1].map(d => (
            <div key={d} style={{
              position: "absolute", inset: 16, borderRadius: "50%",
              border: "2px solid rgba(184,164,255,0.4)",
              animation: `pulse-ring 2.2s ${d}s ease-out infinite`
            }}/>
          ))}
          <div style={{
            width: 88, height: 88, borderRadius: 44,
            background: step === "success"
              ? "linear-gradient(135deg, #5EDC9A, #7DD3B8)"
              : "linear-gradient(135deg, #2a2035, #0f0a1f)",
            border: "1px solid rgba(184,164,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: step === "success" ? "#0A2A1A" : "#B8A4FF",
            boxShadow: step === "success"
              ? "0 0 0 12px rgba(94,220,154,0.12), 0 0 60px rgba(94,220,154,0.4)"
              : "0 0 40px rgba(184,164,255,0.3)",
            transition: "all 0.4s",
          }}>
            {step === "success" ? <IconCheck size={40} stroke={2.5}/> : <IconWatch size={40}/>}
          </div>
        </div>

        {/* Estado: éxito */}
        {step === "success" && (
          <div style={{ textAlign: "center", animation: "heroTextIn 0.5s forwards" }}>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 36, fontWeight: 500, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
              ¡<GradientText>Conectado</GradientText>!
            </h1>
            <p style={{ color: "var(--ink-dim)", fontSize: 15 }}>
              La pulsera de {CHILD_PROFILE.name} está lista. Volviendo al panel…
            </p>
          </div>
        )}

        {/* Estado: inactivo o escaneando */}
        {(step === "idle" || step === "scanning" || step === "found") && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "rgba(184,164,255,0.9)", fontWeight: 500, marginBottom: 10 }}>
                Vinculación · CalmBand
              </div>
              <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 34, fontWeight: 500, margin: "0 0 10px", letterSpacing: "-0.02em", color: "var(--ink)" }}>
                Busca tu <GradientText>pulsera</GradientText>
              </h1>
              <p style={{ color: "var(--ink-dim)", fontSize: 14, lineHeight: 1.55, maxWidth: 380, margin: "0 auto" }}>
                Asegúrate de que la pulsera esté encendida y cerca del dispositivo.
                Pulsa el botón para comenzar la búsqueda por Bluetooth.
              </p>
            </div>

            {/* Botón de escaneo */}
            <button
              onClick={handleScan}
              disabled={step === "scanning"}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                width: "100%", padding: "14px", borderRadius: 14, marginBottom: 20,
                background: step === "scanning"
                  ? "rgba(184,164,255,0.08)"
                  : "linear-gradient(135deg, rgba(184,164,255,0.2), rgba(184,164,255,0.08))",
                border: "1px solid rgba(184,164,255,0.35)",
                color: "#D4C5FF", fontSize: 15, fontWeight: 600, cursor: step === "scanning" ? "not-allowed" : "pointer",
                fontFamily: "Inter, sans-serif", transition: "all 0.2s",
              }}
            >
              {step === "scanning" ? (
                <>
                  <span style={{
                    width: 16, height: 16, border: "2px solid rgba(184,164,255,0.3)",
                    borderTopColor: "#B8A4FF", borderRadius: 8,
                    animation: "spin-slow 0.8s linear infinite", display: "inline-block"
                  }}/>
                  Buscando dispositivos…
                </>
              ) : (
                <>
                  <IconRefresh size={16}/>
                  {step === "found" ? "Buscar de nuevo" : "Buscar dispositivo"}
                </>
              )}
            </button>

            {/* Lista de dispositivos encontrados */}
            {devices.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "var(--ink-dim)", marginBottom: 4 }}>
                  {devices.length} {devices.length === 1 ? "dispositivo encontrado" : "dispositivos encontrados"}
                </div>
                {devices.map(device => (
                  <Card key={device.id} style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                        background: "rgba(184,164,255,0.1)", border: "1px solid rgba(184,164,255,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "#B8A4FF",
                      }}>
                        <IconWatch size={20}/>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{device.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--ink-dim)" }}>
                          <span>{device.id}</span>
                          <span>·</span>
                          <span>Batería {device.battery}%</span>
                        </div>
                      </div>
                      {/* Barras de señal */}
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginRight: 10 }}>
                        {signalBars(device.rssi)}
                      </div>
                      <button
                        onClick={() => handleConnect(device)}
                        style={{
                          padding: "8px 16px", borderRadius: 10,
                          background: "linear-gradient(135deg, #B8A4FF, #8B7FD8)",
                          border: "none", color: "#0D0824",
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Conectar
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {step === "idle" && devices.length === 0 && (
              <div style={{ textAlign: "center", padding: "28px 0", fontSize: 13, color: "var(--ink-faint)" }}>
                Pulsa el botón para comenzar la búsqueda
              </div>
            )}
          </>
        )}

        {/* Estado: conectando */}
        {step === "connecting" && (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 500, margin: "0 0 10px" }}>
              Conectando con <GradientText>{selectedDevice?.name}</GradientText>…
            </h2>
            <p style={{ color: "var(--ink-dim)", fontSize: 14 }}>
              Verificando emparejamiento seguro
            </p>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
              <span style={{
                width: 32, height: 32, border: "3px solid rgba(184,164,255,0.3)",
                borderTopColor: "#B8A4FF", borderRadius: 16,
                animation: "spin-slow 0.8s linear infinite", display: "inline-block"
              }}/>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.85); opacity: 0.8; }
          80%  { transform: scale(1.3);  opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
