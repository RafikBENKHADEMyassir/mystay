import Link from "next/link";
import { redirect } from "next/navigation";

import { LiveInboxRefresh } from "@/components/live-inbox-refresh";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { requireStaffToken } from "@/lib/staff-auth";

type StaffPrincipal = {
  typ: "staff";
  hotelId: string;
  staffUserId: string;
  role: string;
  departments: string[];
  email: string | null;
  displayName: string | null;
};

type StaffUser = {
  id: string;
  displayName: string | null;
  email: string;
  role: string;
  departments: string[];
};

type TicketDetail = {
  id: string;
  hotelId: string;
  stayId: string | null;
  roomNumber: string | null;
  department: string;
  status: string;
  title: string;
  assignedStaffUser: { id: string; displayName: string | null; email: string | null } | null;
  payload: unknown;
  createdAt: string;
  updatedAt: string;
};

type InternalNote = {
  id: string;
  authorName: string;
  authorStaffUserId: string | null;
  bodyText: string;
  createdAt: string;
};

type TicketDetailPageProps = {
  params: {
    ticketId: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";
const statusOptions = ["pending", "in_progress", "resolved"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
};

const DEPARTMENT_COLORS: Record<string, string> = {
  concierge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700",
  housekeeping: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700",
  maintenance: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700",
  restaurants: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 dark:border-rose-700",
  front_desk: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700",
  spa: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-pink-300 dark:border-pink-700",
};

const DEFAULT_BADGE = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600";

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

async function getTicket(token: string, ticketId: string): Promise<TicketDetail | null> {
  const response = await fetch(`${backendUrl}/api/v1/tickets/${encodeURIComponent(ticketId)}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  return (await response.json()) as TicketDetail;
}

async function getMe(token: string): Promise<StaffPrincipal | null> {
  const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { principal?: unknown };
  return payload?.principal && typeof payload.principal === "object" ? (payload.principal as StaffPrincipal) : null;
}

async function getStaffUsers(token: string): Promise<StaffUser[]> {
  const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as { principal?: { hotelId?: string } };
  const hotelId = payload?.principal && typeof payload.principal === "object" ? (payload.principal as StaffPrincipal).hotelId : null;
  if (!hotelId) return [];

  const staffResponse = await fetch(`${backendUrl}/api/v1/hotels/${encodeURIComponent(hotelId)}/staff`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!staffResponse.ok) return [];
  const staffPayload = (await staffResponse.json()) as { items?: StaffUser[] };
  return Array.isArray(staffPayload.items) ? staffPayload.items : [];
}

async function getTicketNotes(token: string, ticketId: string): Promise<InternalNote[]> {
  const response = await fetch(`${backendUrl}/api/v1/tickets/${encodeURIComponent(ticketId)}/notes`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: InternalNote[] };
  return Array.isArray(payload.items) ? payload.items : [];
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const token = requireStaffToken();
  const ticketId = params.ticketId;

  const [ticket, me] = await Promise.all([getTicket(token, ticketId), getMe(token)]);
  const isManager = me?.role === "admin" || me?.role === "manager";
  const staffUsers = isManager && ticket ? await getStaffUsers(token) : [];
  const notes = ticket ? await getTicketNotes(token, ticketId) : [];

  async function updateStatus(formData: FormData) {
    "use server";

    const status = String(formData.get("status") ?? "").trim();
    if (!statusOptions.includes(status)) {
      redirect(`/requests/${encodeURIComponent(ticketId)}?error=invalid_status`);
    }

    const token = requireStaffToken();
    const response = await fetch(`${backendUrl}/api/v1/tickets/${encodeURIComponent(ticketId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/requests/${encodeURIComponent(ticketId)}?error=${encodeURIComponent(errorCode)}`);
    }

    redirect(`/requests/${encodeURIComponent(ticketId)}?saved=1`);
  }

  async function takeOwnership() {
    "use server";

    const token = requireStaffToken();
    const response = await fetch(`${backendUrl}/api/v1/tickets/${encodeURIComponent(ticketId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assignedTo: "me" })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/requests/${encodeURIComponent(ticketId)}?error=${encodeURIComponent(errorCode)}`);
    }

    redirect(`/requests/${encodeURIComponent(ticketId)}?saved=1`);
  }

  async function unassign() {
    "use server";

    const token = requireStaffToken();
    const response = await fetch(`${backendUrl}/api/v1/tickets/${encodeURIComponent(ticketId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assignedTo: null })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/requests/${encodeURIComponent(ticketId)}?error=${encodeURIComponent(errorCode)}`);
    }

    redirect(`/requests/${encodeURIComponent(ticketId)}?saved=1`);
  }

  async function assignToStaff(formData: FormData) {
    "use server";

    const staffUserId = String(formData.get("staffUserId") ?? "").trim();
    if (!staffUserId) {
      redirect(`/requests/${encodeURIComponent(ticketId)}?error=missing_staff_user`);
    }

    const token = requireStaffToken();
    const response = await fetch(`${backendUrl}/api/v1/tickets/${encodeURIComponent(ticketId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assignedTo: staffUserId })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/requests/${encodeURIComponent(ticketId)}?error=${encodeURIComponent(errorCode)}`);
    }

    redirect(`/requests/${encodeURIComponent(ticketId)}?saved=1`);
  }

  async function addNote(formData: FormData) {
    "use server";

    const bodyText = String(formData.get("bodyText") ?? "").trim();
    if (!bodyText) redirect(`/requests/${encodeURIComponent(ticketId)}?error=missing_note`);

    const token = requireStaffToken();
    const response = await fetch(`${backendUrl}/api/v1/tickets/${encodeURIComponent(ticketId)}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bodyText }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const errorCode = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/requests/${encodeURIComponent(ticketId)}?error=${encodeURIComponent(errorCode)}`);
    }

    redirect(`/requests/${encodeURIComponent(ticketId)}?saved=1`);
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">MyStay Admin</p>
            <h1 className="text-2xl font-semibold">Ticket</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/requests">Back to requests</Link>
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ticket not available</CardTitle>
            <CardDescription>It may have been deleted or you do not have access.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isAdmin = me?.role === "admin" || me?.role === "manager";
  const isAssignedToMe = Boolean(me?.staffUserId && ticket.assignedStaffUser?.id === me.staffUserId);
  const isUnassigned = !ticket.assignedStaffUser;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <LiveInboxRefresh />
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">MyStay Admin</p>
          <h1 className="text-2xl font-semibold">{ticket.title}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{ticket.id}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant="outline" className={DEPARTMENT_COLORS[ticket.department.toLowerCase()] ?? DEFAULT_BADGE}>{ticket.department}</Badge>
          <Badge variant="outline" className={STATUS_COLORS[ticket.status] ?? DEFAULT_BADGE}>{ticket.status.replace("_", " ")}</Badge>
          {ticket.assignedStaffUser ? (
            <Badge variant="secondary">{ticket.assignedStaffUser.displayName ?? ticket.assignedStaffUser.id}</Badge>
          ) : (
            <Badge variant="outline">Unassigned</Badge>
          )}
          <Button variant="outline" asChild>
            <Link href="/requests">Back to requests</Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription>Room, stay, and last update timestamp.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Room</p>
            <p className="text-sm">{ticket.roomNumber || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Stay</p>
            <p className="text-sm font-mono">{ticket.stayId || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Created</p>
            <p className="text-sm">{new Date(ticket.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Updated</p>
            <p className="text-sm">{new Date(ticket.updatedAt).toLocaleString()}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-muted-foreground">Assignee</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-sm">
                {ticket.assignedStaffUser ? ticket.assignedStaffUser.displayName ?? ticket.assignedStaffUser.id : "Unassigned"}
              </p>
              {isUnassigned || !isAssignedToMe ? (
                <form action={takeOwnership}>
                  <Button type="submit" size="sm" variant="outline">
                    Assign to me
                  </Button>
                </form>
              ) : null}
              {ticket.assignedStaffUser && (isAssignedToMe || isAdmin) ? (
                <form action={unassign}>
                  <Button type="submit" size="sm" variant="ghost">
                    Unassign
                  </Button>
                </form>
              ) : null}
            </div>
            {isAdmin && staffUsers.length > 0 ? (
              <form action={assignToStaff} className="mt-2 flex items-end gap-2">
                <div className="w-full space-y-1 sm:max-w-xs">
                  <Label htmlFor="assign-staff">Assign to staff</Label>
                  <select
                    id="assign-staff"
                    name="staffUserId"
                    defaultValue={ticket.assignedStaffUser?.id ?? ""}
                    className={nativeSelectClassName}
                  >
                    <option value="">— Select staff —</option>
                    {staffUsers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.displayName ?? staff.email} ({staff.role})
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" size="sm">Assign</Button>
              </form>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update status</CardTitle>
          <CardDescription>Staff can move tickets through their lifecycle.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateStatus} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full space-y-2 sm:max-w-xs">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" defaultValue={ticket.status} className={nativeSelectClassName}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal notes</CardTitle>
          <CardDescription>Staff-only context and handover details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes.length ? (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li key={note.id} className="rounded-xl border bg-muted/10 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{note.authorName}</span>
                    <span className="font-mono">{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{note.bodyText}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No internal notes yet.</p>
          )}

          <form action={addNote} className="space-y-3 border-t pt-4">
            <Textarea name="bodyText" placeholder="Add an internal note…" />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Visible to staff only.</p>
              <Button type="submit">Add note</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payload</CardTitle>
          <CardDescription>Structured data provided by the guest journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-80 overflow-auto rounded-md border bg-muted/10 p-3 text-xs">
            {safeJsonStringify(ticket.payload)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

