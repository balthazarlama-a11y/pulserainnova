import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/dashboard/DashboardClient";
import {
  SIMULATION_ONLY,
  SIMULATION_PROFILE,
  SIMULATION_USER
} from "@/lib/simulationMode";

export const metadata = {
  title: "Dashboard | CalmBand"
};

export default async function DashboardPage() {
  if (SIMULATION_ONLY) {
    return <DashboardClient user={SIMULATION_USER} profile={SIMULATION_PROFILE} />;
  }

  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("usuarios")
    .select("id, email, nombre, rol, colegio_id, created_at")
    .eq("id", userData.user.id)
    .maybeSingle();

  // Check if tutor has any children
  if (profile?.rol === 'tutor') {
    const { count } = await supabase
      .from("niños")
      .select("*", { count: 'exact', head: true })
      .eq("tutor_id", userData.user.id);

    if (count === 0) {
      redirect("/onboarding");
    }
  }

  // Mapeamos 'nombre' a 'display_name' para compatibilidad con componentes existentes
  const mappedProfile = profile ? {
    ...profile,
    display_name: profile.nombre || userData.user.email.split("@")[0],
  } : null;

  return <DashboardClient user={userData.user} profile={mappedProfile} />;
}
