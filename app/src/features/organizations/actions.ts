"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { OrganizationService } from "./organization-service";

export type ActionResult = { error?: string };

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Create the current user's organization (they become owner). */
export async function createOrganization(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? ""));

  if (!name) return { error: "Organization name is required." };
  if (!slug) return { error: "A valid slug is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const service = new OrganizationService(supabase);
  const result = await service.createOrganization(name, slug);

  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard");
  return {};
}
