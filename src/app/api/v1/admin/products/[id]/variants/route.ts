import { createVariant } from "@/features/admin/catalog/server/handlers";
type Context = { params: Promise<{ id: string }> };
export const POST = async (request: Request, { params }: Context) => createVariant(request, (await params).id);
