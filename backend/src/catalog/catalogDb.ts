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

  public getCatalogIds(): string[] {
    return Array.from(this.catalogs.keys());
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

  public getAllPublicProductsAcrossCatalogs(): PublicProduct[] {
    const all: PublicProduct[] = [];
    for (const catalogId of this.catalogs.keys()) {
      all.push(...this.getPublicCatalog(catalogId));
    }
    return all;
  }

  public getAllProducts(catalogId: string = this.activeCatalogId): Product[] {
    return this.catalogs.get(catalogId) || [];
  }

  // Factual datasets
  private getHardwareProducts(): Product[] {
    return [
      // 1. Laptops (6)
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
        sku: 'HW-LAPTOP-MACBOOKPRO16',
        name: 'Apple MacBook Pro 16-inch M3 Max',
        description: 'Flagship developer notebook with 36GB unified memory, 1TB SSD, and Liquid Retina XDR display',
        price: 349900,
        category: 'Computers',
        floorPrice: 349900 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-DOCK', 'HW-ACC-CALDIGITTS4', 'HW-MONITOR-DELL34', 'HW-AUDIO-AIRPODSPRO2'],
        relatedProducts: ['HW-ACC-LOGITECHMXMASTER'],
      },
      {
        sku: 'HW-LAPTOP-DELLXPS15',
        name: 'Dell XPS 15 9530',
        description: 'Premium Windows ultrabook with Intel Core i9, 32GB RAM, 1TB SSD, and OLED Touch display',
        price: 245000,
        category: 'Computers',
        floorPrice: 245000 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-DOCK', 'HW-ACC-ANKERUSBCHUB', 'HW-MONITOR-LG27UK'],
        relatedProducts: ['HW-ACC-LOGITECHMXMASTER', 'HW-KEYBOARD'],
      },
      {
        sku: 'HW-LAPTOP-THINKPADX1',
        name: 'Lenovo ThinkPad X1 Carbon Gen 11',
        description: 'Ultra-lightweight business notebook featuring Intel Core i7, 16GB RAM, 512GB SSD, and legendary keyboard',
        price: 165000,
        category: 'Computers',
        floorPrice: 165000 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-DOCK', 'HW-ACC-ANKERUSBCHUB', 'HW-MONITOR-ASUSPROART'],
      },
      {
        sku: 'HW-LAPTOP-ROGZEPHYRUS',
        name: 'ASUS ROG Zephyrus G14',
        description: 'Compact gaming workstation powered by AMD Ryzen 9, RTX 4070, 32GB DDR5, and 120Hz ROG Nebula display',
        price: 189990,
        category: 'Computers',
        floorPrice: 189990 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-ACC-KEYCHRONK2', 'HW-MONITOR-SAMSUNGODYSSEY', 'HW-AUDIO-SONYWH1000XM5'],
      },
      {
        sku: 'HW-LAPTOP-SPECTREX360',
        name: 'HP Spectre x360 14 2-in-1',
        description: 'Convertible touchscreen notebook with Intel Core Ultra 7, 16GB RAM, 1TB SSD, and stylus pen included',
        price: 154990,
        category: 'Computers',
        floorPrice: 154990 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-ACC-ANKERUSBCHUB', 'HW-AUDIO-BOSEQC45'],
      },

      // 2. Smartphones (10)
      {
        sku: 'HW-PHONE-IPHONE15PRO',
        name: 'Apple iPhone 15 Pro Max',
        description: 'Flagship mobile phone with A17 Pro chip, Titanium design, 256GB storage, and 5x optical zoom lens',
        price: 159900,
        category: 'Smartphones',
        floorPrice: 159900 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-AUDIO-AIRPODSPRO2', 'HW-ACC-ANKERUSBCHUB'],
        relatedProducts: ['HW-AUDIO-SONYWH1000XM5'],
      },
      {
        sku: 'HW-PHONE-S24ULTRA',
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Premium Android mobile phone featuring Snapdragon 8 Gen 3, 200MP sensor, S Pen, and Galaxy AI',
        price: 129999,
        category: 'Smartphones',
        floorPrice: 129999 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-AUDIO-SONYWH1000XM5', 'HW-AUDIO-SENNHEISERM4'],
      },
      {
        sku: 'HW-PHONE-PIXEL8PRO',
        name: 'Google Pixel 8 Pro',
        description: 'Advanced AI mobile phone with Tensor G3 chip, pro triple sensor system, and 128GB storage',
        price: 106999,
        category: 'Smartphones',
        floorPrice: 106999 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-AUDIO-SONYWH1000XM5', 'HW-AUDIO-BOSEQC45'],
      },
      {
        sku: 'HW-PHONE-ONEPLUS12',
        name: 'OnePlus 12 5G',
        description: 'High-performance mobile phone powered by Snapdragon 8 Gen 3 and 100W SUPERVOOC charging',
        price: 64999,
        category: 'Smartphones',
        floorPrice: 64999 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-AUDIO-SHURESE215'],
      },
      {
        sku: 'HW-PHONE-XIAOMI14',
        name: 'Xiaomi 14 Pro',
        description: 'Compact flagship mobile phone with Leica Summilux optical lens and 120W HyperCharge',
        price: 69999,
        category: 'Smartphones',
        floorPrice: 69999 * FLOOR_PRICE_MULTIPLIER,
      },
      {
        sku: 'HW-PHONE-ZFLIP5',
        name: 'Samsung Galaxy Z Flip5',
        description: 'Innovative foldable mobile phone featuring Flex Window cover display, 256GB storage, and FlexCam',
        price: 99999,
        category: 'Smartphones',
        floorPrice: 99999 * FLOOR_PRICE_MULTIPLIER,
      },
      {
        sku: 'HW-PHONE-NOTHING2A',
        name: 'Nothing Phone (2a)',
        description: 'Distinctive transparent design smartphone with Glyph Interface, Dimensity 7200 Pro, and 120Hz AMOLED display',
        price: 23999,
        category: 'Smartphones',
        floorPrice: 23999 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-AUDIO-SHURESE215'],
        relatedProducts: ['HW-PHONE-NORDCE4'],
      },
      {
        sku: 'HW-PHONE-NORDCE4',
        name: 'OnePlus Nord CE 4',
        description: 'Mid-range smartphone powered by Snapdragon 7 Gen 3, 100W SUPERVOOC fast charging, and 120Hz Fluid AMOLED screen',
        price: 24999,
        category: 'Smartphones',
        floorPrice: 24999 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-AUDIO-SHURESE215'],
        relatedProducts: ['HW-PHONE-ONEPLUS12'],
      },
      {
        sku: 'HW-PHONE-GALAXYA35',
        name: 'Samsung Galaxy A35 5G',
        description: 'Versatile smartphone with Exynos 1380 processor, 50MP OIS camera, Super AMOLED display, and IP67 rating',
        price: 27999,
        category: 'Smartphones',
        floorPrice: 27999 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-AUDIO-BOSEQC45'],
        relatedProducts: ['HW-PHONE-S24ULTRA'],
      },
      {
        sku: 'HW-PHONE-PIXEL8A',
        name: 'Google Pixel 8a',
        description: 'Compact AI smartphone with Google Tensor G3 chip, advanced Camera AI features, and 120Hz Actua display',
        price: 29999,
        category: 'Smartphones',
        floorPrice: 29999 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-AUDIO-SONYWH1000XM5'],
        relatedProducts: ['HW-PHONE-PIXEL8PRO'],
      },


      // 3. Monitors (5)
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
        sku: 'HW-MONITOR-DELL34',
        name: 'Dell UltraSharp 34 Curved Display U3423WE',
        description: '34-inch WQHD curved USB-C hub display with IPS Black technology, KVM switch, and RJ45 ethernet',
        price: 89990,
        category: 'Displays',
        floorPrice: 89990 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-LAPTOP-MACBOOKPRO16', 'HW-LAPTOP-DELLXPS15', 'HW-ACC-CALDIGITTS4'],
      },
      {
        sku: 'HW-MONITOR-LG27UK',
        name: 'LG 27UK850-W 27-inch 4K Display',
        description: '27-inch UHD 4K IPS panel with HDR10 support, USB Type-C connectivity, and borderless design',
        price: 38500,
        category: 'Displays',
        floorPrice: 38500 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-DOCK', 'HW-LAPTOP-THINKPADX1'],
      },
      {
        sku: 'HW-MONITOR-ASUSPROART',
        name: 'ASUS ProArt Display PA279CV',
        description: '27-inch 4K UHD color-accurate panel factory calibrated for video editing and graphic design',
        price: 42990,
        category: 'Displays',
        floorPrice: 42990 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-DOCK', 'HW-LAPTOP-MACBOOKPRO16'],
      },
      {
        sku: 'HW-MONITOR-SAMSUNGODYSSEY',
        name: 'Samsung Odyssey G7 32-inch Gaming Display',
        description: '32-inch QHD curved 1000R screen with 240Hz refresh rate, 1ms response time, and G-Sync compatibility',
        price: 54999,
        category: 'Displays',
        floorPrice: 54999 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-LAPTOP-ROGZEPHYRUS'],
      },

      // 4. Audio (5)
      {
        sku: 'HW-AUDIO-SONYWH1000XM5',
        name: 'Sony WH-1000XM5 Wireless Headphones',
        description: 'Industry-leading noise cancelling over-ear headphones with 30-hour battery life and clear call quality',
        price: 29990,
        category: 'Audio',
        floorPrice: 29990 * FLOOR_PRICE_MULTIPLIER,
        relatedProducts: ['HW-PHONE-S24ULTRA', 'HW-PHONE-IPHONE15PRO'],
      },
      {
        sku: 'HW-AUDIO-AIRPODSPRO2',
        name: 'Apple AirPods Pro (2nd Generation, USB-C)',
        description: 'Active Noise Cancellation earbuds with Transparency mode, Spatial Audio, and MagSafe Case',
        price: 24900,
        category: 'Audio',
        floorPrice: 24900 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-PHONE-IPHONE15PRO', 'HW-LAPTOP-MACBOOKPRO16'],
      },
      {
        sku: 'HW-AUDIO-BOSEQC45',
        name: 'Bose QuietComfort 45 Headphones',
        description: 'Iconic over-ear bluetooth headphones with Quiet & Aware modes and high-fidelity sound',
        price: 26900,
        category: 'Audio',
        floorPrice: 26900 * FLOOR_PRICE_MULTIPLIER,
      },
      {
        sku: 'HW-AUDIO-SENNHEISERM4',
        name: 'Sennheiser Momentum 4 Wireless',
        description: 'Audiophile 42mm transducer headphones with 60-hour battery life and adaptive noise cancellation',
        price: 34990,
        category: 'Audio',
        floorPrice: 34990 * FLOOR_PRICE_MULTIPLIER,
      },
      {
        sku: 'HW-AUDIO-SHURESE215',
        name: 'Shure SE215 Sound Isolating Earphones',
        description: 'Professional in-ear monitors with dynamic MicroDriver for detailed audio and deep bass',
        price: 9990,
        category: 'Audio',
        floorPrice: 9990 * FLOOR_PRICE_MULTIPLIER,
      },

      // 5. Computing Accessories & Keyboards (6)
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
      },
      {
        sku: 'HW-ACC-LOGITECHMXMASTER',
        name: 'Logitech MX Master 3S Wireless Mouse',
        description: 'Performance wireless mouse with 8K DPI sensor, Quiet Clicks, and MagSpeed scrolling',
        price: 9495,
        category: 'Accessories',
        floorPrice: 9495 * FLOOR_PRICE_MULTIPLIER,
        relatedProducts: ['HW-KEYBOARD', 'HW-ACC-KEYCHRONK2'],
      },
      {
        sku: 'HW-ACC-KEYCHRONK2',
        name: 'Keychron K2 Wireless Mechanical Keyboard',
        description: '75% layout Bluetooth mechanical input peripheral with RGB backlighting and Gateron G Pro switches',
        price: 8499,
        category: 'Accessories',
        floorPrice: 8499 * FLOOR_PRICE_MULTIPLIER,
        relatedProducts: ['HW-ACC-LOGITECHMXMASTER'],
      },
      {
        sku: 'HW-ACC-ANKERUSBCHUB',
        name: 'Anker 555 USB-C Hub (8-in-1)',
        description: 'Compact expansion dongle with 85W Power Delivery, 4K HDMI, 1Gbps Ethernet, and SD card slots',
        price: 4999,
        category: 'Accessories',
        floorPrice: 4999 * FLOOR_PRICE_MULTIPLIER,
      },
      {
        sku: 'HW-ACC-CALDIGITTS4',
        name: 'CalDigit TS4 Thunderbolt 4 Dock',
        description: 'Ultimate 18-port workstation dock providing 98W charging, dual 4K / single 8K display support, and 2.5GbE',
        price: 39999,
        category: 'Accessories',
        floorPrice: 39999 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['HW-LAPTOP-MACBOOKPRO16', 'HW-MONITOR-DELL34'],
      },
    ];
  }

  private getPhotographyProducts(): Product[] {
    return [
      // 1. Cameras (6)
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
        sku: 'PHOTO-CAMERA-SONYA7IV',
        name: 'Sony Alpha a7 IV Body',
        description: 'Full-frame 33MP hybrid mirrorless body with BIONZ XR engine, 4K 60p recording, and advanced real-time AF',
        price: 224990,
        category: 'Cameras & Imaging',
        floorPrice: 224990 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['PHOTO-TRIPOD', 'PHOTO-BATTERY', 'PHOTO-MEM-CARD', 'PHOTO-ACC-GODBOXV860'],
      },
      {
        sku: 'PHOTO-CAMERA-CANONEOSR6',
        name: 'Canon EOS R6 Mark II Body',
        description: '24.2MP full-frame mirrorless body featuring 40 fps continuous shooting, 4K 60p video, and IBIS',
        price: 215995,
        category: 'Cameras & Imaging',
        floorPrice: 215995 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['PHOTO-TRIPOD', 'PHOTO-MEM-CARD', 'PHOTO-BATTERY'],
      },
      {
        sku: 'PHOTO-CAMERA-NIKONZ8',
        name: 'Nikon Z8 Mirrorless Body',
        description: 'Flagship 45.7MP stacked CMOS mirrorless body with 8K 60p RAW video, 120 fps stills, and 4-axis screen',
        price: 343995,
        category: 'Cameras & Imaging',
        floorPrice: 343995 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['PHOTO-TRIPOD', 'PHOTO-MEM-CARD'],
      },
      {
        sku: 'PHOTO-CAMERA-FUJIFILMXT5',
        name: 'Fujifilm X-T5 Mirrorless Body',
        description: 'Classic dial-operated 40MP APS-C mirrorless body with 7-stop IBIS, 6.2K video, and film simulation',
        price: 169999,
        category: 'Cameras & Imaging',
        floorPrice: 169999 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['PHOTO-TRIPOD', 'PHOTO-MEM-CARD'],
      },
      {
        sku: 'PHOTO-CAMERA-LEICAQ3',
        name: 'Leica Q3 Compact Digital Shooter',
        description: 'Premium full-frame compact body featuring 60MP BSI sensor, fixed Summilux 28mm f/1.7 ASPH lens, and 8K video',
        price: 595000,
        category: 'Cameras & Imaging',
        floorPrice: 595000 * FLOOR_PRICE_MULTIPLIER,
        compatibleWith: ['PHOTO-MEM-CARD'],
      },

      // 2. Photography Accessories (4)
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
      },
      {
        sku: 'PHOTO-ACC-GODBOXV860',
        name: 'Godox V860III TTL Speedlight Flash',
        description: 'Powerful flash unit with built-in 2.4G wireless X system, modeling light, and rechargeable battery',
        price: 17500,
        category: 'Accessories',
        floorPrice: 17500 * FLOOR_PRICE_MULTIPLIER,
      },
    ];
  }
}

export const catalogDb = new CatalogDatabase();

