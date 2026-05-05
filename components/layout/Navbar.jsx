"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { SIMULATION_ONLY } from "@/lib/simulationMode";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, supabase } = useAuth();
  const showAuthActions = !SIMULATION_ONLY;

  const handleSignOut = async () => {
    if (SIMULATION_ONLY) return;
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/kids", label: "Vista infantil" },
    { href: "/history", label: "Historial" },
    { href: "/pairing", label: "Pulsera" },
  ];

  return (
    <header style={{
      borderBottom: "1px solid var(--border)",
      background: "rgba(10,10,26,0.8)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px"
      }}>
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 8,
          fontWeight: 700, fontSize: 16, color: "var(--ink)",
          textDecoration: "none"
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: "linear-gradient(135deg, #B8A4FF, #A8E6CF)"
          }}/>
          CalmBand
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} style={{
              padding: "6px 12px", borderRadius: 8,
              color: pathname === link.href ? "#D4C5FF" : "var(--ink-muted)",
              background: pathname === link.href ? "rgba(184,164,255,0.12)" : "transparent",
              textDecoration: "none", transition: "all 0.2s", fontWeight: pathname === link.href ? 600 : 400
            }}>
              {link.label}
            </Link>
          ))}

          {showAuthActions && (loading ? null : user ? (
            <Button size="sm" variant="ghost" onClick={handleSignOut}>
              Salir
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </>
          ))}
        </nav>
      </div>
    </header>
  );
}
