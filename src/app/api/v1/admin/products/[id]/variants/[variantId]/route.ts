import { changeVariant } from "@/features/admin/catalog/server/handlers";
type Context = { params: Promise<{ id: string; variantId: string }> };
export const PATCH = async (request: Request, { params }: Context) => { const values = await params; return changeVariant(request, values.id, values.variantId, "PATCH"); };
export const DELETE = async (request: Request, { params }: Context) => { const values = await params; return changeVariant(request, values.id, values.variantId, "DELETE"); };
