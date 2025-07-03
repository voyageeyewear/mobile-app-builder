import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "../db.server";
import { authenticate } from "../shopify.server";
import { shopifyApi } from '@shopify/shopify-api';
import { componentLibrary } from "../lib/utils";

const GET_PRODUCTS_QUERY = `
  query {
    products(first: 10) {
      edges {
        node {
          id
          title
          handle
          vendor
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                title
                price
              }
            }
          }
        }
      }
    }
  }
`;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { shop } = params;
  
  if (!shop) {
    return json({ error: "Shop parameter required" }, { status: 400 });
  }

    try {
    // First try to get cached real Shopify data from main app builder
    let shopifyProducts = [];
    
    try {
      const { getShopifyData } = await import("../lib/shopify-cache");
      const cachedData = getShopifyData(shop);
      
      if (cachedData && cachedData.products.length > 0) {
        console.log(`✅ Using cached real Shopify data for ${shop}`);
        shopifyProducts = cachedData.products.map((product: any) => ({
          id: product.id,
          title: product.title,
          handle: product.handle,
          image: product.images?.[0]?.url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop",
          price: product.variants?.[0]?.price?.amount || "29.99",
          vendor: product.vendor || "",
        }));
        console.log(`📱 Live config serving ${shopifyProducts.length} real products with real images`);
      } else {
        console.log(`⚠️ No cached data available for ${shop}, trying authentication...`);
        
        // Fallback: try direct authentication (probably won't work but worth trying)
        try {
          const { admin, session } = await authenticate.admin(request);
          if (session && session.shop === shop) {
            console.log("✅ Direct authentication succeeded for live config");
            const productsResponse = await admin.graphql(GET_PRODUCTS_QUERY);
            const productsData = await productsResponse.json();
            
            if (productsData.data?.products?.edges) {
              shopifyProducts = productsData.data.products.edges.map((edge: any) => {
                const firstVariant = edge.node.variants?.edges?.[0]?.node;
                const firstImage = edge.node.images?.edges?.[0]?.node;
                return {
                  id: edge.node.id,
                  title: edge.node.title,
                  handle: edge.node.handle,
                  image: firstImage?.url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop",
                  price: firstVariant?.price || "29.99",
                  vendor: edge.node.vendor || "",
                };
              });
            }
          }
        } catch (authError) {
          console.log("⚠️ Direct authentication failed:", (authError as Error).message);
        }
      }
    } catch (cacheError) {
      console.log("⚠️ Error accessing cache:", cacheError);
    }
    
    // If still no real data, fetch from database templates to get some real-looking data
    if (shopifyProducts.length === 0) {
      console.log("📦 No cached data available, creating realistic demo products");
      shopifyProducts = [
        {
          id: "gid://shopify/Product/001",
          title: "Wireless Earbuds Pro",
          handle: "wireless-earbuds-pro", 
          image: "https://images.unsplash.com/photo-1590658165737-15a047b7692f?w=400&h=400&fit=crop&crop=center",
          price: "129.99",
          vendor: shop.split('.')[0] + " Store"
        },
        {
          id: "gid://shopify/Product/002", 
          title: "Smart Watch Series X",
          handle: "smart-watch-series-x",
          image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&crop=center",
          price: "249.99",
          vendor: shop.split('.')[0] + " Store"
        },
        {
          id: "gid://shopify/Product/003",
          title: "Premium Phone Case",
          handle: "premium-phone-case",
          image: "https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=400&fit=crop&crop=center", 
          price: "39.99",
          vendor: shop.split('.')[0] + " Store"
        },
        {
          id: "gid://shopify/Product/004",
          title: "Bluetooth Speaker Mini",
          handle: "bluetooth-speaker-mini",
          image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop&crop=center", 
          price: "79.99",
          vendor: shop.split('.')[0] + " Store"
        }
      ];
    }

    // Get the latest template for this shop
    const mobileApp = await prisma.mobileApp.findUnique({
      where: { shop: shop },
      include: {
        pages: {
          include: {
            components: {
              include: {
                component: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: 1 // Get the most recent template
        }
      }
    });

    if (!mobileApp || !mobileApp.pages.length) {
      return json({ 
        error: "No mobile app or templates found for this shop",
        hasApp: false 
      });
    }

    const latestTemplate = mobileApp.pages[0];
    
    // Transform database components to mobile app format
    const components = latestTemplate.components.map(comp => {
      // Find the corresponding component library entry by type and name
      const componentLibEntry = componentLibrary.find(c => 
        c.type === comp.component.type && c.name === comp.component.name
      );
      
      return {
        id: comp.id,
        componentId: componentLibEntry?.id || comp.component.name.toLowerCase().replace(/\s+/g, '-'),
        type: comp.component.type,
        props: comp.props,
        order: comp.order
      };
    });

    const config = {
      id: latestTemplate.id,
      name: latestTemplate.name,
      slug: latestTemplate.slug,
      shop: shop,
      components: components,
      products: shopifyProducts,
      updatedAt: latestTemplate.updatedAt,
      hasApp: true
    };

    // Add CORS headers for cross-origin requests
    return json(config, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });

  } catch (error) {
    console.error("Error fetching live config:", error);
    return json({ 
      error: "Failed to fetch configuration",
      hasApp: false 
    }, { 
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
} 