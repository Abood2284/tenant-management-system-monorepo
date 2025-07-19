import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-papaya-whip-500">
        <AppSidebar />
        <main className="flex-1 flex flex-col h-full">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-auto h-full">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
