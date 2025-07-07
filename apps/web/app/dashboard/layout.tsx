import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-papaya_whip-500">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm">
            <SidebarTrigger className="text-prussian_blue-500" />
            <div className="ml-4">
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
