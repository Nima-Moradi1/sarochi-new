import { createResource, listResource } from "@/features/admin/catalog/server/handlers";
export const GET = (request: Request) => listResource(request, "sizes");
export const POST = (request: Request) => createResource(request, "sizes");
