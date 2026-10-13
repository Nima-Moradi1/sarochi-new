import { changeResource } from "@/features/admin/catalog/server/handlers";
type Context = { params: Promise<{ id: string }> };
export const PATCH = async (request: Request, { params }: Context) => changeResource(request, "colors", (await params).id, "PATCH");
export const DELETE = async (request: Request, { params }: Context) => changeResource(request, "colors", (await params).id, "DELETE");
