import { HotelDirectoryEditor } from "@/components/hotel-directory/hotel-directory-editor";
import { getStaffPrincipal } from "@/lib/staff-token";

export default function HotelDirectoryPage() {
  const principal = getStaffPrincipal();
  const role = principal?.role ?? "staff";
  const canManage = role === "admin" || role === "manager";

  return <HotelDirectoryEditor canManage={canManage} />;
}

