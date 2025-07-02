import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "../db.server";
import { authenticate } from "../shopify.server";

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
    // Try to authenticate and fetch real product data
    let shopifyProducts = [];
    try {
      const { admin } = await authenticate.admin(request);
      const productsResponse = await admin.graphql(GET_PRODUCTS_QUERY);
      const productsData = await productsResponse.json();
      
      shopifyProducts = productsData.data?.products?.edges?.map((edge: any) => {
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
      }) || [];
    } catch (authError) {
      console.log("Could not authenticate for products, using fallback data");
      // Use fallback products if authentication fails
      shopifyProducts = [
        {
          id: "1",
          title: "Green Snowboard",
          handle: "green-snowboard", 
          image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=center",
          price: "29.99",
          vendor: "Winter Sports Co"
        },
        {
          id: "2", 
          title: "Red Snowboard",
          handle: "red-snowboard",
          image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center",
          price: "39.99",
          vendor: "Winter Sports Co"
        },
        {
          id: "3",
          title: "iPhone 12",
          handle: "iphone-12",
          image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop&crop=center", 
          price: "799.99",
          vendor: "Apple"
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
    const components = latestTemplate.components.map(comp => ({
      id: comp.id,
      componentId: comp.componentId,
      type: comp.component.type,
      props: comp.props,
      order: comp.order
    }));

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