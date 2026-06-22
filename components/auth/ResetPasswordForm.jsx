"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function ResetPasswordForm() {
  const { supabase } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Tras llegar desde el enlace del correo, el callback ya estableció la
  // sesión de recuperación. Verificamos que exista antes de permitir el cambio.
  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setHasSession(Boolean(data.session));
      setCheckingSession(false);
    };

    verify();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        if (session) {
          setHasSession(true);
          setCheckingSession(false);
        }
      }
    );

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    // Pequeña pausa para que el usuario lea el mensaje antes de redirigir.
    setTimeout(() => {
      window.location.assign("/dashboard");
    }, 1500);
  };

  return (
    <Card className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-ink-faint">
          CalmBand
        </p>
        <h1 className="text-2xl font-semibold text-ink">Nueva contraseña</h1>
        <p className="text-sm text-ink-muted">
          Elige una contraseña nueva para tu cuenta.
        </p>
      </div>

      {checkingSession ? (
        <p className="text-sm text-ink-muted">Verificando enlace...</p>
      ) : !hasSession ? (
        <div className="space-y-4">
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            El enlace de recuperación no es válido o ya expiró. Solicita uno
            nuevo.
          </p>
          <Link href="/forgot-password">
            <Button type="button" className="w-full">
              Solicitar nuevo enlace
            </Button>
          </Link>
        </div>
      ) : done ? (
        <p className="rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand">
          ¡Contraseña actualizada! Redirigiéndote a tu panel...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </form>
      )}
    </Card>
  );
}
