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
    .from("profiles")
    .select("id, email, display_name, updated_at")
    .eq("id", userData.user.id)
    .maybeSingle();

  return <DashboardClient user={userData.user} profile={profile} />;
}
