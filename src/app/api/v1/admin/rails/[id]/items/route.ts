import { setRailItems } from "@/features/admin/catalog/server/handlers";
type Context = { params: Promise<{ id: string }> };
export const PUT = async (request: Request, { params }: Context) => setRailItems(request, (await params).id);
