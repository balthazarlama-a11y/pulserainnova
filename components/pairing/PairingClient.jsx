"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconWatch, IconCheck, IconRefresh, IconAlertTriangle } from "@/components/marketing/icons";
import { useAuth } from "@/hooks/useAuth";

const MOCK_DEVICES = [
  { id: "CB-A3F2", mac: "F4:8E:38:CB:A3:F2", name: "CalmBand Pro", rssi: -48, battery: 87, firmware: "2.4.1" },
  { id: "CB-9D1E", mac: "F4:8E:38:CB:9D:1E", name: "CalmBand Mini", rssi: -61, battery: 62, firmware: "2.3.7" },
];

const CONNECTION_PHASES = [
  { label: "Estableciendo enlace BLE", durationMs: 500 },
  { label: "Transfiriendo red WiFi", durationMs: 800 },
  { label: "Sincronizando perfil del niño", durationMs: 500 },
];

const IconBluetooth = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 7l12 10-6 4V3l6 4L6 17"/>
  </svg>
);

const IconBattery = ({ size = 14, level = 100 }) => {
  const fill = level > 50 ? "#5EDC9A" : level > 20 ? "#F5D06F" : "#EC5B6B";
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 24 14" fill="none">
      <rect x="0.5" y="0.5" width="20" height="13" rx="2.5" stroke="currentColor" strokeOpacity="0.4"/>
      <rect x="21" y="4" width="2.5" height="6" rx="1" fill="currentColor" fillOpacity="0.4"/>
      <rect x="2" y="2" width={Math.max(1, (level / 100) * 17)} height="10" rx="1.5" fill={fill}/>
    </svg>
  );
};

const signalBars = (rssi) => {
  const strength = Math.max(1, Math.min(4, Math.round((rssi + 85) / 12)));
  const color = strength >= 3 ? "#5EDC9A" : strength === 2 ? "#F5D06F" : "#EC5B6B";
  return (
    <div className="flex items-end gap-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-[1.5px] transition-colors"
          style={{
            width: 3,
            height: 4 + i * 3,
            background: i < strength ? color : "rgba(255,255,255,0.12)",
            boxShadow: i < strength ? `0 0 6px ${color}66` : "none",
          }}
        />
      ))}
    </div>
  );
};

const ScanRadar = ({ children }) => (
  <div className="relative w-[200px] h-[200px] mx-auto flex items-center justify-center">
    {[0, 0.5, 1, 1.5].map((d) => (
      <div
        key={d}
        className="absolute inset-0 rounded-full border-2 border-brand/40"
        style={{ animation: `pulse-ring 2.8s ${d}s ease-out infinite` }}
      />
    ))}
    <div
      className="absolute inset-2 rounded-full"
      style={{
        background: "conic-gradient(from 0deg, rgba(184,164,255,0.4), transparent 35%, transparent 70%, rgba(184,164,255,0.4))",
        animation: "spin-slow 2.5s linear infinite",
        mask: "radial-gradient(circle, transparent 30%, black 31%)",
        WebkitMask: "radial-gradient(circle, transparent 30%, black 31%)",
      }}
    />
    <div
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        background: "radial-gradient(circle, transparent 60%, rgba(184,164,255,0.05) 70%), conic-gradient(from 0deg, rgba(255,255,255,0.04), transparent 25%, rgba(255,255,255,0.04) 50%, transparent 75%, rgba(255,255,255,0.04))",
      }}
    />
    <div
      className="relative w-[88px] h-[88px] rounded-full flex items-center justify-center text-brand bg-brand/10 border border-brand/20 shadow-sm"
    >
      {children}
    </div>
  </div>
);

export default function PairingClient() {
  const router = useRouter();
  const { supabase, user } = useAuth();
  const [step, setStep] = useState("idle");
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const timeoutsRef = useRef([]);

  // Formulario WiFi
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  
  // Selección de niño
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");

  useEffect(() => {
    if (user) {
      supabase.from("niños").select("*").eq("tutor_id", user.id).then(({ data }) => {
        if (data && data.length > 0) {
          setChildrenList(data);
          setSelectedChildId(data[0].id);
        }
      });
    }
  }, [user, supabase]);

  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);

  const schedule = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  };

  const handleScan = () => {
    setStep("scanning");
    setDevices([]);
    setErrorMsg(null);
    schedule(() => setDevices([MOCK_DEVICES[0]]), 900);
    schedule(() => {
      setDevices(MOCK_DEVICES);
      setStep("found");
    }, 1800);
  };

  const handleSelectDevice = (device) => {
    setSelectedDevice(device);
    setStep("configure");
  };

  const handleConnect = async () => {
    if (!selectedChildId || !ssid) return;
    
    setStep("connecting");
    setPhaseIndex(0);

    let acc = 0;
    CONNECTION_PHASES.forEach((phase, i) => {
      acc += phase.durationMs;
      schedule(() => setPhaseIndex(i + 1), acc);
    });

    schedule(async () => {
      setStep("success");
      schedule(() => router.push("/dashboard"), 2000);
    }, acc);
  };

  const handleNotFound = () => {
    setStep("error");
    setErrorMsg("No detectamos ninguna pulsera CalmBand en el rango. Verifica que esté encendida y cerca del dispositivo.");
  };

  const handleRetry = () => {
    setStep("idle");
    setDevices([]);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen text-ink relative overflow-hidden bg-bg">

      <button
        onClick={() => step === "configure" ? setStep("found") : router.push("/dashboard")}
        className="absolute top-7 left-7 z-[5] bg-surface border border-line rounded-xl px-3.5 py-2 cursor-pointer text-ink inline-flex items-center gap-1.5 text-[13px] hover:bg-surface-elevated transition shadow-sm"
      >
        <IconArrowLeft size={14}/> Volver
      </button>

      <div className="relative z-[2] max-w-[560px] w-full mx-auto px-5 sm:px-6 pt-24 pb-20">

        {step === "success" && (
          <div className="text-center" style={{ animation: "heroTextIn 0.5s forwards" }}>
            <div className="relative w-40 h-40 mx-auto mb-8 flex items-center justify-center">
              {[0, 0.4, 0.8].map((d) => (
                <div
                  key={d}
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: "2px solid rgba(94,220,154,0.4)",
                    animation: `pulse-ring 2s ${d}s ease-out infinite`,
                  }}
                />
              ))}
              <div
                className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-[#0A2A1A]"
                style={{
                  background: "linear-gradient(135deg, #5EDC9A, #7DD3B8)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  boxShadow: "0 0 0 12px rgba(94,220,154,0.12), 0 0 60px rgba(94,220,154,0.4)",
                }}
              >
                <IconCheck size={40} stroke={2.5}/>
              </div>
            </div>
            <h1 className="font-display font-medium m-0 mb-3 tracking-tight text-3xl sm:text-4xl text-brand">
              ¡Conectado!
            </h1>
            <p className="text-ink-dim text-[15px]">
              La pulsera ha sido configurada exitosamente. Volviendo al panel…
            </p>
          </div>
        )}

        {step === "error" && (
          <div className="text-center" style={{ animation: "heroTextIn 0.4s forwards" }}>
            <div
              className="w-[88px] h-[88px] mx-auto mb-7 rounded-full flex items-center justify-center text-danger"
              style={{
                background: "linear-gradient(135deg, rgba(236,91,107,0.2), rgba(236,91,107,0.05))",
                border: "1px solid rgba(236,91,107,0.4)",
                boxShadow: "0 0 0 8px rgba(236,91,107,0.06), 0 0 40px rgba(236,91,107,0.25)",
              }}
            >
              <IconAlertTriangle size={36}/>
            </div>
            <h1 className="font-display font-medium m-0 mb-3 tracking-tight text-3xl sm:text-4xl">
              No pudimos conectar
            </h1>
            <p className="text-ink-dim text-sm leading-relaxed max-w-[400px] mx-auto mb-7">
              {errorMsg}
            </p>
            <button
              onClick={handleRetry}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold cursor-pointer border-0 inline-flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, #B8A4FF, #8B7FD8)",
                color: "#0D0824",
                boxShadow: "0 8px 24px -6px rgba(184,164,255,0.5)",
              }}
            >
              <IconRefresh size={15}/> Reintentar emparejamiento
            </button>
          </div>
        )}

        {step === "configure" && (
          <div className="card p-6 sm:p-8 space-y-6" style={{ animation: "heroTextIn 0.3s forwards" }}>
            <div>
              <h2 className="text-xl font-semibold mb-2">Configurar Pulsera</h2>
              <p className="text-sm text-ink-muted">Conecta la pulsera <span className="text-brand font-medium">{selectedDevice?.name}</span> a la red WiFi del colegio y asígnala a un niño.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink-muted block">Selecciona al niño</label>
                <select 
                  className="w-full bg-surface-elevated border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-colors"
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                >
                  <option value="" disabled>-- Elige un perfil --</option>
                  {childrenList.map((child) => (
                    <option key={child.id} value={child.id}>{child.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ink-muted block">Red WiFi (Colegio)</label>
                <input 
                  type="text" 
                  placeholder="Ej. Colegio_Red_5G"
                  className="w-full bg-surface-elevated border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-colors"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ink-muted block">Contraseña WiFi</label>
                <input 
                  type="password" 
                  placeholder="Contraseña de la red"
                  className="w-full bg-surface-elevated border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={!ssid || !selectedChildId}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold cursor-pointer border-0 inline-flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #B8A4FF, #8B7FD8)",
                color: "#0D0824",
                boxShadow: "0 4px 14px -4px rgba(184,164,255,0.5)",
              }}
            >
              Transferir configuración y Conectar
            </button>
          </div>
        )}

        {step === "connecting" && (
          <div className="text-center" style={{ animation: "heroTextIn 0.3s forwards" }}>
            <ScanRadar>
              <IconWatch size={36}/>
            </ScanRadar>
            <h2 className="font-display font-medium m-0 mt-8 mb-2 tracking-tight text-2xl sm:text-3xl">
              Configurando <span className="text-brand font-semibold">{selectedDevice?.name}</span>…
            </h2>
            <div className="card p-5 max-w-[420px] mx-auto mt-6">
              <div className="space-y-3">
                {CONNECTION_PHASES.map((phase, i) => {
                  const done = i < phaseIndex;
                  const active = i === phaseIndex;
                  return (
                    <div key={i} className="flex items-center gap-3 text-left">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all"
                        style={{
                          background: done ? "rgba(94,220,154,0.2)" : active ? "rgba(184,164,255,0.2)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${done ? "rgba(94,220,154,0.5)" : active ? "rgba(184,164,255,0.5)" : "var(--border)"}`,
                          color: done ? "#5EDC9A" : active ? "#B8A4FF" : "var(--ink-faint)",
                        }}
                      >
                        {done ? (
                          <IconCheck size={12} stroke={3}/>
                        ) : active ? (
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#B8A4FF", animation: "simPulseSmall 1s ease-in-out infinite" }} />
                        ) : (
                          <span className="text-[10px] tabular-nums">{i + 1}</span>
                        )}
                      </div>
                      <span className="text-[13px] transition-colors" style={{ color: done ? "var(--ink-muted)" : active ? "var(--ink)" : "var(--ink-faint)", fontWeight: active ? 600 : 400 }}>
                        {phase.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {(step === "idle" || step === "scanning" || step === "found") && (
          <>
            <div className="mb-8 flex justify-center">
              {step === "scanning" ? (
                <ScanRadar>
                  <IconBluetooth size={36}/>
                </ScanRadar>
              ) : (
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full blur-2xl animate-breathe-slow"
                    style={{ background: "radial-gradient(circle, rgba(184,164,255,0.4), transparent 65%)" }}
                  />
                  <div
                    className="relative w-[88px] h-[88px] rounded-full flex items-center justify-center text-brand bg-brand/10 border border-brand/20 shadow-sm"
                  >
                    <IconWatch size={40}/>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center mb-7">
              <div className="text-[11px] tracking-[0.22em] uppercase text-brand font-medium mb-2.5">
                Vinculación · CalmBand
              </div>
              <h1 className="font-display font-medium m-0 mb-2.5 tracking-tight text-3xl sm:text-4xl">
                {step === "scanning"
                  ? <>Buscando tu <span className="text-brand font-bold">pulsera</span>…</>
                  : step === "found"
                  ? <>Encontramos <span className="text-brand font-bold">{devices.length}</span></>
                  : <>Busca tu <span className="text-brand font-bold">pulsera</span></>
                }
              </h1>
              <p className="text-ink-dim text-sm leading-relaxed max-w-[380px] mx-auto">
                {step === "scanning"
                  ? "Escaneando dispositivos BLE en un radio de 10 metros…"
                  : step === "found"
                  ? "Elige la pulsera de tu niño para emparejarla."
                  : "Asegúrate de que la pulsera esté encendida y cerca de ti. Pulsa el botón para comenzar la búsqueda."}
              </p>
            </div>

            <button
              onClick={handleScan}
              disabled={step === "scanning"}
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl mb-5 text-[15px] font-semibold cursor-pointer transition-all disabled:cursor-not-allowed"
              style={{
                background: step === "scanning" ? "rgba(184,164,255,0.08)" : "linear-gradient(135deg, rgba(184,164,255,0.22), rgba(184,164,255,0.08))",
                border: "1px solid rgba(184,164,255,0.35)",
                color: "#D4C5FF",
                boxShadow: step === "scanning" ? "none" : "0 8px 24px -8px rgba(184,164,255,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              {step === "scanning" ? (
                <>
                  <span className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full inline-block" style={{ animation: "spin-slow 0.8s linear infinite" }} />
                  Buscando dispositivos…
                </>
              ) : (
                <>
                  <IconRefresh size={16}/>
                  {step === "found" ? "Buscar de nuevo" : "Buscar dispositivo"}
                </>
              )}
            </button>

            {devices.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[11px] tracking-[0.18em] uppercase text-ink-dim">
                    {devices.length} {devices.length === 1 ? "dispositivo encontrado" : "dispositivos encontrados"}
                  </div>
                </div>
                {devices.map((device, i) => (
                  <div
                    key={device.id}
                    className="card p-4 sm:p-5 transition-all hover:-translate-y-0.5 cursor-pointer"
                    onClick={() => handleSelectDevice(device)}
                    style={{
                      animation: `heroTextIn 0.4s ${i * 0.1}s both`,
                    }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-[46px] h-[46px] rounded-xl shrink-0 flex items-center justify-center text-brand" style={{ background: "rgba(184,164,255,0.1)", border: "1px solid rgba(184,164,255,0.25)" }}>
                        <IconWatch size={22}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[15px] font-semibold truncate">{device.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-ink-dim">
                          <span className="tabular-nums">{device.mac}</span>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        {signalBars(device.rssi)}
                      </div>
                      <button
                        className="shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer border-0 hover:scale-[1.03] active:scale-[0.98] transition-transform"
                        style={{ background: "linear-gradient(135deg, #B8A4FF, #8B7FD8)", color: "#0D0824", boxShadow: "0 4px 14px -4px rgba(184,164,255,0.5)" }}
                      >
                        Seleccionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
