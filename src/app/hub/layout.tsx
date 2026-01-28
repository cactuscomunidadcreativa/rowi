export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      {children}
    </section>
  );
}
