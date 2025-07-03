import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sample product data structure for real Shopify integration
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  images: {
    url: string;
    altText?: string;
  }[];
  variants: {
    id: string;
    title: string;
    price: {
      amount: string;
      currencyCode: string;
    };
    compareAtPrice?: {
      amount: string;
      currencyCode: string;
    };
  }[];
  vendor: string;
  productType: string;
  tags: string[];
}

// Sample collection data structure
export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  image?: {
    url: string;
    altText?: string;
  };
  productsCount: number;
}

// Mock Shopify collections
export const mockShopifyCollections: ShopifyCollection[] = [
  {
    id: "gid://shopify/Collection/1",
    title: "Best Sellers",
    handle: "best-sellers",
    description: "Our most popular products loved by customers",
    image: { url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop", altText: "Best Sellers" },
    productsCount: 12
  },
  {
    id: "gid://shopify/Collection/2",
    title: "New Arrivals",
    handle: "new-arrivals",
    description: "Fresh products just added to our store",
    image: { url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop", altText: "New Arrivals" },
    productsCount: 8
  },
  {
    id: "gid://shopify/Collection/3",
    title: "Electronics",
    handle: "electronics",
    description: "Latest gadgets and electronic devices",
    image: { url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop", altText: "Electronics" },
    productsCount: 15
  },
  {
    id: "gid://shopify/Collection/4",
    title: "Fashion",
    handle: "fashion",
    description: "Trendy clothing and accessories",
    image: { url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop", altText: "Fashion" },
    productsCount: 24
  },
  {
    id: "gid://shopify/Collection/5",
    title: "Home & Living",
    handle: "home-living",
    description: "Beautiful items for your home",
    image: { url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop", altText: "Home & Living" },
    productsCount: 18
  }
];

// Mock real-looking products for demonstration
export const mockShopifyProducts: ShopifyProduct[] = [
  {
    id: "gid://shopify/Product/1",
    title: "Classic Cotton T-Shirt",
    handle: "classic-cotton-t-shirt",
    description: "Ultra-soft cotton t-shirt perfect for everyday wear. Made from 100% organic cotton.",
    images: [
      { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop", altText: "Classic Cotton T-Shirt" }
    ],
    variants: [
      {
        id: "gid://shopify/ProductVariant/1",
        title: "Small / Black",
        price: { amount: "29.99", currencyCode: "USD" },
        compareAtPrice: { amount: "39.99", currencyCode: "USD" }
      }
    ],
    vendor: "Fashion Co",
    productType: "T-Shirts",
    tags: ["cotton", "casual", "bestseller"]
  },
  {
    id: "gid://shopify/Product/2", 
    title: "Wireless Bluetooth Headphones",
    handle: "wireless-bluetooth-headphones",
    description: "Premium wireless headphones with noise cancellation and 30-hour battery life.",
    images: [
      { url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop", altText: "Wireless Bluetooth Headphones" }
    ],
    variants: [
      {
        id: "gid://shopify/ProductVariant/2",
        title: "Black",
        price: { amount: "199.99", currencyCode: "USD" }
      }
    ],
    vendor: "TechBrand",
    productType: "Electronics",
    tags: ["wireless", "audio", "premium"]
  },
  {
    id: "gid://shopify/Product/3",
    title: "Minimalist Watch",
    handle: "minimalist-watch", 
    description: "Elegant minimalist watch with leather strap. Perfect for any occasion.",
    images: [
      { url: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop", altText: "Minimalist Watch" }
    ],
    variants: [
      {
        id: "gid://shopify/ProductVariant/3",
        title: "Brown Leather",
        price: { amount: "149.99", currencyCode: "USD" },
        compareAtPrice: { amount: "199.99", currencyCode: "USD" }
      }
    ],
    vendor: "TimeKeepers",
    productType: "Watches",
    tags: ["minimalist", "leather", "accessories"]
  },
  {
    id: "gid://shopify/Product/4",
    title: "Organic Coffee Beans",
    handle: "organic-coffee-beans",
    description: "Single origin organic coffee beans, roasted to perfection. Notes of chocolate and caramel.",
    images: [
      { url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop", altText: "Organic Coffee Beans" }
    ],
    variants: [
      {
        id: "gid://shopify/ProductVariant/4",
        title: "1 lb / Medium Roast",
        price: { amount: "24.99", currencyCode: "USD" }
      }
    ],
    vendor: "Roastery Co",
    productType: "Coffee",
    tags: ["organic", "coffee", "single-origin"]
  },
  {
    id: "gid://shopify/Product/5",
    title: "Yoga Mat Premium",
    handle: "yoga-mat-premium",
    description: "High-quality non-slip yoga mat made from eco-friendly materials. Perfect grip and comfort.",
    images: [
      { url: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=400&h=400&fit=crop", altText: "Yoga Mat Premium" }
    ],
    variants: [
      {
        id: "gid://shopify/ProductVariant/5",
        title: "Purple",
        price: { amount: "89.99", currencyCode: "USD" },
        compareAtPrice: { amount: "119.99", currencyCode: "USD" }
      }
    ],
    vendor: "Wellness Gear",
    productType: "Fitness",
    tags: ["yoga", "fitness", "eco-friendly"]
  },
  {
    id: "gid://shopify/Product/6",
    title: "Artisan Ceramic Mug",
    handle: "artisan-ceramic-mug",
    description: "Handcrafted ceramic mug with unique glaze. Each piece is one-of-a-kind.",
    images: [
      { url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop", altText: "Artisan Ceramic Mug" }
    ],
    variants: [
      {
        id: "gid://shopify/ProductVariant/6", 
        title: "Blue Glaze",
        price: { amount: "34.99", currencyCode: "USD" }
      }
    ],
    vendor: "Pottery Studio",
    productType: "Home & Living",
    tags: ["handmade", "ceramic", "artisan"]
  }
];

// Function to get random products for components
export function getRandomProducts(count: number = 4): ShopifyProduct[] {
  const shuffled = [...mockShopifyProducts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Function to format price
export function formatPrice(amount: string, currencyCode: string = "USD"): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

// Real banner images from Unsplash
export const bannerImages = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop", // Store front
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop", // Fashion
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop", // Electronics
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop", // Lifestyle
  "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=800&h=400&fit=crop", // Sale
];

// Get random banner image
export function getRandomBannerImage(): string {
  return bannerImages[Math.floor(Math.random() * bannerImages.length)];
}

export const componentLibrary = [
  {
    id: "mobile-header",
    name: "Mobile Header",
    type: "MOBILE_HEADER",
    category: "Layout",
    icon: "📱",
    description: "Clean mobile app header with logo, search, and navigation",
    defaultProps: {
      // Logo
      logoText: "oe",
      logoImage: "",
      showLogoImage: false,
      logoSize: 40,
      logoColor: "#FFFFFF",
      
      // Colors
      backgroundColor: "#4A5568",
      iconColor: "#FFFFFF",
      textColor: "#FFFFFF",
      
      // Offer button
      showOfferButton: true,
      offerButtonText: "50% OFF",
      offerButtonColor: "#FC8181",
      
      // Icons
      showMenuIcon: true,
      showWishlistIcon: true,
      showAccountIcon: true,
      showCartIcon: true,
      showCartBadge: true,
      cartBadgeCount: 3,
      cartBadgeColor: "#EF4444",
      
      // Search
      searchPlaceholder: "Free Cash on Delivery",
      searchBackgroundColor: "#F7FAFC",
      searchTextColor: "#4A5568",
      
      // Navigation
      showNavTabs: true,
      navBackgroundColor: "#4A5568",
      navTextColor: "#CBD5E0",
      navActiveColor: "#FFFFFF",
      
      // Simple navigation items
      nav1Title: "All",
      nav1Active: true,
      nav2Title: "Classic", 
      nav2Active: false,
      nav3Title: "Essentials",
      nav3Active: false,
      nav4Title: "Premium",
      nav4Active: false
    },
    config: {
      properties: [
        { name: "showLogoImage", type: "boolean", label: "Use Logo Image", description: "Use an image instead of text for the logo" },
        { name: "logoImage", type: "shopify_image", label: "Logo Image", condition: { field: "showLogoImage", value: true } },
        { name: "logoText", type: "text", label: "Logo Text", description: "Text to display as the logo", condition: { field: "showLogoImage", value: false } },
        { name: "logoSize", type: "number", label: "Logo Size (px)", min: 20, max: 60 },
        { name: "logoColor", type: "color", label: "Logo Color", condition: { field: "showLogoImage", value: false } },
        { name: "backgroundColor", type: "color", label: "Background Color" },
        { name: "iconColor", type: "color", label: "Icon Color" },
        { name: "textColor", type: "color", label: "Text Color" },
        { name: "showOfferButton", type: "boolean", label: "Show Offer Button" },
        { name: "offerButtonText", type: "text", label: "Offer Button Text", condition: { field: "showOfferButton", value: true } },
        { name: "offerButtonColor", type: "color", label: "Offer Button Color", condition: { field: "showOfferButton", value: true } },
        { name: "showMenuIcon", type: "boolean", label: "Show Menu Icon" },
        { name: "showWishlistIcon", type: "boolean", label: "Show Wishlist Icon" },
        { name: "showAccountIcon", type: "boolean", label: "Show Account Icon" },
        { name: "showCartIcon", type: "boolean", label: "Show Cart Icon" },
        { name: "showCartBadge", type: "boolean", label: "Show Cart Badge", condition: { field: "showCartIcon", value: true } },
        { name: "cartBadgeCount", type: "number", label: "Cart Badge Count", min: 0, max: 99, condition: { field: "showCartBadge", value: true } },
        { name: "cartBadgeColor", type: "color", label: "Cart Badge Color", condition: { field: "showCartBadge", value: true } },
        { name: "searchPlaceholder", type: "text", label: "Search Placeholder" },
        { name: "searchBackgroundColor", type: "color", label: "Search Background" },
        { name: "searchTextColor", type: "color", label: "Search Text Color" },
        { name: "showNavTabs", type: "boolean", label: "Show Navigation Tabs" },
        { name: "navBackgroundColor", type: "color", label: "Nav Background", condition: { field: "showNavTabs", value: true } },
        { name: "navTextColor", type: "color", label: "Nav Text Color", condition: { field: "showNavTabs", value: true } },
        { name: "navActiveColor", type: "color", label: "Nav Active Color", condition: { field: "showNavTabs", value: true } },
        { name: "nav1Title", type: "text", label: "Nav Item 1 Title", condition: { field: "showNavTabs", value: true } },
        { name: "nav1Active", type: "boolean", label: "Nav Item 1 Active", condition: { field: "showNavTabs", value: true } },
        { name: "nav2Title", type: "text", label: "Nav Item 2 Title", condition: { field: "showNavTabs", value: true } },
        { name: "nav2Active", type: "boolean", label: "Nav Item 2 Active", condition: { field: "showNavTabs", value: true } },
        { name: "nav3Title", type: "text", label: "Nav Item 3 Title", condition: { field: "showNavTabs", value: true } },
        { name: "nav3Active", type: "boolean", label: "Nav Item 3 Active", condition: { field: "showNavTabs", value: true } },
        { name: "nav4Title", type: "text", label: "Nav Item 4 Title", condition: { field: "showNavTabs", value: true } },
        { name: "nav4Active", type: "boolean", label: "Nav Item 4 Active", condition: { field: "showNavTabs", value: true } }
      ]
    }
  },
  {
    id: "banner",
    name: "Banner",
    type: "BANNER",
    category: "Layout",
    icon: "🎯",
    description: "Hero banner with image and text overlay",
    defaultProps: {
      imageUrl: getRandomBannerImage(),
      title: "Welcome to our store",
      subtitle: "Discover amazing products",
      buttonText: "Shop Now",
      buttonLink: "/products",
      overlay: true,
      height: "200px"
    },
    config: {
      properties: [
        { name: "imageUrl", type: "image", label: "Background Image" },
        { name: "title", type: "text", label: "Title" },
        { name: "subtitle", type: "text", label: "Subtitle" },
        { name: "buttonText", type: "text", label: "Button Text" },
        { name: "buttonLink", type: "text", label: "Button Link" },
        { name: "overlay", type: "boolean", label: "Dark Overlay" },
        { name: "height", type: "select", label: "Height", options: ["150px", "200px", "300px", "400px"] }
      ]
    }
  },
  {
    id: "featured-collection",
    name: "Featured Collection",
    type: "FEATURED_COLLECTION",
    category: "Products",
    icon: "⭐",
    description: "Showcase a featured product collection with customizable layout",
    defaultProps: {
      title: "Featured Collection",
      description: "Check out our best products",
      dataSource: "collection",
      collectionId: "",
      specificProducts: [],
      layout: "grid",
      itemsToShow: 4,
      showPrices: true,
      showRatings: true,
      actionButtonText: "View All",
      actionButtonLink: "/collections/featured"
    },
    config: {
      properties: [
        { name: "title", type: "text", label: "Collection Title" },
        { name: "description", type: "text", label: "Description" },
        { name: "dataSource", type: "select", label: "Data Source", options: ["collection", "specific"] },
        { name: "collectionId", type: "shopify_collection", label: "Select Collection", condition: { field: "dataSource", value: "collection" } },
        { name: "specificProducts", type: "shopify_products", label: "Select Products", condition: { field: "dataSource", value: "specific" } },
        { name: "layout", type: "select", label: "Layout Style", options: ["grid", "list", "carousel"] },
        { name: "itemsToShow", type: "number", label: "Items to Show", min: 1, max: 10 } as any,
        { name: "showPrices", type: "boolean", label: "Show Prices" },
        { name: "showRatings", type: "boolean", label: "Show Ratings" },
        { name: "actionButtonText", type: "text", label: "Action Button Text" },
        { name: "actionButtonLink", type: "text", label: "Action Button Link" }
      ]
    }
  },
  {
    id: "carousel",
    name: "Product Carousel",
    type: "CAROUSEL", 
    category: "Products",
    icon: "🎠",
    description: "Horizontal scrolling product showcase",
    defaultProps: {
      title: "Featured Products",
      showArrows: true,
      autoPlay: false,
      itemsPerView: 2,
      spacing: "16px",
      dataSource: "mock", // "mock", "collection", "products"
      collectionId: "",
      productIds: []
    },
    config: {
      properties: [
        { name: "title", type: "text", label: "Section Title" },
        { name: "dataSource", type: "select", label: "Data Source", options: ["mock", "collection", "products"] },
        { name: "collectionId", type: "shopify_collection", label: "Shopify Collection", condition: { field: "dataSource", value: "collection" } },
        { name: "productIds", type: "shopify_products", label: "Select Products", condition: { field: "dataSource", value: "products" } },
        { name: "showArrows", type: "boolean", label: "Show Navigation Arrows" },
        { name: "autoPlay", type: "boolean", label: "Auto Play" },
        { name: "itemsPerView", type: "number", label: "Items Per View", min: 1, max: 4 } as any,
        { name: "spacing", type: "select", label: "Item Spacing", options: ["8px", "16px", "24px", "32px"] }
      ]
    }
  },
  {
    id: "countdown",
    name: "Countdown Timer",
    type: "COUNTDOWN",
    category: "Marketing", 
    icon: "⏰",
    description: "Urgency-creating countdown timer",
    defaultProps: {
      title: "Limited Time Offer",
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      showLabels: true,
      style: "circular"
    },
    config: {
      properties: [
        { name: "title", type: "text", label: "Title" },
        { name: "endDate", type: "datetime", label: "End Date" },
        { name: "showLabels", type: "boolean", label: "Show Labels" },
        { name: "style", type: "select", label: "Style", options: ["circular", "rectangular", "minimal"] }
      ]
    }
  },
  {
    id: "product-grid",
    name: "Product Grid",
    type: "PRODUCT_GRID",
    category: "Products",
    icon: "📦",
    description: "Grid layout for product display", 
    defaultProps: {
      title: "Our Products",
      columns: 2,
      showPrice: true,
      showRating: true,
      aspectRatio: "1:1",
      dataSource: "mock", // "mock", "collection", "products"
      collectionId: "",
      productIds: []
    },
    config: {
      properties: [
        { name: "title", type: "text", label: "Section Title" },
        { name: "dataSource", type: "select", label: "Data Source", options: ["mock", "collection", "products"] },
        { name: "collectionId", type: "shopify_collection", label: "Shopify Collection", condition: { field: "dataSource", value: "collection" } },
        { name: "productIds", type: "shopify_products", label: "Select Products", condition: { field: "dataSource", value: "products" } },
        { name: "columns", type: "number", label: "Columns", min: 1, max: 3 } as any,
        { name: "showPrice", type: "boolean", label: "Show Price" },
        { name: "showRating", type: "boolean", label: "Show Rating" },
        { name: "aspectRatio", type: "select", label: "Image Aspect Ratio", options: ["1:1", "4:3", "16:9"] }
      ]
    }
  },
  {
    id: "text-block",
    name: "Text Block",
    type: "TEXT_BLOCK", 
    category: "Content",
    icon: "📝",
    description: "Rich text content block",
    defaultProps: {
      content: "<h2>Your Heading Here</h2><p>Add your content here. You can use rich text formatting.</p>",
      textAlign: "left",
      fontSize: "16px",
      lineHeight: "1.5"
    },
    config: {
      properties: [
        { name: "content", type: "richtext", label: "Content" },
        { name: "textAlign", type: "select", label: "Text Alignment", options: ["left", "center", "right"] },
        { name: "fontSize", type: "select", label: "Font Size", options: ["14px", "16px", "18px", "20px", "24px"] },
        { name: "lineHeight", type: "select", label: "Line Height", options: ["1.2", "1.4", "1.5", "1.6", "1.8"] }
      ]
    }
  },
  {
    id: "image",
    name: "Image",
    type: "IMAGE",
    category: "Media",
    icon: "🖼️", 
    description: "Single image display",
    defaultProps: {
      imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
      alt: "Store showcase",
      aspectRatio: "16:9",
      objectFit: "cover",
      borderRadius: "8px"
    },
    config: {
      properties: [
        { name: "imageUrl", type: "image", label: "Image URL" },
        { name: "alt", type: "text", label: "Alt Text" },
        { name: "aspectRatio", type: "select", label: "Aspect Ratio", options: ["1:1", "4:3", "16:9", "21:9"] },
        { name: "objectFit", type: "select", label: "Object Fit", options: ["cover", "contain", "fill"] },
        { name: "borderRadius", type: "select", label: "Border Radius", options: ["0px", "4px", "8px", "12px", "24px"] }
      ]
    }
  },
  {
    id: "hero-slider",
    name: "Hero Slider",
    type: "HERO_SLIDER",
    category: "Media",
    icon: "🎬",
    description: "Professional slider for images and videos with navigation",
    defaultProps: {
      slides: [
        { url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop", type: "image" },
        { url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop", type: "image" }
      ],
      height: 250,
      borderRadius: 12,
      autoPlay: true,
      autoPlayInterval: 4000,
      showDots: true,
      showArrows: true
    },
    config: {
      properties: [
        { name: "slides", type: "text", label: "Slides (JSON)", description: "JSON array of slides with url and type properties" },
        { name: "height", type: "number", label: "Height (px)", min: 150, max: 500 } as any,
        { name: "borderRadius", type: "number", label: "Border Radius (px)", min: 0, max: 30 } as any,
        { name: "autoPlay", type: "boolean", label: "Auto Play" },
        { name: "autoPlayInterval", type: "number", label: "Auto Play Interval (ms)", min: 1000, max: 10000, condition: { field: "autoPlay", value: true } } as any,
        { name: "showDots", type: "boolean", label: "Show Navigation Dots" },
        { name: "showArrows", type: "boolean", label: "Show Navigation Arrows" }
      ]
    }
  },
  {
    id: "button",
    name: "Button",
    type: "BUTTON",
    category: "Interactive",
    icon: "🔘",
    description: "Call-to-action button",
    defaultProps: {
      text: "Shop Now",
      link: "/products",
      variant: "primary",
      size: "medium",
      fullWidth: false,
      icon: "🛍️"
    },
    config: {
      properties: [
        { name: "text", type: "text", label: "Button Text" },
        { name: "link", type: "text", label: "Link URL" },
        { name: "variant", type: "select", label: "Style", options: ["primary", "secondary", "outline", "ghost"] },
        { name: "size", type: "select", label: "Size", options: ["small", "medium", "large"] },
        { name: "fullWidth", type: "boolean", label: "Full Width" },
        { name: "icon", type: "text", label: "Icon (emoji or name)" }
      ]
    }
  },
  {
    id: "spacer",
    name: "Spacer",
    type: "SPACER",
    category: "Layout",
    icon: "⬜",
    description: "Empty space for layout control",
    defaultProps: {
      height: "24px"
    },
    config: {
      properties: [
        { name: "height", type: "select", label: "Height", options: ["8px", "16px", "24px", "32px", "48px", "64px"] }
      ]
    }
  }
];

export const themePresets = [
  {
    id: "modern",
    name: "Modern",
    primaryColor: "#007AFF",
    secondaryColor: "#5856D6", 
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    fontFamily: "Inter"
  },
  {
    id: "elegant",
    name: "Elegant",
    primaryColor: "#1C1C1E",
    secondaryColor: "#8E8E93",
    backgroundColor: "#F2F2F7", 
    textColor: "#1C1C1E",
    fontFamily: "SF Pro Display"
  },
  {
    id: "vibrant",
    name: "Vibrant",
    primaryColor: "#FF3B30",
    secondaryColor: "#FF9500",
    backgroundColor: "#FFFFFF",
    textColor: "#1C1C1E", 
    fontFamily: "Roboto"
  },
  {
    id: "minimal",
    name: "Minimal",
    primaryColor: "#34C759", 
    secondaryColor: "#00C7BE",
    backgroundColor: "#FAFAFA",
    textColor: "#2C2C2E",
    fontFamily: "Helvetica Neue"
  }
];

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
} 