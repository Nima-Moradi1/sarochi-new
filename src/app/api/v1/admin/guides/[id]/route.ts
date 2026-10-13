import { handleGuides } from "@/features/admin/guides/server/handlers";
type Context = { params: Promise<{ id: string }> };
export const PATCH = async (request: Request, { params }: Context) => handleGuides(request, (await params).id);
export const DELETE = async (request: Request, { params }: Context) => handleGuides(request, (await params).id);
