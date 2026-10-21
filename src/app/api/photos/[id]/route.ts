import { getCurrentUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http";
import { getPhotoFile } from "@/server/photos/photos";

/** Фотография позиции или заказа. Опубликованные видят все; черновики и снятые заказы — только владелец. */
export async function GET(_request: Request, { params }: RouteContext<"/api/photos/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();
  try {
    const photo = await getPhotoFile(id, user?.organization?.id ?? null);
    return new Response(photo.data, {
      headers: {
        "Content-Type": photo.mimeType,
        "X-Content-Type-Options": "nosniff",
        // Снимок по своему адресу не меняется: новое фото — новый id.
        "Cache-Control": photo.isPublic ? "public, max-age=86400" : "private, no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
