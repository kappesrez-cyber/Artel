import { getCurrentUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http";
import { getOrderAttachment } from "@/server/orders/orders";
import { isInlineSafe } from "@/server/orders/schemas";

/** Файл заказа (ТЗ, чертёж). Только для вошедших предприятий: документы заказчика не публичны. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/orders/[id]/attachments/[attachmentId]">,
) {
  const { id, attachmentId } = await params;
  const user = await getCurrentUser();
  if (!user?.organization) {
    return Response.json({ error: "Войдите в аккаунт предприятия" }, { status: 401 });
  }
  try {
    const file = await getOrderAttachment(id, attachmentId, user.organization.id);
    const disposition = isInlineSafe(file.mimeType) ? "inline" : "attachment";
    return new Response(file.data, {
      headers: {
        "Content-Type": isInlineSafe(file.mimeType) ? file.mimeType : "application/octet-stream",
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
