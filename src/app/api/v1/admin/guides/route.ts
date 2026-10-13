import { handleGuides } from "@/features/admin/guides/server/handlers";
export const GET = (request: Request) => handleGuides(request);
export const POST = (request: Request) => handleGuides(request);
