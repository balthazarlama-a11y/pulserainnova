import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import ClientProviders from "@/components/providers/ClientProviders";

export const metadata = {
  title: "CalmBand",
  description: "Wellness-focused wearable for kids, simulation mode."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--bg-2)] text-[var(--ink)]">
        <AuthProvider>
          <ClientProviders>{children}</ClientProviders>
        </AuthProvider>
      </body>
    </html>
  );
}
