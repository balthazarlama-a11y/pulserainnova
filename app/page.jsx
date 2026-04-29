import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="grid gap-10 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-10 shadow-2xl">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">CalmBand</p>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Calm routines for kids, clarity for parents.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            A production-ready demo that ships with Supabase authentication, protected routes,
            and profile data stored securely.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/sign-up">Create account</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Supabase Auth",
            copy: "Email and password sign up/sign in flows with session persistence."
          },
          {
            title: "Profiles Table",
            copy: "Write and read the authenticated user's profile data with RLS policies."
          },
          {
            title: "Protected Routes",
            copy: "Dashboard access is enforced at the middleware and server level."
          }
        ].map((item) => (
          <Card key={item.title} className="space-y-3">
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="text-sm text-slate-300">{item.copy}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
