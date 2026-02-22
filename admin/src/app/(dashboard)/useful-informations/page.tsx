import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Info, Plus, Save, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireStaffToken } from "@/lib/staff-auth";
import { getStaffPrincipal } from "@/lib/staff-token";

type UsefulInfoItem = {
  id: string;
  categoryId: string;
  hotelId: string;
  title: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
};

type UsefulInfoCategory = {
  id: string;
  hotelId: string;
  title: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  items: UsefulInfoItem[];
};

type UsefulInfoResponse = {
  categories: UsefulInfoCategory[];
  total: number;
};

type PageProps = {
  searchParams?: {
    saved?: string;
    error?: string;
  };
};

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

async function fetchUsefulInfo(token: string): Promise<UsefulInfoResponse> {
  const response = await fetch(`${backendUrl}/api/v1/staff/useful-informations`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`backend_error_${response.status}`);
  return (await response.json()) as UsefulInfoResponse;
}

function parseNumber(raw: unknown) {
  const value = typeof raw === "string" ? raw.trim() : "";
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export default async function UsefulInformationsPage({ searchParams }: PageProps) {
  const token = requireStaffToken();
  const principal = getStaffPrincipal();
  const role = principal?.role ?? "staff";
  const canManage = role === "admin" || role === "manager";

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Useful Informations</CardTitle>
          <CardDescription>Only managers and admins can manage useful informations.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  let data: UsefulInfoResponse | null = null;
  let error: string | null = null;

  try {
    data = await fetchUsefulInfo(token);
  } catch {
    error = "Backend unreachable. Start the backend server then refresh.";
  }

  const categories = data?.categories ?? [];

  async function createCategory(formData: FormData) {
    "use server";
    const token = requireStaffToken();
    const title = String(formData.get("title") ?? "").trim();
    const icon = String(formData.get("icon") ?? "").trim();
    if (!title) { redirect("/useful-informations?error=title_required"); }

    const response = await fetch(`${backendUrl}/api/v1/staff/useful-informations/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, icon: icon || null }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const code = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/useful-informations?error=${encodeURIComponent(code)}`);
    }

    revalidatePath("/useful-informations");
    redirect("/useful-informations?saved=category_created");
  }

  async function updateCategory(formData: FormData) {
    "use server";
    const token = requireStaffToken();
    const id = String(formData.get("categoryId") ?? "").trim();
    if (!id) redirect("/useful-informations?error=missing_category");

    const title = String(formData.get("title") ?? "").trim();
    const icon = String(formData.get("icon") ?? "").trim();
    const sortOrder = parseNumber(formData.get("sortOrder"));
    const isActive = String(formData.get("isActive") ?? "") === "on";

    const response = await fetch(
      `${backendUrl}/api/v1/staff/useful-informations/categories/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title || undefined,
          icon: icon || null,
          sortOrder: sortOrder ?? undefined,
          isActive
        }),
        cache: "no-store"
      }
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const code = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/useful-informations?error=${encodeURIComponent(code)}`);
    }

    revalidatePath("/useful-informations");
    redirect("/useful-informations?saved=category_updated");
  }

  async function deleteCategory(formData: FormData) {
    "use server";
    const token = requireStaffToken();
    const id = String(formData.get("categoryId") ?? "").trim();
    if (!id) redirect("/useful-informations?error=missing_category");

    const response = await fetch(
      `${backendUrl}/api/v1/staff/useful-informations/categories/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const code = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/useful-informations?error=${encodeURIComponent(code)}`);
    }

    revalidatePath("/useful-informations");
    redirect("/useful-informations?saved=category_deleted");
  }

  async function createItem(formData: FormData) {
    "use server";
    const token = requireStaffToken();
    const categoryId = String(formData.get("categoryId") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();

    if (!categoryId || !title || !content) {
      redirect("/useful-informations?error=fields_required");
    }

    const response = await fetch(`${backendUrl}/api/v1/staff/useful-informations/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ categoryId, title, content }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const code = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/useful-informations?error=${encodeURIComponent(code)}`);
    }

    revalidatePath("/useful-informations");
    redirect("/useful-informations?saved=item_created");
  }

  async function updateItem(formData: FormData) {
    "use server";
    const token = requireStaffToken();
    const itemId = String(formData.get("itemId") ?? "").trim();
    if (!itemId) redirect("/useful-informations?error=missing_item");

    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const sortOrder = parseNumber(formData.get("sortOrder"));
    const isActive = String(formData.get("isActive") ?? "") === "on";

    const response = await fetch(
      `${backendUrl}/api/v1/staff/useful-informations/items/${encodeURIComponent(itemId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title || undefined,
          content: content || undefined,
          sortOrder: sortOrder ?? undefined,
          isActive
        }),
        cache: "no-store"
      }
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const code = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/useful-informations?error=${encodeURIComponent(code)}`);
    }

    revalidatePath("/useful-informations");
    redirect("/useful-informations?saved=item_updated");
  }

  async function deleteItem(formData: FormData) {
    "use server";
    const token = requireStaffToken();
    const itemId = String(formData.get("itemId") ?? "").trim();
    if (!itemId) redirect("/useful-informations?error=missing_item");

    const response = await fetch(
      `${backendUrl}/api/v1/staff/useful-informations/items/${encodeURIComponent(itemId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const code = typeof payload?.error === "string" ? payload.error : `backend_error_${response.status}`;
      redirect(`/useful-informations?error=${encodeURIComponent(code)}`);
    }

    revalidatePath("/useful-informations");
    redirect("/useful-informations?saved=item_deleted");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Info className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Useful Informations</h1>
      </div>

      {searchParams?.saved && (
        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
          {searchParams.saved.replace(/_/g, " ")}
        </Badge>
      )}

      {(error || searchParams?.error) && (
        <Badge variant="destructive">
          {error ?? searchParams?.error?.replace(/_/g, " ")}
        </Badge>
      )}

      {/* Existing categories */}
      {categories.map((category) => (
        <Card key={category.id}>
          <CardHeader className="pb-3">
            <form action={updateCategory}>
              <input type="hidden" name="categoryId" value={category.id} />
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">#{category.sortOrder}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`cat-title-${category.id}`}>Title</Label>
                      <Input
                        id={`cat-title-${category.id}`}
                        name="title"
                        defaultValue={category.title}
                        placeholder="Category title"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`cat-icon-${category.id}`}>Icon</Label>
                      <Input
                        id={`cat-icon-${category.id}`}
                        name="icon"
                        defaultValue={category.icon ?? ""}
                        placeholder="Icon name (e.g. wifi)"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`cat-order-${category.id}`}>Sort order</Label>
                      <Input
                        id={`cat-order-${category.id}`}
                        name="sortOrder"
                        type="number"
                        defaultValue={category.sortOrder}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      id={`cat-active-${category.id}`}
                      defaultChecked={category.isActive}
                    />
                    <Label htmlFor={`cat-active-${category.id}`}>Active</Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" variant="outline">
                    <Save className="mr-1 h-3 w-3" /> Save
                  </Button>
                </div>
              </div>
            </form>
            <form action={deleteCategory} className="inline">
              <input type="hidden" name="categoryId" value={category.id} />
              <Button type="submit" size="sm" variant="destructive" className="mt-2">
                <Trash2 className="mr-1 h-3 w-3" /> Delete category
              </Button>
            </form>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Items ({category.items.length})
            </p>

            {category.items.map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <form action={updateItem}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <div className="grid grid-cols-[1fr_2fr_auto_auto] gap-3 items-end">
                    <div>
                      <Label htmlFor={`item-title-${item.id}`}>Title</Label>
                      <Input
                        id={`item-title-${item.id}`}
                        name="title"
                        defaultValue={item.title}
                        placeholder="Item title"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`item-content-${item.id}`}>Content</Label>
                      <Textarea
                        id={`item-content-${item.id}`}
                        name="content"
                        defaultValue={item.content}
                        placeholder="Item content"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`item-order-${item.id}`}>Order</Label>
                      <Input
                        id={`item-order-${item.id}`}
                        name="sortOrder"
                        type="number"
                        defaultValue={item.sortOrder}
                        className="w-20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isActive"
                        id={`item-active-${item.id}`}
                        defaultChecked={item.isActive}
                      />
                      <Label htmlFor={`item-active-${item.id}`}>Active</Label>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button type="submit" size="sm" variant="outline">
                      <Save className="mr-1 h-3 w-3" /> Save
                    </Button>
                  </div>
                </form>
                <form action={deleteItem} className="mt-1 inline">
                  <input type="hidden" name="itemId" value={item.id} />
                  <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </form>
              </div>
            ))}

            {/* Add new item to this category */}
            <form action={createItem} className="rounded-md border border-dashed p-3">
              <input type="hidden" name="categoryId" value={category.id} />
              <p className="mb-2 text-sm font-medium">Add new item</p>
              <div className="grid grid-cols-[1fr_2fr] gap-3">
                <div>
                  <Input name="title" placeholder="Item title" required />
                </div>
                <div>
                  <Textarea name="content" placeholder="Item content" rows={2} required />
                </div>
              </div>
              <Button type="submit" size="sm" className="mt-2">
                <Plus className="mr-1 h-3 w-3" /> Add item
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}

      {/* Create new category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add new category</CardTitle>
          <CardDescription>Create a new useful information category (e.g. Wi-Fi, Breakfast).</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCategory} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new-cat-title">Title</Label>
                <Input id="new-cat-title" name="title" placeholder="e.g. Connexion Wi-Fi" required />
              </div>
              <div>
                <Label htmlFor="new-cat-icon">Icon</Label>
                <Input id="new-cat-icon" name="icon" placeholder="e.g. wifi, coffee, dumbbell" />
              </div>
            </div>
            <Button type="submit">
              <Plus className="mr-1 h-4 w-4" /> Create category
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
