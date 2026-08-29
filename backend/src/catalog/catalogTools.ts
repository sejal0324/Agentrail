import { catalogDb } from './catalogDb.js';
import { PublicProduct } from './catalogTypes.js';

/**
 * Searches the selected catalog for products matching the query.
 * Matches against name, description, category, and SKU (case-insensitive).
 * Returns ONLY sanitized PublicProduct objects (never exposes floorPrice).
 */
export function searchProducts(query: string, catalogId?: string): PublicProduct[] {
  const activeCatalogId = catalogId || catalogDb.getActiveCatalogId();
  const allPublicProducts = catalogDb.getPublicCatalog(activeCatalogId);

  if (!query || query.trim() === '') {
    return allPublicProducts;
  }

  const normalizedQuery = query.toLowerCase().trim();

  return allPublicProducts.filter(product => {
    return (
      product.sku.toLowerCase().includes(normalizedQuery) ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.description.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery)
    );
  });
}

/**
 * Retrieves a specific product by SKU from the selected catalog.
 * Returns ONLY the public/sanitized product representation or undefined if not found.
 */
export function getProduct(sku: string, catalogId?: string): PublicProduct | undefined {
  const activeCatalogId = catalogId || catalogDb.getActiveCatalogId();
  return catalogDb.getPublicProduct(sku, activeCatalogId);
}

/**
 * Retrieves factual related/compatible products for the given SKU.
 * Returns ONLY sanitized public product information.
 * If the SKU is unknown, returns an empty array.
 */
export function getRelatedProducts(sku: string, catalogId?: string): PublicProduct[] {
  const activeCatalogId = catalogId || catalogDb.getActiveCatalogId();
  const product = catalogDb.getProduct(sku, activeCatalogId);
  if (!product) {
    return [];
  }

  const relatedSkus = new Set<string>();
  if (product.compatibleWith) {
    product.compatibleWith.forEach(s => relatedSkus.add(s));
  }
  if (product.relatedProducts) {
    product.relatedProducts.forEach(s => relatedSkus.add(s));
  }

  const results: PublicProduct[] = [];
  for (const relatedSku of relatedSkus) {
    const relatedProduct = catalogDb.getPublicProduct(relatedSku, activeCatalogId);
    if (relatedProduct) {
      results.push(relatedProduct);
    }
  }

  return results;
}
