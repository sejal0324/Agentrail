import { catalogDb } from '../src/catalog/catalogDb.js';

function runVerification() {
  console.log('--- START CATALOG VERIFICATION ---');

  // 1. Verify Catalog A (Hardware)
  console.log('\n1. Verifying Catalog A (Hardware)...');
  catalogDb.setActiveCatalogId('hardware');
  const hardwareCatalog = catalogDb.getPublicCatalog();
  console.log(`Loaded ${hardwareCatalog.length} public hardware products.`);
  
  const laptop = catalogDb.getPublicProduct('HW-LAPTOP');
  const dockingStation = catalogDb.getPublicProduct('HW-DOCK');
  const monitor = catalogDb.getPublicProduct('HW-MONITOR');

  if (!laptop || !dockingStation || !monitor) {
    throw new Error('Verification Failed: Hardware products not found.');
  }
  console.log('Catalog A loaded successfully.');

  // 2. Verify Catalog B (Photography)
  console.log('\n2. Verifying Catalog B (Photography)...');
  catalogDb.setActiveCatalogId('photography');
  const photographyCatalog = catalogDb.getPublicCatalog();
  console.log(`Loaded ${photographyCatalog.length} public photography products.`);
  
  const camera = catalogDb.getPublicProduct('PHOTO-CAMERA');
  const tripod = catalogDb.getPublicProduct('PHOTO-TRIPOD');
  const battery = catalogDb.getPublicProduct('PHOTO-BATTERY');

  if (!camera || !tripod || !battery) {
    throw new Error('Verification Failed: Photography products not found.');
  }
  console.log('Catalog B loaded successfully.');

  // 3. Verify Isolation / Sanitization
  console.log('\n3. Verifying Public Sanitization & Private Field Isolation...');
  // Check public representation
  const publicLaptop = catalogDb.getPublicProduct('HW-LAPTOP') as any;
  if (publicLaptop && 'floorPrice' in publicLaptop) {
    throw new Error('Verification Failed: Public product exposes private floorPrice.');
  }
  console.log('Sanitization Success: public product does not expose floorPrice.');

  // Check private representation
  catalogDb.setActiveCatalogId('hardware');
  const privateLaptop = catalogDb.getProduct('HW-LAPTOP');
  if (!privateLaptop || typeof privateLaptop.floorPrice !== 'number') {
    throw new Error('Verification Failed: Internal product does not contain floorPrice.');
  }
  console.log(`Isolation Success: private floorPrice is internally accessible (value: ${privateLaptop.floorPrice}).`);

  // 4. Verify Factual Relationships
  console.log('\n4. Verifying Factual Relationships...');
  
  // Hardware relationships
  catalogDb.setActiveCatalogId('hardware');
  const internalLaptop = catalogDb.getProduct('HW-LAPTOP');
  const internalMonitor = catalogDb.getProduct('HW-MONITOR');
  
  if (!internalLaptop?.compatibleWith?.includes('HW-DOCK')) {
    throw new Error('Verification Failed: Laptop compatibleWith relationship missing.');
  }
  if (!internalMonitor?.compatibleWith?.includes('HW-DOCK')) {
    throw new Error('Verification Failed: Monitor compatibleWith relationship missing.');
  }
  console.log('Hardware relationships verified successfully.');

  // Photography relationships
  catalogDb.setActiveCatalogId('photography');
  const internalCamera = catalogDb.getProduct('PHOTO-CAMERA');
  if (!internalCamera?.compatibleWith?.includes('PHOTO-TRIPOD')) {
    throw new Error('Verification Failed: Camera compatibleWith Tripod relationship missing.');
  }
  if (!internalCamera?.compatibleWith?.includes('PHOTO-BATTERY')) {
    throw new Error('Verification Failed: Camera compatibleWith Battery Pack relationship missing.');
  }
  console.log('Photography relationships verified successfully.');

  console.log('\n--- ALL VERIFICATIONS PASSED ---');
}

try {
  runVerification();
} catch (error: any) {
  console.error('\nVerification Failed with Error:', error.message);
  process.exit(1);
}
