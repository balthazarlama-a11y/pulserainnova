import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import ClientProviders from "@/components/providers/ClientProviders";

export const metadata = {
  title: "CalmBand",
  description: "Wellness-focused wearable for kids, simulation mode."
};

// Setea data-theme antes de hidratar para evitar flash de tema incorrecto.
// Por qué solo localStorage (sin prefers-color-scheme): la landing, hero y
// dashboard tienen fondos oscuros hardcodeados (#0A0A1A, #1a0f35). Si el OS
// del usuario está en light y caemos a tema light, --ink pasa a ser oscuro
// y el texto queda invisible sobre esos fondos. Light es opt-in desde Ajustes.
const themeBootstrap = `
(function(){try{
  var s=localStorage.getItem('calmband-theme');
  document.documentElement.setAttribute('data-theme', s==='light' ? 'light' : 'dark');
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
