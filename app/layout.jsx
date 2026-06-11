import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import ClientProviders from "@/components/providers/ClientProviders";

export const metadata = {
  title: "CalmBand",
  description: "Plataforma de bienestar emocional para niños"
};

const themeBootstrap = `
(function(){try{
  var s=localStorage.getItem('calmband-theme');
  document.documentElement.setAttribute('data-theme', s==='dark' ? 'dark' : 'light');
}catch(e){}})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-ink">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }}/>
        <AuthProvider>
          <ClientProviders>{children}</ClientProviders>
        </AuthProvider>
      </body>
    </html>
  );
}
