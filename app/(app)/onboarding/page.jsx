import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingClient from "@/components/onboarding/OnboardingClient";

export const metadata = {
  title: "Onboarding | CalmBand"
};

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (userData?.user) {
    const { count } = await supabase
      .from("niños")
      .select("*", { count: 'exact', head: true })
      .eq("tutor_id", userData.user.id);

    if (count > 0) {
      redirect("/dashboard");
    }
  }

  return <OnboardingClient />;
}
