import { AdminShell } from "@/components/layout/admin-shell";
import { requireStaffToken } from "@/lib/staff-auth";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  requireStaffToken();
  return <AdminShell>{children}</AdminShell>;
}

