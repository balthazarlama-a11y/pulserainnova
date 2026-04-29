import Navbar from "@/components/layout/Navbar";

export default function AuthLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        {children}
      </main>
    </>
  );
}
