import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireCustomerDashboardSession } from "@/lib/admin/auth";
import { updateCustomerProfile } from "@/lib/customer/account";
import { validateProfileForm } from "@/lib/customer/validation";
import { uploadProfileAvatarToR2 } from "@/lib/media/r2-upload";

export async function POST(request: Request) {
  const profile = await requireCustomerDashboardSession();
  const formData = await request.formData();
  const validation = validateProfileForm(formData);

  if (!validation.success) {
    return redirectWithStatus(request, "profile_error");
  }

  try {
    const avatarFile = getOptionalFile(formData, "avatar");
    const removeAvatar = formData.get("removeAvatar") === "on";
    const avatarUrl = avatarFile
      ? await uploadProfileAvatarToR2({
          file: avatarFile,
          userId: profile.userId,
        })
      : removeAvatar
        ? null
        : undefined;

    await updateCustomerProfile(profile.userId, {
      ...validation.data,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    });
    revalidatePath("/account");
    revalidatePath("/account/profile");
  } catch (error) {
    console.error("Failed to save customer profile.", error);

    return redirectWithStatus(request, "profile_error");
  }

  return redirectWithStatus(request, "profile_saved");
}

function redirectWithStatus(request: Request, status: string) {
  const url = new URL("/account/profile", request.url);
  url.searchParams.set("status", status);

  return NextResponse.redirect(url, { status: 303 });
}

function getOptionalFile(formData: FormData, name: string) {
  const value = formData.get(name);

  if (!(value instanceof File) || value.size <= 0) {
    return null;
  }

  return value;
}
