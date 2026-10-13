import { changeMedia } from "@/features/admin/catalog/server/handlers";

type Context = { params: Promise<{ id: string; mediaId: string }> };
export const PATCH = async (request: Request, { params }: Context) => { const values = await params; return changeMedia(request, values.id, values.mediaId, "PATCH"); };
export const DELETE = async (request: Request, { params }: Context) => { const values = await params; return changeMedia(request, values.id, values.mediaId, "DELETE"); };
