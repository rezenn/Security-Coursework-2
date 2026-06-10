import Header from "@/app/_components/Header";
import SideNavigation from "./_component/SideNavigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="h-screen w-screen bg-white text-gray-800 flex">
      {/* Sidebar */}
      <SideNavigation />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        {/* Divider line */}
        <div className="h-px mb-4 mx-3 bg-gray-400"></div>

        {/* Main content */}
        <main className="flex-1 px-2 sm:px-4 md:px-6 overflow-y-auto custom-scroll">
          {children}
        </main>
      </div>
    </section>
  );
}
