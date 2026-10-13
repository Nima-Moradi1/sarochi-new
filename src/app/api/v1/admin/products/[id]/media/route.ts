import { createMedia, listMedia } from "@/features/admin/catalog/server/handlers";

type Context = { params: Promise<{ id: string }> };
export const GET = async (request: Request, { params }: Context) => listMedia(request, (await params).id);
export const POST = async (request: Request, { params }: Context) => createMedia(request, (await params).id);
