import { createResource, listResource } from "@/features/admin/catalog/server/handlers";
export const GET = (request: Request) => listResource(request, "categories");
export const POST = (request: Request) => createResource(request, "categories");
