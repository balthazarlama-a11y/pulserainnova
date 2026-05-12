import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import ClientProviders from "@/components/providers/ClientProviders";

export const metadata = {
  title: "CalmBand",
  description: "Wellness-focused wearable for kids, simulation mode."
};

// Setea data-theme antes de hidratar para evitar flash de tema incorrecto.
// Lee localStorage; si no hay, cae a prefers-color-scheme.
const themeBootstrap = `
(function(){try{
  var s=localStorage.getItem('calmband-theme');
  var t=s||(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
  document.documentElement.setAttribute('data-theme',t);
}catch(e){}})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-ink">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }}/>
        <AuthProvider>
          <ClientProviders>{children}</ClientProviders>
        </AuthProvider>
      </body>
    </html>
  );
}
