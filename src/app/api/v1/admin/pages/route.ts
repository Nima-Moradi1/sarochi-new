import { createResource, listResource } from "@/features/admin/catalog/server/handlers";
export const GET = (request: Request) => listResource(request, "pages");
export const POST = (request: Request) => createResource(request, "pages");
