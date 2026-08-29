import { searchProducts, getProduct, getRelatedProducts } from '../src/catalog/catalogTools.js';

function runVerification() {
  console.log('--- START TOOLS VERIFICATION ---');

  // 1. Hardware Catalog search
  console.log('\n1. Searching Hardware Catalog...');
  const hardwareResults = searchProducts('laptop', 'hardware');
  console.log(`Found ${hardwareResults.length} hardware product(s) matching "laptop".`);
  if (hardwareResults.length !== 1 || hardwareResults[0].sku !== 'HW-LAPTOP') {
    throw new Error(`Verification Failed: Expected exactly one laptop product, got: ${JSON.stringify(hardwareResults)}`);
  }
  console.log('Hardware search works as expected.');

  // 2. Photography Catalog search
  console.log('\n2. Searching Photography Catalog...');
  const photographyResults = searchProducts('camera', 'photography');
  console.log(`Found ${photographyResults.length} photography product(s) matching "camera".`);
  if (photographyResults.length !== 1 || photographyResults[0].sku !== 'PHOTO-CAMERA') {
    throw new Error(`Verification Failed: Expected exactly one camera product, got: ${JSON.stringify(photographyResults)}`);
  }
  console.log('Photography search works as expected.');

  // 3. Product Lookup by SKU (getProduct)
  console.log('\n3. Testing Product Lookup by SKU...');
  
  // Valid Hardware SKU
  const laptopProduct = getProduct('HW-LAPTOP', 'hardware');
  if (!laptopProduct || laptopProduct.sku !== 'HW-LAPTOP') {
    throw new Error(`Verification Failed: Could not retrieve valid hardware product: ${JSON.stringify(laptopProduct)}`);
  }
  console.log('Valid Hardware SKU lookup works as expected.');

  // Valid Photography SKU
  const cameraProduct = getProduct('PHOTO-CAMERA', 'photography');
  if (!cameraProduct || cameraProduct.sku !== 'PHOTO-CAMERA') {
    throw new Error(`Verification Failed: Could not retrieve valid photography product: ${JSON.stringify(cameraProduct)}`);
  }
  console.log('Valid Photography SKU lookup works as expected.');

  // Invalid SKU lookup
  const invalidProduct = getProduct('HW-INVALID', 'hardware');
  if (invalidProduct !== undefined) {
    throw new Error(`Verification Failed: Expected undefined for invalid SKU lookup, got: ${JSON.stringify(invalidProduct)}`);
  }
  console.log('Invalid SKU lookup returns undefined as expected.');

  // 4. Product Relationships Lookup (getRelatedProducts)
  console.log('\n4. Testing Product Relationships Lookup...');
  
  // Laptop -> Docking Station
  const laptopRelations = getRelatedProducts('HW-LAPTOP', 'hardware');
  console.log(`Found ${laptopRelations.length} relationship(s) for Laptop.`);
  if (laptopRelations.length !== 1 || laptopRelations[0].sku !== 'HW-DOCK') {
    throw new Error(`Verification Failed: Expected Laptop to relate only to HW-DOCK, got: ${JSON.stringify(laptopRelations)}`);
  }
  console.log('Laptop -> Docking Station relationship verified.');

  // Camera -> Tripod / Battery Pack
  const cameraRelations = getRelatedProducts('PHOTO-CAMERA', 'photography');
  console.log(`Found ${cameraRelations.length} relationship(s) for Camera.`);
  const cameraSkus = cameraRelations.map(r => r.sku);
  if (cameraSkus.length !== 2 || !cameraSkus.includes('PHOTO-TRIPOD') || !cameraSkus.includes('PHOTO-BATTERY')) {
    throw new Error(`Verification Failed: Expected Camera to relate to PHOTO-TRIPOD and PHOTO-BATTERY, got: ${JSON.stringify(cameraRelations)}`);
  }
  console.log('Camera -> Tripod & Battery Pack relationships verified.');

  // Unknown SKU relations
  const unknownRelations = getRelatedProducts('HW-INVALID', 'hardware');
  if (!Array.isArray(unknownRelations) || unknownRelations.length !== 0) {
    throw new Error(`Verification Failed: Expected empty array for unknown SKU relations, got: ${JSON.stringify(unknownRelations)}`);
  }
  console.log('Unknown SKU relationship lookup returns empty array as expected.');

  // 5. Sanitization check
  console.log('\n5. Verifying results are sanitized...');
  const allResults = [
    ...hardwareResults,
    ...photographyResults,
    laptopProduct,
    cameraProduct,
    ...laptopRelations,
    ...cameraRelations
  ];
  for (const product of allResults) {
    if ('floorPrice' in product) {
      throw new Error(`Verification Failed: Product lookup, search, or relation exposes private floorPrice: ${JSON.stringify(product)}`);
    }
  }
  console.log('Sanitization check passed: no search, lookup, or relationship results expose floorPrice.');

  console.log('\n--- ALL CATALOG TOOL VERIFICATIONS PASSED ---');
}

try {
  runVerification();
} catch (error: any) {
  console.error('\nVerification Failed with Error:', error.message);
  process.exit(1);
}
