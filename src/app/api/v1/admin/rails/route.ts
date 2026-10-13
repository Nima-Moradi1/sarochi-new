import { createResource, listResource } from "@/features/admin/catalog/server/handlers";
export const GET = (request: Request) => listResource(request, "rails");
export const POST = (request: Request) => createResource(request, "rails");
