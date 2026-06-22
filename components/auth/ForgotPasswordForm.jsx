"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function ForgotPasswordForm() {
  const { supabase } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${origin}/auth/callback?next=/reset-password`
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setInfo(
      "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada."
    );
    setLoading(false);
  };

  return (
    <Card className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-ink-faint">
          CalmBand
        </p>
        <h1 className="text-2xl font-semibold text-ink">
          Recuperar contraseña
        </h1>
        <p className="text-sm text-ink-muted">
          Ingresa tu correo y te enviaremos un enlace para crear una nueva
          contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            required
          />
        </div>

        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {info && (
          <p className="rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand">
            {info}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Enviando..." : "Enviar enlace de recuperación"}
        </Button>
      </form>

      <div className="text-sm text-ink-faint">
        ¿Recordaste tu contraseña?{" "}
        <Link href="/sign-in" className="font-medium text-brand hover:underline">
          Inicia sesión
        </Link>
      </div>
    </Card>
  );
}
