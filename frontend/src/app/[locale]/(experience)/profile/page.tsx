"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLink } from "@/components/ui/app-link";
import {
  ChevronRight,
  ClipboardList,
  Leaf,
  Plus,
  Settings,
  Star,
  User,
} from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import {
  clearDemoSession,
  getDemoSession,
  setDemoSession,
} from "@/lib/demo-session";
import { interpolateTemplate } from "@/lib/guest-content";
import { useGuestContent } from "@/lib/hooks/use-guest-content";
import { useGuestOverview } from "@/lib/hooks/use-guest-overview";
import { withLocale } from "@/lib/i18n/paths";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";

type GuestProfilePayload = {
  guest: {
    id: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    emailVerified: boolean;
    idDocumentVerified: boolean;
    hasPaymentMethod: boolean;
    updatedAt: string | null;
  };
  stay: {
    roomNumber: string | null;
    confirmationNumber: string | null;
  };
  hotel: {
    currency: string;
  };
};

type Invoice = {
  id: string;
  title: string;
  department: string | null;
  amountCents: number;
  currency: string;
  pointsEarned: number;
  issuedAt: string;
  downloadUrl: string | null;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

function initials(
  firstName: string | null | undefined,
  lastName: string | null | undefined
) {
  const first = (firstName ?? "").trim().slice(0, 1).toUpperCase();
  const last = (lastName ?? "").trim().slice(0, 1).toUpperCase();
  return `${first}${last}`.trim() || "?";
}

export default function ProfilePage() {
  const locale = useLocale();
  const router = useRouter();

  const {
    isLoading: overviewLoading,
    overview,
    authenticated,
    token: overviewToken,
  } = useGuestOverview();

  const [session, setSession] = useState<ReturnType<typeof getDemoSession>>(
    null
  );
  const hotelId = overview?.hotel?.id ?? session?.hotelId ?? null;
  const { content } = useGuestContent(locale, hotelId);
  const page = content?.pages.profile;

  const [profile, setProfile] = useState<GuestProfilePayload | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    setSession(getDemoSession());
  }, []);

  const totalPoints = useMemo(
    () =>
      invoices.reduce(
        (sum, invoice) => sum + (Number(invoice.pointsEarned) || 0),
        0
      ),
    [invoices]
  );

  const authToken = overviewToken ?? session?.guestToken ?? "";

  useEffect(() => {
    if (!authToken || !page) return;

    const headers = {
      Authorization: `Bearer ${authToken}`,
    };

    Promise.all([
      fetch(new URL("/api/v1/guest/profile", apiBaseUrl).toString(), {
        method: "GET",
        headers,
      }),
      fetch(new URL("/api/v1/invoices", apiBaseUrl).toString(), {
        method: "GET",
        headers,
      }),
    ]).then(async ([profileRes, invoiceRes]) => {
      if (profileRes.ok) {
        setProfile(
          (await profileRes.json()) as GuestProfilePayload
        );
      }
      if (invoiceRes.ok) {
        const data = (await invoiceRes.json()) as { items?: Invoice[] };
        setInvoices(Array.isArray(data.items) ? data.items : []);
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, page?.title]);

  function openEditor() {
    const firstName =
      profile?.guest.firstName ?? session?.guestFirstName ?? "";
    const lastName =
      profile?.guest.lastName ?? session?.guestLastName ?? "";
    const email = profile?.guest.email ?? session?.guestEmail ?? "";
    const phone = profile?.guest.phone ?? session?.guestPhone ?? "";

    setForm({ firstName, lastName, email, phone });
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditOpen(true);
  }

  async function handleSaveProfile() {
    if (!authToken || !page || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const response = await fetch(
        new URL("/api/v1/guest/profile", apiBaseUrl).toString(),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
          }),
        }
      );

      if (!response.ok) {
        setSaveError(page.account.updatedError);
        return;
      }

      const result = (await response.json()) as {
        guest?: GuestProfilePayload["guest"];
      };
      if (!result.guest) {
        setSaveError(page.account.updatedError);
        return;
      }

      setProfile((current) =>
        current
          ? { ...current, guest: { ...current.guest, ...result.guest } }
          : current
      );

      if (session) {
        const nextSession = {
          ...session,
          guestFirstName: result.guest.firstName ?? null,
          guestLastName: result.guest.lastName ?? null,
          guestEmail: result.guest.email ?? null,
          guestPhone: result.guest.phone ?? null,
        };
        setDemoSession(nextSession);
        setSession(nextSession);
      }

      setSaveSuccess(page.account.updatedSuccess);
      setIsEditOpen(false);
    } catch {
      setSaveError(page.account.updatedError);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    clearDemoSession();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = withLocale(locale, "/");
  }

  if (overviewLoading || !page) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-white px-5 py-8">
        <div className="rounded-[6px] border border-black/[0.06] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <h1 className="text-[24px] font-light leading-tight text-black/75">
            {page.title}
          </h1>
          <p className="mt-2 text-[15px] text-black/50">{page.connectStay}</p>
          <AppLink
            href={withLocale(locale, "/reception/check-in")}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-sm font-medium text-white"
          >
            {page.startCheckIn}
          </AppLink>
        </div>
      </div>
    );
  }

  const firstName =
    profile?.guest.firstName ?? session?.guestFirstName ?? overview?.guest?.firstName ?? "";
  const lastName =
    profile?.guest.lastName ?? session?.guestLastName ?? overview?.guest?.lastName ?? "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || session?.hotelName || overview?.hotel?.name || "";

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Topbar */}
      <div className="pointer-events-none sticky top-0 z-20">
        <div
          className="pointer-events-auto flex items-center justify-between px-4 py-2.5"
          style={{
            backgroundImage:
              "linear-gradient(rgb(255,255,255) 0%, rgba(255,255,255,0.75) 25%, rgba(255,255,255,0.3) 55%, rgba(255,255,255,0.1) 80%, rgba(255,255,255,0) 100%)",
            backgroundSize: "100% 90px",
            backgroundRepeat: "no-repeat",
          }}
        >
          <span className="text-[20px] tracking-[-0.2px] text-black">
            {page.title}
          </span>
          <Leaf className="h-8 w-8 text-black/70" />
        </div>
      </div>

      <div className="space-y-3 px-4 pt-4">
        {/* Profile Card */}
        <button
          type="button"
          onClick={openEditor}
          className="w-full rounded-[6px] border border-black/[0.06] bg-white px-4 py-8 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
        >
          <div className="flex flex-col items-center gap-4">
            <p className="text-[24px] font-light leading-[1.1] text-black/75">
              {displayName}
            </p>

            {/* Avatar */}
            <div className="relative h-16 w-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-t from-[#ddd] to-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                <User className="h-10 w-10 text-black/30" />
              </div>
              <div className="absolute -bottom-[3px] -right-[3px] flex h-6 w-6 items-center justify-center rounded-full border border-white bg-black">
                <Plus className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Hint */}
            <div className="rounded-lg bg-[#f5f5f5] p-2 text-center text-[14px] leading-[1.25] text-black/50">
              {page.avatarHint}
            </div>
          </div>
        </button>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 gap-2">
          <AppLink
            href={withLocale(locale, "/profile/history")}
            className="flex flex-col gap-3 rounded-[6px] border border-black/[0.06] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
          >
            <ClipboardList className="h-8 w-8 text-black/70" />
            <span className="text-[15px] leading-[1.1] text-black">
              {page.hub.historyCard}
            </span>
          </AppLink>

          <AppLink
            href={withLocale(locale, "/profile/preferences")}
            className="flex flex-col gap-3 rounded-[6px] border border-black/[0.06] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
          >
            <Settings className="h-8 w-8 text-black/70" />
            <span className="text-[15px] leading-[1.1] text-black">
              {page.hub.preferencesCard}
            </span>
          </AppLink>
        </div>

        {/* Loyalty Card */}
        <AppLink
          href={withLocale(locale, "/profile/loyalty")}
          className="relative block overflow-hidden rounded-[6px] border border-black/[0.06] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
        >
          <div className="flex flex-col gap-2">
            <span className="text-[15px] leading-[1.1] text-[#cd9113]">
              {interpolateTemplate(page.hub.loyaltyPointsTemplate, {
                points: totalPoints,
              })}
            </span>
            <span className="text-[15px] leading-[1.1] text-black">
              {page.hub.loyaltyDiscover}
            </span>
          </div>
          <div className="absolute -bottom-px -left-px -right-px h-1 rounded-2xl bg-[#f5f5f5]">
            <div
              className="h-full rounded-2xl bg-gradient-to-r from-[rgba(205,145,19,0.3)] to-[#cd9113]"
              style={{
                width: `${Math.min(Math.max((totalPoints / 100) * 100, 2), 100)}%`,
              }}
            />
          </div>
        </AppLink>

        {/* Separator */}
        <div className="px-8 py-4">
          <div className="h-[2px] rounded-[9px] bg-[rgba(204,204,204,0.25)]" />
        </div>

        {/* Review Section */}
        <AppLink
          href={withLocale(locale, "/profile/rating")}
          className="block rounded-[6px] px-4 py-4 transition-colors active:bg-black/[0.03]"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="text-center text-[15px] leading-[1.25]">
              <p className="text-black">{page.hub.reviewPrompt}</p>
              <p className="text-black/50">{page.hub.reviewCta}</p>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="h-9 w-9 text-[#cd9113]/30"
                  strokeWidth={1}
                />
              ))}
            </div>
          </div>
        </AppLink>

        {/* Footer Links */}
        <div className="py-3.5">
          <div className="flex items-center justify-between px-4 py-[18px]">
            <span className="text-[15px] font-medium text-black">
              {page.hub.privacyPolicy}
            </span>
            <ChevronRight className="h-4 w-4 text-black/40" />
          </div>
          <div className="flex items-center justify-between px-4 py-[18px]">
            <span className="text-[15px] font-medium text-black">
              {page.hub.aboutApp}
            </span>
            <ChevronRight className="h-4 w-4 text-black/40" />
          </div>
        </div>

        {/* Sign Out */}
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full rounded-full border border-black/10 py-3 text-sm font-medium text-black"
          >
            {page.security.signOut}
          </button>
        </div>
      </div>

      {/* Edit Profile Sheet */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent
          side="bottom"
          className="h-auto max-h-[92vh] rounded-t-[20px] border-0 bg-white px-0 pb-6 pt-3"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/20" />
          <SheetHeader className="px-5 text-left">
            <SheetTitle className="text-[22px] leading-none text-black">
              {page.account.editAction}
            </SheetTitle>
            <SheetDescription className="text-[14px] text-black/55">
              {page.account.description}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3 px-5">
            <LabeledInput
              label={page.account.fields.firstName}
              value={form.firstName}
              onChange={(v) =>
                setForm((c) => ({ ...c, firstName: v }))
              }
              icon={
                <UserRound className="h-4 w-4 text-black/45" />
              }
            />
            <LabeledInput
              label={page.account.fields.lastName}
              value={form.lastName}
              onChange={(v) =>
                setForm((c) => ({ ...c, lastName: v }))
              }
              icon={
                <UserRound className="h-4 w-4 text-black/45" />
              }
            />
            <LabeledInput
              label={page.account.fields.email}
              value={form.email}
              onChange={(v) =>
                setForm((c) => ({ ...c, email: v }))
              }
            />
            <LabeledInput
              label={page.account.fields.phone}
              value={form.phone}
              onChange={(v) =>
                setForm((c) => ({ ...c, phone: v }))
              }
            />

            {saveError ? (
              <p className="text-sm text-[#b70926]">{saveError}</p>
            ) : null}
            {saveSuccess ? (
              <p className="text-sm text-[#0f7f45]">{saveSuccess}</p>
            ) : null}
          </div>

          <SheetFooter className="mt-5 px-5">
            <div className="grid w-full grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full"
                onClick={() => setIsEditOpen(false)}
                disabled={isSaving}
              >
                {page.account.cancelAction}
              </Button>
              <Button
                type="button"
                className="h-11 rounded-full"
                onClick={() => void handleSaveProfile()}
                disabled={isSaving}
              >
                {isSaving
                  ? page.account.savingAction
                  : page.account.saveAction}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-black/70">{label}</span>
      <div className="flex h-11 items-center gap-2 rounded-[8px] border border-black/10 bg-white px-3">
        {icon ?? null}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm text-black outline-none placeholder:text-black/35"
        />
      </div>
    </label>
  );
}
