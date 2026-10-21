import { errorResponse } from "@/server/http";
import { getPhotoSearchImage } from "@/server/photo-search/photo-search";

/** Снимок из поиска по фото. Не меняется: новый снимок — новый id. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/photo-search/images/[id]">,
) {
  const { id } = await params;
  try {
    const image = await getPhotoSearchImage(id);
    return new Response(image.data, {
      headers: {
        "Content-Type": image.mimeType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
