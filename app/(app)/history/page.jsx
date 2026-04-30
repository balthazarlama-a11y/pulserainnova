import Navbar from "@/components/layout/Navbar";
import HistoryClient from "@/components/history/HistoryClient";

export const metadata = {
  title: "Historial | CalmBand"
};

export default function HistoryPage() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}>
        <HistoryClient />
      </main>
    </>
  );
}
