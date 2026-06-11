"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function AuthForm({ mode }) {
  const isSignUp = mode === "sign-up";
  const router = useRouter();
  const { supabase } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendStatus, setResendStatus] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const finishRedirect = (path) => {
    setLoading(false);
    window.location.assign(path);
  };

  const shouldShowResend =
    resendStatus === "confirm" ||
    error.toLowerCase().includes("confirm") ||
    info.toLowerCase().includes("confirm");

  const handleResend = async () => {
    if (!email) {
      setError("Enter your email to resend the confirmation.");
      return;
    }
    setResendLoading(true);
    setError("");
    setInfo("");

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`
      }
    });

    if (resendError) {
      setError(resendError.message);
      setResendLoading(false);
      return;
    }

    setInfo("Confirmation email sent. Check your inbox.");
    setResendLoading(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    setResendStatus("");

    try {
      if (isSignUp) {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              rol: 'tutor'
            },
            emailRedirectTo: `${origin}/auth/callback`
          }
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        if (data?.session && data.user) {
          finishRedirect("/onboarding");
          return;
        }

        setInfo("Check your email to confirm your account.");
        setResendStatus("confirm");
        setLoading(false);
        return;
      }

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (signInError) {
        setError(signInError.message);
        if (signInError.message.toLowerCase().includes("confirm")) {
          setResendStatus("confirm");
        }
        setLoading(false);
        return;
      }

      if (!signInData?.session) {
        setError("Sign in failed. Please try again.");
        setLoading(false);
        return;
      }

      if (signInData?.user) {
        // Trigger de base de datos ya se asegura de que exista en usuarios.
      }

      finishRedirect("/dashboard");
    } catch (err) {
      console.error("Auth Exception:", err);
      setError(err?.message || "Unexpected error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
          CalmBand
        </p>
        <h1 className="text-2xl font-semibold text-white">
          {isSignUp ? "Crea tu cuenta" : "¡Hola de nuevo!"}
        </h1>
        <p className="text-sm text-slate-300">
          {isSignUp
            ? "Regístrate para acceder a tu panel de control."
            : "Inicia sesión para continuar."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre y Apellido</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Ej. María Pérez"
              autoComplete="name"
            />
          </div>
        )}
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
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={6}
            required
          />
        </div>

        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}

        {info && (
          <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
            {info}
          </p>
        )}

        {shouldShowResend && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={resendLoading}
          >
            {resendLoading ? "Enviando..." : "Reenviar correo de confirmación"}
          </Button>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? "Cargando..."
            : isSignUp
            ? "Crear cuenta"
            : "Iniciar sesión"}
        </Button>
      </form>

      <div className="text-sm text-slate-400">
        {isSignUp ? "¿Ya tienes una cuenta?" : "¿Necesitas una cuenta?"} {" "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="text-white hover:underline"
        >
          {isSignUp ? "Inicia sesión" : "Regístrate"}
        </Link>
      </div>
    </Card>
  );
}
