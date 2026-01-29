import NavBar from "@/components/shared/NavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 transition-colors">
      <NavBar />
      <main className="flex-1 pt-16">{children}</main>
    </div>
  );
}
