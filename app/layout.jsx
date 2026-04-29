import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata = {
  title: "CalmBand",
  description: "Wellness-focused wearable for kids, powered by Supabase auth."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <AuthProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-5xl px-6 py-10">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
