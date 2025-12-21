"use client";
import { AdminDrawer } from "@/components/admin/AdminDrawer";
import { useAdminDrawer } from "@/components/admin/AdminDrawerContext";
import { useSidebarContent } from "@/components/admin/AdminSidebarContext";
import { AdminSidebarNav, type AdminSidebarNavItem } from "@/components/pgpt-insights/nav/AdminSidebarNav";

export function SidebarDrawerHost({ navItems }: { navItems: AdminSidebarNavItem[] }) {
  const { open, close } = useAdminDrawer();
  const sidebarContent = useSidebarContent();

  return (
    <AdminDrawer open={open} onClose={close}>
      <AdminSidebarNav items={navItems} extraContent={sidebarContent} onNavigate={close} />
    </AdminDrawer>
  );
}
