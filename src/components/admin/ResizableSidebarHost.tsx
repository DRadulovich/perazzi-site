"use client";
import { ReactNode } from "react";
import { useSidebarContent } from "@/components/admin/AdminSidebarContext";
import { ResizableAdminLayout } from "@/components/admin/ResizableAdminLayout";
import { AdminSidebarNav, type AdminSidebarNavItem } from "@/components/pgpt-insights/nav/AdminSidebarNav";

export function ResizableSidebarHost({ navItems, children }: Readonly<{
  navItems: AdminSidebarNavItem[];
  children: ReactNode;
}>) {
  const sidebarContent = useSidebarContent();
  return (
    <ResizableAdminLayout
      nav={<AdminSidebarNav items={navItems} extraContent={sidebarContent} />}
    >
      {children}
    </ResizableAdminLayout>
  );
}
