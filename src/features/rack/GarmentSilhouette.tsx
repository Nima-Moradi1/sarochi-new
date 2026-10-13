type Props = { garmentClass: string };

const shapes: Record<string, string> = {
  TSHIRT: "M76 44 91 35 149 35 164 44 213 77 189 118 166 105 166 271 74 271 74 105 51 118 27 77Z",
  SHIRT: "M79 43 95 35 145 35 161 43 196 70 181 150 162 144 163 276 77 276 78 144 59 150 44 70Z",
  KNIT: "M76 44 94 34 146 34 164 44 203 74 184 156 164 149 164 274 76 274 76 149 56 156 37 74Z",
  JACKET: "M75 42 95 34 145 34 165 42 200 69 184 165 164 157 164 278 76 278 76 157 56 165 40 69Z",
  PANTS: "M68 35 172 35 169 127 153 279 114 279 119 135 121 135 126 279 87 279 71 127Z",
};

export function GarmentSilhouette({ garmentClass }: Props) {
  const path = shapes[garmentClass] ?? shapes.TSHIRT;
  return (
    <svg viewBox="0 0 240 300" role="img" aria-label="نمای مفهومی پوشاک؛ تصویر محصول نیست" className="h-full w-full drop-shadow-[0_18px_18px_rgba(23,27,25,0.14)]">
      <path d={path} fill="var(--surface-concept-garment)" stroke="var(--text-secondary)" strokeWidth="1.5" />
      {garmentClass === "JACKET" && <path d="M95 35 120 145 145 35M120 145V277" fill="none" stroke="var(--text-secondary)" strokeWidth="1.2" />}
      {garmentClass === "SHIRT" && <path d="M95 35 120 72 145 35M120 72V275" fill="none" stroke="var(--text-secondary)" strokeWidth="1.2" />}
      {garmentClass === "KNIT" && <path d="M94 34Q120 69 146 34" fill="none" stroke="var(--text-secondary)" strokeWidth="1.2" />}
    </svg>
  );
}
