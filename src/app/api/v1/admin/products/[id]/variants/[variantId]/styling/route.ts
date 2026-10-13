import { changeVariantStyling } from "@/features/admin/styling/server";
type Context = { params: Promise<{ id: string; variantId: string }> };
export async function PUT(request: Request, { params }: Context) {
  const { id, variantId } = await params;
  return changeVariantStyling(request, id, variantId, "PUT");
}
export async function DELETE(request: Request, { params }: Context) {
  const { id, variantId } = await params;
  return changeVariantStyling(request, id, variantId, "DELETE");
}
