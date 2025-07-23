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
    icon: (
      <LayoutDashboard className="h-4 w-4 mr-3 flex-shrink-0 text-air-superiority-blue-500" />
    ),
  },
  {
    title: "Properties",
    url: "/dashboard/properties",
    icon: (
      <Building className="h-4 w-4 mr-3 flex-shrink-0 text-air-superiority-blue-500" />
    ),
  },
  {
    title: "Tenants",
    url: "/dashboard/tenants",
    icon: (
      <Users className="h-4 w-4 mr-3 flex-shrink-0 text-air-superiority-blue-500" />
    ),
  },
  {
    title: "Billing",
    url: "/dashboard/billing",
    icon: (
      <Receipt className="h-4 w-4 mr-3 flex-shrink-0 text-air-superiority-blue-500" />
    ),
  },
  {
    title: "Transactions",
    url: "/dashboard/transactions",
    icon: (
      <CreditCard className="h-4 w-4 mr-3 flex-shrink-0 text-air-superiority-blue-500" />
    ),
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: (
      <FileText className="h-4 w-4 mr-3 flex-shrink-0 text-air-superiority-blue-500" />
    ),
  },
  {
    title: "WhatsApp",
    url: "/dashboard/whatsapp",
    icon: (
      <MessageSquare className="h-4 w-4 mr-3 flex-shrink-0 text-air-superiority-blue-500" />
    ),
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: (
      <Settings className="h-4 w-4 mr-3 flex-shrink-0 text-air-superiority-blue-500" />
    ),
  },
];

function getNavClassName(path: string, currentPath: string) {
  const baseClasses =
    "w-full justify-start text-left transition-colors px-2 py-2 rounded-md";
  if (path === currentPath) {
    return `${baseClasses} bg-air-superiority-blue-100 text-prussian-blue-500 font-medium border-r-2 border-prussian-blue-500`;
  }
  return `${baseClasses} text-papaya-whip-700 hover:bg-air-superiority-blue-100 hover:text-papaya-whip-900`;
}

function SidebarContent() {
  const { open } = useSidebar();
  const currentPath = usePathname();

  return (
    <SidebarBody className="flex flex-col min-h-screen p-0 bg-prussian-blue-500">
      {/* Header */}
      <div className="p-4 border-b border-air-superiority-blue-200 flex items-center gap-2">
        <Building className="h-8 w-8 text-air-superiority-blue-500" />
        {open && (
          <div>
            <h1 className="font-bold text-lg text-papaya-whip-900">
              TenantPro
            </h1>
            <p className="text-xs text-air-superiority-blue-500">
              Property Management
            </p>
          </div>
        )}
      </div>
      {/* Menu */}
      <nav className="flex-1 flex flex-col gap-1 p-2">
        <div className="text-air-superiority-blue-900 text-xs font-medium mb-2 mt-2">
          {open ? "MAIN MENU" : ""}
        </div>
        {menuItems.map((item) => (
          <SidebarLink
            key={item.title}
            link={{ label: item.title, href: item.url, icon: item.icon }}
            className={getNavClassName(item.url, currentPath)}
          />
        ))}
      </nav>
      {/* Footer */}
      <div className="p-4 border-t border-air-superiority-blue-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-papaya-whip-900 hover:bg-fire-brick-500 hover:text-white"
          onClick={() => {
            // Handle logout logic here
            console.log("Logout clicked");
          }}
        >
          <LogOut className="h-4 w-4 mr-3 text-air-superiority-blue-500" />
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
