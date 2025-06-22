// utils/simpleSkuGenerator.js - Dead simple SKU generation

/**
 * Generate SKU based on product type and existing ID
 * Examples: BTL-001, POD-123, ACC-456
 */
export const generateSimpleSKU = (product) => {
    const prefixes = {
      bottle: 'BTL',
      pod: 'POD', 
      accessory: 'ACC'
    };
    
    const prefix = prefixes[product.productType] || 'PRD';
    const paddedId = String(product.id).padStart(3, '0');
    
    return `${prefix}-${paddedId}`;
  };
  
  /**
   * Generate color variant SKU for pods
   * Examples: POD-123-RED, POD-123-BLU
   */
  export const generateColorSKU = (baseSKU, colorName) => {
    // Take first 3 letters of color name
    const colorCode = colorName
      .replace(/[^a-zA-Z]/g, '') // Remove non-letters
      .substring(0, 3)
      .toUpperCase();
    
    return `${baseSKU}-${colorCode}`;
  };
  
  /**
   * Generate all SKUs for a product (including color variants)
   */
  export const generateAllSKUs = (product) => {
    const mainSKU = generateSimpleSKU(product);
    
    const result = {
      mainSKU,
      colorSKUs: []
    };
    
    // Generate color SKUs for pod products
    if (product.productType === 'pod' && product.podColors?.length > 0) {
      result.colorSKUs = product.podColors.map(color => ({
        colorName: color.colorName,
        sku: generateColorSKU(mainSKU, color.colorName)
      }));
    }
    
    return result;
  };