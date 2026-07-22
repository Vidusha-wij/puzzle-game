// Product wordmarks shown in the white box on the main display.
//
// Drop the artwork in public/products/ named <key>.png (transparent background)
// or swap productSrc() to .svg. Until a file exists, a styled-text fallback
// (using `parts`) is shown, so nothing ever looks broken.

export interface ProductPart {
  text: string;
  color: string;
}

export interface Product {
  key: string; // filename base, e.g. "celomet-sr" -> public/products/celomet-sr.png
  name: string; // alt text
  parts: ProductPart[]; // styled-text fallback
  serif?: boolean;
}

export const PRODUCTS: Product[] = [
  { key: "atogen", name: "Atogen", parts: [{ text: "ATOGEN", color: "#1668c9" }] },
  { key: "pantogen", name: "Pantogen", parts: [{ text: "PANTOGEN", color: "#e07d24" }] },
  {
    key: "vertihist",
    name: "Vertihist",
    parts: [{ text: "VERTIHIST", color: "#d9531f" }],
    serif: true,
  },
  {
    key: "celomet-sr",
    name: "Celomet SR",
    parts: [
      { text: "CELOMET ", color: "#37a853" },
      { text: "SR", color: "#5b34b3" },
    ],
  },
  { key: "empabest", name: "Empabest", parts: [{ text: "EMPABEST", color: "#e2511f" }] },
];

export const productSrc = (key: string) => `/products/${key}.png`;
