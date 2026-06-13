import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const metadata = {
  title: "Dashboard | CalmBand"
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
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

  // Mapeamos 'nombre' a 'display_name' para compatibilidad con componentes existentes
  const mappedProfile = profile ? {
    ...profile,
    display_name: profile.nombre || userData.user.email.split("@")[0],
  } : null;

  return <DashboardClient user={userData.user} profile={mappedProfile} />;
}
