import { Product, PublicProduct } from './catalogTypes.js';

// Configuration placeholder factor for calculating default floor prices
// if not explicitly provided, to avoid inventing arbitrary business values.
export const FLOOR_PRICE_MULTIPLIER = 0.8;

// Helper to sanitize product for public exposure
export function sanitizeProduct(product: Product): PublicProduct {
  const { floorPrice, ...publicProduct } = product;
  return publicProduct;
}

class CatalogDatabase {
  private catalogs: Map<string, Product[]> = new Map();
  private activeCatalogId: string = 'hardware'; // default active catalog

  constructor() {
    // Load pre-defined catalogs
    this.loadCatalog('hardware', this.getHardwareProducts());
    this.loadCatalog('photography', this.getPhotographyProducts());
  }

  public loadCatalog(catalogId: string, products: Product[]): void {
    this.catalogs.set(catalogId, products);
  }

  public getActiveCatalogId(): string {
    return this.activeCatalogId;
  }

  public setActiveCatalogId(catalogId: string): void {
    if (!this.catalogs.has(catalogId)) {
      throw new Error(`Catalog with ID '${catalogId}' does not exist.`);
    }
    this.activeCatalogId = catalogId;
  }

  public getProduct(sku: string, catalogId: string = this.activeCatalogId): Product | undefined {
    const catalog = this.catalogs.get(catalogId);
    if (!catalog) return undefined;
    return catalog.find(p => p.sku === sku);
  }

  public getPublicProduct(sku: string, catalogId: string = this.activeCatalogId): PublicProduct | undefined {
    const product = this.getProduct(sku, catalogId);
    if (!product) return undefined;
    return sanitizeProduct(product);
  }

  public getPublicCatalog(catalogId: string = this.activeCatalogId): PublicProduct[] {
    const catalog = this.catalogs.get(catalogId);
    if (!catalog) return [];
    return catalog.map(p => sanitizeProduct(p));
  }

  public getAllProducts(catalogId: string = this.activeCatalogId): Product[] {
    return this.catalogs.get(catalogId) || [];
  }

  // Factual datasets
  private getHardwareProducts(): Product[] {
    return [
      {
        sku: 'HW-LAPTOP',
        name: 'Laptop',
        description: 'High-performance developer laptop',
        price: 80000,
        category: 'Computers',
        floorPrice: 80000 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-DOCK'],
      },
      {
        sku: 'HW-MONITOR',
        name: 'Monitor',
        description: '4K Ultra-wide office monitor',
        price: 15000,
        category: 'Displays',
        floorPrice: 15000 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-DOCK'],
      },
      {
        sku: 'HW-DOCK',
        name: 'Docking Station',
        description: 'Universal USB-C docking station',
        price: 10000,
        category: 'Accessories',
        floorPrice: 10000 * FLOOR_PRICE_MULTIPLIER,
      },
      {
        sku: 'HW-KEYBOARD',
        name: 'Keyboard',
        description: 'Mechanical tactile keyboard',
        price: 3000,
        category: 'Accessories',
        floorPrice: 3000 * FLOOR_PRICE_MULTIPLIER,
      }
    ];
  }

  private getPhotographyProducts(): Product[] {
    return [
      {
        sku: 'PHOTO-CAMERA',
        name: 'Camera',
        description: 'Mirrorless full-frame digital camera',
        price: 120000,
        category: 'Cameras',
        floorPrice: 120000 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['PHOTO-TRIPOD', 'PHOTO-BATTERY'],
      },
      {
        sku: 'PHOTO-TRIPOD',
        name: 'Tripod',
        description: 'Carbon fiber lightweight tripod',
        price: 8000,
        category: 'Accessories',
        floorPrice: 8000 * FLOOR_PRICE_MULTIPLIER,
      },
      {
        sku: 'PHOTO-MEM-CARD',
        name: 'Memory Card',
        description: 'High-speed 128GB SDXC memory card',
        price: 2500,
        category: 'Storage',
        floorPrice: 2500 * FLOOR_PRICE_MULTIPLIER,
      },
      {
        sku: 'PHOTO-BATTERY',
        name: 'Battery Pack',
        description: 'Rechargeable Li-ion battery pack',
        price: 4000,
        category: 'Accessories',
        floorPrice: 4000 * FLOOR_PRICE_MULTIPLIER,
      }
    ];
  }
}

export const catalogDb = new CatalogDatabase();
