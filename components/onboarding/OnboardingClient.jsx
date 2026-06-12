"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function OnboardingClient() {
  const [step, setStep] = useState(1);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { supabase, user } = useAuth();

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!childName) return;
      setLoading(true);
      
      const birthYear = new Date().getFullYear() - parseInt(childAge || "8");
      const fakeBirthDate = `${birthYear}-01-01`;

      const { error } = await supabase.from("niños").insert([{
        nombre: childName,
        tutor_id: user.id,
        fecha_nacimiento: fakeBirthDate
      }]);
      
      setLoading(false);
      if (!error) {
        setStep(3);
      } else {
        console.error("Error creating child:", error);
      }
    } else if (step === 3) {
      window.location.assign("/dashboard");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-bg">
      <Card className="w-full max-w-md p-8">
        {step === 1 && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-brand/20 text-brand rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">👋</div>
            <h1 className="text-2xl font-display font-semibold">¡Bienvenido a CalmBand!</h1>
            <p className="text-ink-muted">Como tutor o padre, podrás monitorear el bienestar emocional de tu niño y ayudarle con herramientas guiadas.</p>
            <Button onClick={handleNext} className="w-full mt-4">Soy tutor/padre — Comenzar</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-display font-semibold mb-2">Datos del niño</h2>
              <p className="text-sm text-ink-muted">Agrega el perfil del niño que usará la pulsera.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="childName">Nombre del niño</Label>
                <Input
                  id="childName"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Ej. Simón"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="childAge">Edad (aproximada)</Label>
                <Input
                  id="childAge"
                  type="number"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  placeholder="Ej. 10"
                />
              </div>
            </div>
            <Button onClick={handleNext} disabled={!childName || loading} className="w-full">
              {loading ? "Guardando..." : "Siguiente"}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-calm/20 text-calm rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⌚</div>
            <h2 className="text-xl font-display font-semibold">Vincular Pulsera</h2>
            <p className="text-sm text-ink-muted">Enciende la pulsera CalmBand y colócala cerca. Se emparejará automáticamente a la red.</p>
            <div className="py-8">
              <div className="w-12 h-12 border-4 border-calm/30 border-t-calm rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-ink-faint mt-4 uppercase tracking-widest font-semibold">Buscando dispositivo...</p>
            </div>
            <Button onClick={handleNext} className="w-full border-line text-ink-dim hover:text-ink" variant="outline">
              Simular vinculación exitosa
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
