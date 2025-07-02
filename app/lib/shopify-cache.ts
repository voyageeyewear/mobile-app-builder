// Simple in-memory cache for Shopify data
interface ShopifyData {
  products: any[];
  collections: any[];
  lastUpdated: Date;
}

const shopifyCache = new Map<string, ShopifyData>();

export function setShopifyData(shop: string, products: any[], collections: any[]) {
  shopifyCache.set(shop, {
    products,
    collections,
    lastUpdated: new Date()
  });
  console.log(`💾 CACHE SET: ${products.length} products and ${collections.length} collections for ${shop}`);
  console.log(`🔍 Sample product:`, products[0]?.title, products[0]?.images?.[0]?.url);
}

export function getShopifyData(shop: string): ShopifyData | null {
  console.log(`🔍 CACHE GET: Looking for data for shop ${shop}`);
  console.log(`🔍 CACHE KEYS:`, Array.from(shopifyCache.keys()));
  
  const data = shopifyCache.get(shop);
  if (!data) {
    console.log(`❌ CACHE MISS: No data found for ${shop}`);
    return null;
  }
  
  console.log(`🔍 CACHE HIT: Found data for ${shop}, updated ${data.lastUpdated}`);
  
  // Return data if it's less than 30 minutes old
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  if (data.lastUpdated > thirtyMinutesAgo) {
    console.log(`✅ CACHE VALID: Using cached data for ${shop} (${data.products.length} products)`);
    console.log(`🔍 Sample cached product:`, data.products[0]?.title, data.products[0]?.images?.[0]?.url);
    return data;
  }
  
  console.log(`⚠️ CACHE EXPIRED: Data for ${shop} is too old, needs refresh`);
  return null;
} 