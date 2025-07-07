"use client";

import {
  Building,
  Users,
  Receipt,
  CreditCard,
  FileText,
  Settings,
  MessageSquare,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4 mr-3 flex-shrink-0" />,
  },
  {
    title: "Properties",
    url: "/dashboard/properties",
    icon: <Building className="h-4 w-4 mr-3 flex-shrink-0" />,
  },
  {
    title: "Tenants",
    url: "/dashboard/tenants",
    icon: <Users className="h-4 w-4 mr-3 flex-shrink-0" />,
  },
  {
    title: "Billing",
    url: "/dashboard/billing",
    icon: <Receipt className="h-4 w-4 mr-3 flex-shrink-0" />,
  },
  {
    title: "Transactions",
    url: "/dashboard/transactions",
    icon: <CreditCard className="h-4 w-4 mr-3 flex-shrink-0" />,
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: <FileText className="h-4 w-4 mr-3 flex-shrink-0" />,
  },
  {
    title: "WhatsApp",
    url: "/dashboard/whatsapp",
    icon: <MessageSquare className="h-4 w-4 mr-3 flex-shrink-0" />,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: <Settings className="h-4 w-4 mr-3 flex-shrink-0" />,
  },
];

function getNavClassName(path: string, currentPath: string, expanded: boolean) {
  const baseClasses =
    "w-full justify-start text-left transition-colors px-2 py-2 rounded-md";
  if (path === currentPath) {
    return `${baseClasses} bg-air_superiority_blue-100 text-prussian_blue-500 font-medium border-r-2 border-prussian_blue-500`;
  }
  return `${baseClasses} text-papaya_whip-700 hover:bg-air_superiority_blue-100 hover:text-papaya_whip-900`;
}

function SidebarContent() {
  const { open } = useSidebar();
  const currentPath = usePathname();

  return (
    <SidebarBody className="flex flex-col h-full p-0 bg-prussian_blue-500">
      {/* Header */}
      <div className="p-4 border-b border-air_superiority_blue-200 flex items-center gap-2">
        <Building className="h-8 w-8 text-air_superiority_blue-500" />
        {open && (
          <div>
            <h1 className="font-bold text-lg text-papaya_whip-900">
              TenantPro
            </h1>
            <p className="text-xs text-air_superiority_blue-500">
              Property Management
            </p>
          </div>
        )}
      </div>
      {/* Menu */}
      <nav className="flex-1 flex flex-col gap-1 p-2">
        <div className="text-air_superiority_blue-500 text-xs font-medium mb-2 mt-2">
          {open ? "MAIN MENU" : ""}
        </div>
        {menuItems.map((item) => (
          <SidebarLink
            key={item.title}
            link={{ label: item.title, href: item.url, icon: item.icon }}
            className={getNavClassName(item.url, currentPath, open)}
          />
        ))}
      </nav>
      {/* Footer */}
      <div className="p-4 border-t border-air_superiority_blue-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-papaya_whip-900 hover:bg-fire_brick-500 hover:text-white"
          onClick={() => {
            // Handle logout logic here
            console.log("Logout clicked");
          }}
        >
          <LogOut className="h-4 w-4 mr-3" />
          {open && <span>Logout</span>}
        </Button>
      </div>
    </SidebarBody>
  );
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent />
    </Sidebar>
  );
}
