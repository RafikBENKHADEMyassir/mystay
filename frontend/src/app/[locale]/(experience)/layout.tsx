// frontend/src/app/[locale]/(experience)/layout.tsx
import { BottomNav } from "@/components/navigation/bottom-nav";
import { Header } from "@/components/navigation/header";
import { guestBottomNav } from "@/lib/navigation";

export default function ExperienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav items={guestBottomNav} />
    </div>
  );
}
