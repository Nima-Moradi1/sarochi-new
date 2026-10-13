import { listVariantStyling } from "@/features/admin/styling/server";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) { return listVariantStyling(request, (await params).id); }
