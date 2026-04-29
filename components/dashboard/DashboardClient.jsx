"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardClient({ user, profile }) {
  const router = useRouter();
  const { supabase } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      display_name: displayName || null,
      updated_at: new Date().toISOString()
    });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Profile saved.");
    router.refresh();
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Dashboard
        </p>
        <h1 className="text-2xl font-semibold text-white">
          Welcome, {profile?.display_name || user.email}
        </h1>
        <p className="text-sm text-slate-300">
          This page is protected. You can only see it when you are signed in.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            Refresh data
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profileEmail">Email</Label>
            <Input id="profileEmail" value={user.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profileName">Display name</Label>
            <Input
              id="profileName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Add a display name"
            />
          </div>

          {message && (
            <p className="text-sm text-slate-300">{message}</p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Saving
              </span>
            ) : (
              "Save profile"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
