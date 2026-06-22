"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconWatch, IconCheck, IconAlertTriangle, IconRefresh, IconUser, IconWifi } from "@/components/marketing/icons";
import { usePeople } from "@/lib/peopleContext";

const inputCls = "w-full bg-surface-elevated border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-colors";
const labelCls = "text-sm font-medium text-ink-muted block mb-2";

// Nombre visible de la pulsera, idéntico a su red WiFi "CalmBand-XXXX": los 4
// últimos del MAC. Así el usuario reconoce la suya (la red a la que se conectó).
const apLabel = (mac) => "CalmBand-" + (mac || "").replace(/:/g, "").slice(-4).toUpperCase();

const ScanRadar = ({ children }) => (
  <div className="relative w-[160px] h-[160px] mx-auto flex items-center justify-center">
    {[0, 0.5, 1, 1.5].map((d) => (
      <div key={d} className="absolute inset-0 rounded-full border-2 border-brand/40"
        style={{ animation: `pulse-ring 2.8s ${d}s ease-out infinite` }}/>
    ))}
    <div className="relative w-[80px] h-[80px] rounded-full flex items-center justify-center text-brand bg-brand/10 border border-brand/20 shadow-sm">
      {children}
    </div>
  </div>
);

export default function PairingClient() {
  const router = useRouter();
  const { people, selectPerson, refreshPeople } = usePeople();

  const [step, setStep] = useState("form"); // form | connecting | success | error
  const [errorMsg, setErrorMsg] = useState(null);

  // Persona: existente o nueva
  const [mode, setMode] = useState(people.length ? "existing" : "new"); // existing | new
  const [selectedChildId, setSelectedChildId] = useState(people[0]?.id || "");
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");

  // Dispositivo
  const [devName, setDevName] = useState("CalmBand");
  const [devModel, setDevModel] = useState("");
  const [devMac, setDevMac] = useState("");

  // Detección de pulseras pendientes (auto-registradas por su MAC)
  const [scanning, setScanning] = useState(false);
  const [pending, setPending] = useState([]);
  const [scanned, setScanned] = useState(false);

  // `silent`: refresco en segundo plano (sin spinner). Auto-selecciona la
  // pulsera si hay una sola detectada y el usuario no eligió otra.
  const scanForBands = useCallback(async (silent = false) => {
    if (!silent) { setScanning(true); setScanned(false); }
    try {
      const res = await fetch("/api/pairing/pending");
      const data = await res.json();
      const devices = res.ok ? (data.devices || []) : [];
      setPending(devices);
      if (devices.length === 1) setDevMac((cur) => cur || devices[0].mac_address);
    } catch {
      setPending([]);
    } finally {
      if (!silent) setScanning(false);
      setScanned(true);
    }
  }, []);

  // Detecta sola al abrir la pantalla y refresca cada 4 s mientras se completa
  // el formulario, así la pulsera aparece sin tocar nada.
  useEffect(() => {
    if (step !== "form") return;
    scanForBands();
    const id = setInterval(() => scanForBands(true), 4000);
    return () => clearInterval(id);
  }, [step, scanForBands]);

  // WiFi: solo una etiqueta para el panel. La red se configura EN la pulsera por
  // su portal cautivo (CalmBand-XXXX); la app no provisiona credenciales.
  const [ssid, setSsid] = useState("");

  const personReady = mode === "existing" ? !!selectedChildId : newName.trim().length > 0;
  const canSubmit = personReady && devName.trim();

  const handleConnect = async () => {
    if (!canSubmit) return;
    setStep("connecting");
    setErrorMsg(null);

    const payload = {
      ninoId: mode === "existing" ? selectedChildId : null,
      newPerson: mode === "new" ? { nombre: newName.trim(), edad: newAge ? Number(newAge) : null } : null,
      device: {
        nombre: devName.trim(),
        modelo: devModel.trim() || null,
        mac: devMac.trim() || null,
        wifiSsid: ssid.trim() || null,
        // El WiFi se configura en la pulsera (portal cautivo); esto es solo etiqueta.
      },
    };

    try {
      const res = await fetch("/api/pairing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      await refreshPeople();
      if (data.ninoId) selectPerson(data.ninoId);

      setStep("success");
      setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 1800);
    } catch (err) {
      console.error("[pairing]", err);
      setErrorMsg(err.message || "No pudimos vincular la pulsera. Inténtalo de nuevo.");
      setStep("error");
    }
  };

  return (
    <div className="min-h-screen text-ink relative overflow-hidden bg-bg">
      <button onClick={() => router.push("/dashboard")}
        className="absolute top-7 left-7 z-[5] bg-surface border border-line rounded-xl px-3.5 py-2 cursor-pointer text-ink inline-flex items-center gap-1.5 text-[13px] hover:bg-surface-elevated transition shadow-sm">
        <IconArrowLeft size={14}/> Volver
      </button>

      <div className="relative z-[2] max-w-[560px] w-full mx-auto px-5 sm:px-6 pt-24 pb-20">

        {step === "success" && (
          <div className="text-center" style={{ animation: "heroTextIn 0.5s forwards" }}>
            <div className="relative w-40 h-40 mx-auto mb-8 flex items-center justify-center">
              {[0, 0.4, 0.8].map((d) => (
                <div key={d} className="absolute inset-0 rounded-full"
                  style={{ border: "2px solid rgba(94,220,154,0.4)", animation: `pulse-ring 2s ${d}s ease-out infinite` }}/>
              ))}
              <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-[#0A2A1A]"
                style={{ background: "linear-gradient(135deg, #5EDC9A, #7DD3B8)", border: "1px solid rgba(255,255,255,0.3)", boxShadow: "0 0 0 12px rgba(94,220,154,0.12), 0 0 60px rgba(94,220,154,0.4)" }}>
                <IconCheck size={40} stroke={2.5}/>
              </div>
            </div>
            <h1 className="font-display font-medium m-0 mb-3 tracking-tight text-3xl sm:text-4xl text-brand">¡Vinculada!</h1>
            <p className="text-ink-dim text-[15px]">La pulsera quedó asignada a la persona. Volviendo al panel…</p>
          </div>
        )}

        {step === "error" && (
          <div className="text-center" style={{ animation: "heroTextIn 0.4s forwards" }}>
            <div className="w-[88px] h-[88px] mx-auto mb-7 rounded-full flex items-center justify-center text-danger"
              style={{ background: "linear-gradient(135deg, rgba(236,91,107,0.2), rgba(236,91,107,0.05))", border: "1px solid rgba(236,91,107,0.4)", boxShadow: "0 0 0 8px rgba(236,91,107,0.06), 0 0 40px rgba(236,91,107,0.25)" }}>
              <IconAlertTriangle size={36}/>
            </div>
            <h1 className="font-display font-medium m-0 mb-3 tracking-tight text-3xl sm:text-4xl">No pudimos vincular</h1>
            <p className="text-ink-dim text-sm leading-relaxed max-w-[400px] mx-auto mb-7">{errorMsg}</p>
            <button onClick={() => setStep("form")}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold cursor-pointer border-0 inline-flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg, #B8A4FF, #8B7FD8)", color: "#0D0824", boxShadow: "0 8px 24px -6px rgba(184,164,255,0.5)" }}>
              <IconRefresh size={15}/> Reintentar
            </button>
          </div>
        )}

        {step === "connecting" && (
          <div className="text-center" style={{ animation: "heroTextIn 0.3s forwards" }}>
            <ScanRadar><IconWatch size={32}/></ScanRadar>
            <h2 className="font-display font-medium m-0 mt-8 mb-2 tracking-tight text-2xl sm:text-3xl">
              Vinculando <span className="text-brand font-semibold">{devName}</span>…
            </h2>
            <p className="text-ink-dim text-sm">Guardando persona, dispositivo y red WiFi.</p>
          </div>
        )}

        {step === "form" && (
          <>
            <div className="mb-8 flex justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full blur-2xl animate-breathe-slow"
                  style={{ background: "radial-gradient(circle, rgba(184,164,255,0.4), transparent 65%)" }}/>
                <div className="relative w-[80px] h-[80px] rounded-full flex items-center justify-center text-brand bg-brand/10 border border-brand/20 shadow-sm">
                  <IconWatch size={36}/>
                </div>
              </div>
            </div>

            <div className="text-center mb-7">
              <div className="text-[11px] tracking-[0.22em] uppercase text-brand font-medium mb-2.5">Vinculación · CalmBand</div>
              <h1 className="font-display font-medium m-0 mb-2.5 tracking-tight text-3xl sm:text-4xl">
                Conecta una <span className="text-brand font-bold">pulsera</span>
              </h1>
              <p className="text-ink-dim text-sm leading-relaxed max-w-[400px] mx-auto">
                Asigna la pulsera a una persona y a la red WiFi por la que enviará sus datos.
              </p>
            </div>

            <div className="card p-6 sm:p-8 space-y-6">

              {/* ── Persona ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <IconUser size={15} className="text-brand"/> Persona
                </div>

                {people.length > 0 && (
                  <div className="flex gap-2">
                    <button onClick={() => setMode("existing")}
                      className={`flex-1 py-2 rounded-xl text-[13px] font-medium border transition-colors ${mode === "existing" ? "bg-brand/12 border-brand/35 text-brand" : "bg-surface border-line text-ink-dim"}`}>
                      Existente
                    </button>
                    <button onClick={() => setMode("new")}
                      className={`flex-1 py-2 rounded-xl text-[13px] font-medium border transition-colors ${mode === "new" ? "bg-brand/12 border-brand/35 text-brand" : "bg-surface border-line text-ink-dim"}`}>
                      Nueva persona
                    </button>
                  </div>
                )}

                {mode === "existing" && people.length > 0 ? (
                  <select className={inputCls} value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}>
                    <option value="" disabled>-- Elige una persona --</option>
                    {people.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                ) : (
                  <div className="grid grid-cols-[1fr_90px] gap-3">
                    <div>
                      <label className={labelCls}>Nombre</label>
                      <input className={inputCls} placeholder="Ej. Lucía" value={newName} onChange={(e) => setNewName(e.target.value)}/>
                    </div>
                    <div>
                      <label className={labelCls}>Edad</label>
                      <input className={inputCls} type="number" min={1} max={120} placeholder="10" value={newAge} onChange={(e) => setNewAge(e.target.value)}/>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-px bg-line"/>

              {/* ── Dispositivo ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <IconWatch size={15} className="text-brand"/> Dispositivo
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nombre</label>
                    <input className={inputCls} placeholder="CalmBand" value={devName} onChange={(e) => setDevName(e.target.value)}/>
                  </div>
                  <div>
                    <label className={labelCls}>Modelo (opcional)</label>
                    <input className={inputCls} placeholder="Pro / Mini" value={devModel} onChange={(e) => setDevModel(e.target.value)}/>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls + " mb-0"}>Dirección MAC</label>
                    <button type="button" onClick={() => scanForBands()} disabled={scanning}
                      className="text-[12px] font-medium text-brand inline-flex items-center gap-1.5 hover:opacity-80 disabled:opacity-50 transition">
                      <IconRefresh size={13} className={scanning ? "animate-spin" : ""}/>
                      {scanning ? "Buscando…" : "Detectar pulseras"}
                    </button>
                  </div>

                  {scanned && pending.length > 0 && (
                    <div className="mb-2.5 space-y-1.5">
                      {pending.map((d) => (
                        <button key={d.mac_address} type="button"
                          onClick={() => setDevMac(d.mac_address)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                            devMac === d.mac_address ? "bg-brand/12 border-brand/35" : "bg-surface border-line hover:bg-surface-elevated"
                          }`}>
                          <span className="relative shrink-0">
                            <IconWatch size={16} className="text-brand"/>
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-calm" title="Encendida ahora"/>
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold truncate">{apLabel(d.mac_address)}</div>
                            <div className="text-[11px] font-mono text-ink-faint truncate">{d.mac_address}</div>
                            <div className="text-[11px] text-ink-faint">
                              {d.asignada
                                ? "En uso por otra cuenta · al conectar se moverá a la tuya"
                                : "Pulsera detectada · lista para vincular"}
                            </div>
                          </div>
                          {devMac === d.mac_address && <IconCheck size={15} className="text-brand shrink-0"/>}
                        </button>
                      ))}
                    </div>
                  )}
                  {scanned && pending.length === 0 && (
                    <p className="text-[11px] text-ink-faint mb-2 -mt-0.5">
                      No se detectaron pulseras encendidas. Asegúrate de que esté conectada a WiFi y reintenta.
                    </p>
                  )}

                  <input className={inputCls} placeholder="F4:8E:38:CB:A3:F2" value={devMac} onChange={(e) => setDevMac(e.target.value)}/>
                </div>
              </div>

              <div className="h-px bg-line"/>

              {/* ── Red WiFi (informativo) ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <IconWifi size={15} className="text-brand"/> Red WiFi
                </div>
                <div className="rounded-xl border border-line bg-surface px-3.5 py-3 text-[12px] text-ink-dim leading-relaxed">
                  El WiFi se configura <strong className="text-ink">en la pulsera</strong>: encendela, conectate desde tu celular a su red{" "}
                  <span className="font-mono text-brand">CalmBand-XXXX</span> y elegí tu red ahí. Cuando se conecta, aparece arriba en <strong className="text-ink">“Detectar pulseras”</strong>.
                </div>
                <div>
                  <label className={labelCls}>Nombre de la red (opcional · solo etiqueta)</label>
                  <input className={inputCls} placeholder="Ej. WiFi del colegio" value={ssid} onChange={(e) => setSsid(e.target.value)}/>
                </div>
              </div>

              <button onClick={handleConnect} disabled={!canSubmit}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold cursor-pointer border-0 inline-flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #B8A4FF, #8B7FD8)", color: "#0D0824", boxShadow: "0 4px 14px -4px rgba(184,164,255,0.5)" }}>
                Vincular pulsera
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
