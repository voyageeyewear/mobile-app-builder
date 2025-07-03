import { useState, useCallback, useEffect } from "react";
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { componentLibrary, generateId, cn, formatPrice } from "../lib/utils";
import { prisma } from "../db.server";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Simplest possible GraphQL queries for testing
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

const GET_COLLECTIONS_QUERY = `
  query {
    collections(first: 5) {
      edges {
        node {
          id
          title
          handle
        }
      }
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("🚀 LOADER FUNCTION CALLED - Starting...");
  
  try {
    console.log("🔐 Attempting Shopify authentication...");
    const { admin, session } = await authenticate.admin(request);
    console.log("✅ Successfully authenticated with Shopify Admin API");
    
    console.log("🔍 Fetching products and collections from Shopify...");
    console.log("📋 Products Query:", GET_PRODUCTS_QUERY);
    console.log("📋 Collections Query:", GET_COLLECTIONS_QUERY);
    
    // Fetch real products and collections from Shopify
    console.log("⏳ Making GraphQL requests...");
    const [productsResponse, collectionsResponse] = await Promise.all([
      admin.graphql(GET_PRODUCTS_QUERY),
      admin.graphql(GET_COLLECTIONS_QUERY)
    ]);
    
    console.log("📦 Received responses, parsing JSON...");
    const productsData = await productsResponse.json();
    const collectionsData = await collectionsResponse.json();

    // Log the raw responses for debugging
    console.log("🔍 Products Response Status:", productsResponse.status);
    console.log("🔍 Collections Response Status:", collectionsResponse.status);
    console.log("📄 Products Data:", JSON.stringify(productsData, null, 2));
    console.log("📄 Collections Data:", JSON.stringify(collectionsData, null, 2));

    // Check for GraphQL errors
    if ((productsData as any).errors) {
      console.error("❌ Products GraphQL Errors:", (productsData as any).errors);
    }
    if ((collectionsData as any).errors) {
      console.error("❌ Collections GraphQL Errors:", (collectionsData as any).errors);
    }
    
    // Check if data exists
    console.log("🔍 Products edges count:", productsData.data?.products?.edges?.length || 0);
    console.log("🔍 Collections edges count:", collectionsData.data?.collections?.edges?.length || 0);

    // Transform Shopify data to our expected format
    const shopifyProducts = productsData.data?.products?.edges?.map((edge: any) => {
      const firstVariant = edge.node.variants?.edges?.[0]?.node;
      const firstImage = edge.node.images?.edges?.[0]?.node;
      return {
        id: edge.node.id,
        title: edge.node.title,
        handle: edge.node.handle,
        description: "",
        images: [{ 
          url: firstImage?.url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop",
          altText: firstImage?.altText || edge.node.title 
        }],
        variants: [{
          id: firstVariant?.id || edge.node.id + "-variant",
          title: firstVariant?.title || "Default",
          price: {
            amount: firstVariant?.price || "29.99",
            currencyCode: "USD"
          },
          compareAtPrice: null
        }],
        vendor: edge.node.vendor || "",
        productType: "",
        tags: []
      };
    }) || [];

    const shopifyCollections = collectionsData.data?.collections?.edges?.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      description: "",
      image: null,
      productsCount: 5 // Default count since we can't query this field directly
    })) || [];

         console.log(`✅ Transformed ${shopifyProducts.length} products and ${shopifyCollections.length} collections`);

     // Get saved templates from database
     console.log("📋 Fetching saved templates for shop:", session.shop);
     let savedTemplates: any[] = [];
     
     try {
       // Find the mobile app for this shop
       const mobileApp = await prisma.mobileApp.findUnique({
         where: { shop: session.shop },
         include: {
           pages: {
             orderBy: { updatedAt: 'desc' }
           }
         }
       });
       
       if (mobileApp) {
         savedTemplates = mobileApp.pages.map(page => ({
           id: page.id,
           name: page.name,
           slug: page.slug,
           updatedAt: page.updatedAt
         }));
         console.log(`✅ Found ${savedTemplates.length} saved templates:`, savedTemplates.map(t => t.name));
       } else {
         console.log("ℹ️ No mobile app found for this shop yet");
       }
     } catch (error) {
       console.error("❌ Error fetching templates:", error);
       savedTemplates = [];
     }

     // Add fallback data if no real data was fetched
     const finalProducts = shopifyProducts.length > 0 ? shopifyProducts : [
       {
         id: "fallback-product-1",
         title: "Sample Product 1",
         handle: "sample-product-1",
         description: "",
         images: [{ url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop", altText: "Sample Product" }],
         variants: [{ id: "variant-1", title: "Default", price: { amount: "29.99", currencyCode: "USD" }, compareAtPrice: null }],
         vendor: "Sample Vendor",
         productType: "",
         tags: []
       }
     ];

     const finalCollections = shopifyCollections.length > 0 ? shopifyCollections : [
       {
         id: "fallback-collection-1",
         title: "Sample Collection",
         handle: "sample-collection",
         description: "",
         image: null,
         productsCount: 5
       }
     ];

     console.log(`🚀 Returning ${finalProducts.length} products and ${finalCollections.length} collections to frontend`);

     // Cache real Shopify products for live config API
     if (shopifyProducts.length > 0) {
       try {
         const { setShopifyData } = await import("../lib/shopify-cache");
         setShopifyData(session.shop, shopifyProducts, shopifyCollections);
       } catch (cacheError) {
         console.log("⚠️ Failed to cache products:", cacheError);
       }
     }

     return json({ 
       components: componentLibrary,
       savedTemplates,
       shopifyProducts: finalProducts,
       shopifyCollections: finalCollections,
       debugInfo: {
         authSuccess: true,
         productsCount: shopifyProducts.length,
         collectionsCount: shopifyCollections.length,
         productsFromShopify: shopifyProducts.length > 0,
         collectionsFromShopify: shopifyCollections.length > 0,
         fallbackUsed: shopifyProducts.length === 0 || shopifyCollections.length === 0,
         timestamp: new Date().toISOString()
       }
     });

   } catch (error) {
     console.error("Error fetching Shopify data:", error);
     
      // Fallback if API fails
      const savedTemplates: any[] = [];

     return json({ 
       components: componentLibrary,
       savedTemplates,
       shopifyProducts: [],
       shopifyCollections: [],
       error: "Failed to fetch Shopify data. Please check your connection.",
       debugInfo: {
         authSuccess: false,
         productsCount: 0,
         collectionsCount: 0,
         productsFromShopify: false,
         collectionsFromShopify: false,
         fallbackUsed: true,
         error: error instanceof Error ? error.message : 'Unknown error',
         timestamp: new Date().toISOString()
       }
     });
   }
 };

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  console.log("🎯 ACTION CALLED:", intent);
  console.log("🔍 FORM DATA KEYS:", Array.from(formData.keys()));
  console.log("🔍 SHOP:", shop);
  
  if (intent === "save-template") {
    const templateName = formData.get("templateName") as string;
    const templateId = formData.get("templateId") as string;
    const pageComponentsJson = formData.get("pageComponents") as string;
    
    console.log("💾 SAVING TEMPLATE:", {
      templateName,
      templateId,
      hasComponents: !!pageComponentsJson,
      shop: shop,
      pageComponentsLength: pageComponentsJson ? pageComponentsJson.length : 0
    });
    
    if (pageComponentsJson) {
      try {
        const parsed = JSON.parse(pageComponentsJson);
        console.log("📝 PARSED COMPONENTS:", parsed.length, "components:", parsed);
      } catch (e) {
        console.error("❌ JSON PARSE ERROR:", e);
      }
    }
    
    if (!templateName || !pageComponentsJson) {
      console.error("❌ Missing template name or components");
      return json({ 
        success: false, 
        message: "Missing template name or components" 
      });
    }

    try {
      const pageComponents = JSON.parse(pageComponentsJson);
      console.log("📝 Parsed components:", pageComponents.length);
      
      // Get or create the mobile app for this shop
      let mobileApp = await prisma.mobileApp.findUnique({
        where: { shop: shop }
      });
      
      if (!mobileApp) {
        console.log("📱 Creating new mobile app for shop:", shop);
        mobileApp = await prisma.mobileApp.create({
          data: {
            shop: shop,
            name: `${shop} Mobile App`,
            bundleId: `com.${shop.replace(/[^a-zA-Z0-9]/g, '')}.app`,
            status: 'DRAFT'
          }
        });
      } else {
        console.log("📱 Found existing mobile app:", mobileApp.id);
      }
      
      // Ensure all component definitions exist in database
      for (const comp of pageComponents) {
        const componentDef = componentLibrary.find(c => c.id === comp.componentId);
        if (componentDef) {
          // Check if component definition already exists by name and type
          const existingComponent = await prisma.component.findFirst({
            where: {
              name: componentDef.name,
              type: componentDef.type as any
            }
          });
          
          if (!existingComponent) {
            // Create new component definition (let Prisma auto-generate the ID)
            await prisma.component.create({
              data: {
                name: componentDef.name,
                type: componentDef.type as any,
                category: componentDef.category,
                description: componentDef.description || "",
                config: componentDef.config as any,
                defaultProps: componentDef.defaultProps as any,
                icon: componentDef.icon,
                isActive: true
              }
            });
          }
        }
      }
      
      let savedTemplate;
      
      // If templateId is provided, update existing template
      if (templateId) {
        console.log("🔄 Updating existing template:", templateId);
        
        const existingTemplate = await prisma.appPage.findUnique({
          where: { id: templateId }
        });
        
        if (!existingTemplate) {
          console.error("❌ Template not found:", templateId);
          return json({ 
            success: false, 
            message: "Template not found." 
          });
        }
        
        // Delete existing page components first
        await prisma.pageComponent.deleteMany({
          where: { pageId: templateId }
        });
        
        // Update existing template
        savedTemplate = await prisma.appPage.update({
          where: { id: templateId },
          data: {
            name: templateName,
            updatedAt: new Date()
          }
        });
        
        // Create new page components
        for (let i = 0; i < pageComponents.length; i++) {
          const comp = pageComponents[i];
          const componentDef = componentLibrary.find(c => c.id === comp.componentId);
          if (componentDef) {
            // Find the database component by name and type
            const dbComponent = await prisma.component.findFirst({
              where: {
                name: componentDef.name,
                type: componentDef.type as any
              }
            });
            
            if (dbComponent) {
              await prisma.pageComponent.create({
                data: {
                  pageId: savedTemplate.id,
                  componentId: dbComponent.id, // Use database component ID
                  order: i,
                  props: comp.props || comp.properties || {},
                  styles: {}
                }
              });
            }
          }
        }
        
        // Auto-generate mobile app after updating template
        try {
          console.log("🚀 Auto-generating mobile app...");
          const { execSync } = await import("child_process");
          const generateCommand = `node scripts/generateMobileApp.js ${shop}`;
          execSync(generateCommand, { cwd: process.cwd(), stdio: 'inherit' });
          console.log("✅ Mobile app generated successfully");
        } catch (genError) {
          console.error("⚠️ Mobile app generation failed:", genError);
          // Don't fail the template save if mobile app generation fails
        }

        console.log("✅ Template updated successfully:", savedTemplate.name);
        return json({ 
          success: true, 
          message: `Template "${templateName}" updated successfully! Mobile app updated.`,
          templateId: savedTemplate.id,
          autoGenerated: true
        });
      } else {
        // Create new template
        const slug = templateName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        console.log("📝 Creating new template with slug:", slug);
        
        // Check if template name already exists
        const existingTemplate = await prisma.appPage.findUnique({
          where: {
            appId_slug: {
              appId: mobileApp.id,
              slug: slug
            }
          }
        });

        if (existingTemplate) {
          console.error("❌ Template already exists:", templateName);
          return json({ 
            success: false, 
            message: `Template "${templateName}" already exists. Please choose a different name or update the existing template.` 
          });
        }
        
        // Create new template
        savedTemplate = await prisma.appPage.create({
          data: {
            appId: mobileApp.id,
            name: templateName,
            slug: slug,
            type: 'CUSTOM'
          }
        });
        
        // Create page components
        for (let i = 0; i < pageComponents.length; i++) {
          const comp = pageComponents[i];
          console.log(`🧩 Creating component ${i + 1}/${pageComponents.length}:`, {
            componentId: comp.componentId,
            type: comp.type,
            propsKeys: Object.keys(comp.props || {}),
            propsSize: JSON.stringify(comp.props || {}).length
          });
          
          try {
            const componentDef = componentLibrary.find(c => c.id === comp.componentId);
            if (componentDef) {
              // Find the database component by name and type
              const dbComponent = await prisma.component.findFirst({
                where: {
                  name: componentDef.name,
                  type: componentDef.type as any
                }
              });
              
              if (dbComponent) {
                // Test JSON serialization of props
                const propsJson = JSON.stringify(comp.props || {});
                JSON.parse(propsJson); // Test if it can be parsed back
                
                await prisma.pageComponent.create({
                  data: {
                    pageId: savedTemplate.id,
                    componentId: dbComponent.id, // Use database component ID
                    order: i,
                    props: comp.props || comp.properties || {},
                    styles: {}
                  }
                });
                console.log(`✅ Component ${i + 1} saved successfully`);
              } else {
                console.error(`❌ Database component not found for: ${comp.componentId}`);
              }
            } else {
              console.error(`❌ Component definition not found for: ${comp.componentId}`);
            }
          } catch (compError) {
            console.error(`❌ Failed to save component ${i + 1}:`, compError);
            console.error(`❌ Component props:`, comp.props);
            throw compError;
          }
        }
        
        // Auto-generate mobile app after saving template
        try {
          console.log("🚀 Auto-generating mobile app...");
          const { execSync } = await import("child_process");
          const generateCommand = `node scripts/generateMobileApp.js ${shop}`;
          execSync(generateCommand, { cwd: process.cwd(), stdio: 'inherit' });
          console.log("✅ Mobile app generated successfully");
        } catch (genError) {
          console.error("⚠️ Mobile app generation failed:", genError);
          // Don't fail the template save if mobile app generation fails
        }

        console.log("✅ Template created successfully:", savedTemplate.name);
        return json({ 
          success: true, 
          message: `Template "${templateName}" created successfully! Mobile app updated.`,
          templateId: savedTemplate.id,
          autoGenerated: true
        });
      }
    } catch (error) {
      console.error("❌ Error saving template:", error);
      const errorDetails = error as Error;
      console.error("❌ Error details:", {
        name: errorDetails.name,
        message: errorDetails.message,
        stack: errorDetails.stack,
        cause: (errorDetails as any).cause
      });
      return json({ 
        success: false, 
        message: `Failed to save template: ${errorDetails.message}` 
      });
    }
  }
  
  if (intent === "load-template") {
    const templateId = formData.get("templateId") as string;
    
    console.log("📂 LOADING TEMPLATE:", templateId);
    
    try {
      const template = await prisma.appPage.findUnique({
        where: { id: templateId },
        include: {
          components: {
            include: {
              component: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      });
      
      if (!template) {
        console.error("❌ Template not found:", templateId);
        return json({ success: false, message: "Template not found" });
      }
      
      console.log("📋 Found template with", template.components.length, "components");
      
      const templateData = {
        id: template.id,
        name: template.name,
        components: template.components.map(comp => {
          // Find the component library definition by matching database component name and type
          const componentLibraryDef = componentLibrary.find(c => 
            c.name === comp.component.name && c.type === comp.component.type
          );
          
          return {
            id: generateId(), // Generate new IDs for the loaded components
            componentId: componentLibraryDef?.id || comp.componentId, // Use library ID if found, fallback to database ID
            type: comp.component.type,
            props: comp.props as Record<string, any>,
            order: comp.order
          };
        })
      };
      
      console.log("✅ Template loaded successfully:", template.name);
      return json({ 
        success: true, 
        message: "Template loaded successfully!",
        template: templateData
      });
    } catch (error) {
      console.error("❌ Error loading template:", error);
      return json({ 
        success: false, 
        message: "Failed to load template. Please try again." 
      });
    }
  }
  
  return json({ success: false, message: "Invalid action" });
};

interface PageComponent {
  id: string;
  componentId: string;
  type: string;
  props: Record<string, any>;
  order: number;
}

interface ComponentItemProps {
  component: typeof componentLibrary[0];
  isDragging?: boolean;
}

function ComponentItem({ component, isDragging = false }: ComponentItemProps) {
  return (
    <div
      className={cn(
        "component-item",
        isDragging && "dragging"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{component.icon}</span>
        <div className="flex-1">
          <h4 className="font-medium text-sm">{component.name}</h4>
          <p className="text-xs text-gray-500">{component.description}</p>
        </div>
      </div>
    </div>
  );
}

interface DroppableComponentProps {
  component: PageComponent;
  onSelect: (component: PageComponent) => void;
  isSelected: boolean;
  shopifyProducts: any[];
  shopifyCollections: any[];
  onToggleDrawer?: () => void;
}

function DroppableComponent({ component, onSelect, isSelected, shopifyProducts, shopifyCollections, onToggleDrawer }: DroppableComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: component.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const componentDef = componentLibrary.find(c => c.id === component.componentId);

  // Special styling for header component - no title, no padding, no margins
  if (componentDef?.type === "MOBILE_HEADER") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => onSelect(component)}
        className={cn(
          "cursor-pointer transition-all overflow-hidden",
          isSelected && "ring-2 ring-blue-500",
          isDragging && "opacity-50"
        )}
      >
        {/* Component Preview - Full width, no padding, no margins */}
        <ComponentPreview 
          component={component} 
          shopifyProducts={shopifyProducts || []} 
          shopifyCollections={shopifyCollections || []} 
          onToggleDrawer={onToggleDrawer}
        />
      </div>
    );
  }

  // Default styling for other components
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(component)}
      className={cn(
        "border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 cursor-pointer transition-all",
        isSelected && "border-blue-500 bg-blue-50",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{componentDef?.icon}</span>
          <span className="font-medium">{componentDef?.name}</span>
        </div>
        <div className="text-xs text-gray-500">#{component.order}</div>
      </div>
      
      {/* Component Preview */}
      <div className="mt-3 bg-gray-50 rounded overflow-hidden">
        <ComponentPreview 
          component={component} 
          shopifyProducts={shopifyProducts || []} 
          shopifyCollections={shopifyCollections || []} 
          onToggleDrawer={onToggleDrawer}
        />
      </div>
    </div>
  );
}

function ComponentPreview({ component, shopifyProducts, shopifyCollections, onToggleDrawer }: { 
  component: PageComponent; 
  shopifyProducts: any[]; 
  shopifyCollections: any[];
  onToggleDrawer?: () => void;
}) {
  const componentDef = componentLibrary.find(c => c.id === component.componentId);
  
  if (!componentDef) return <div>Unknown component</div>;

  switch (componentDef.type) {
    case "MOBILE_HEADER":
      // Get component definition for fallbacks
      const headerDef = componentLibrary.find(c => c.id === "mobile-header");
      const getHeaderProp = (propName: string) => {
        const value = component.props[propName] !== undefined ? component.props[propName] : headerDef?.defaultProps[propName];
        // Debug key properties including logo image properties
        if (propName === "logoText" || propName === "showOfferButton" || propName === "showLogoImage" || propName === "logoImage") {
          console.log(`🎨 ComponentPreview - ${propName}:`, {
            componentProps: component.props[propName],
            defaultValue: headerDef?.defaultProps[propName],
            finalValue: value,
            shouldShowImage: component.props["showLogoImage"] && component.props["logoImage"],
            allProps: component.props
          });
        }
        return value;
      };

      return (
        <div 
          className="w-full relative"
          style={{ 
            backgroundColor: getHeaderProp("backgroundColor") || "#4A5568",
            color: getHeaderProp("textColor") || "#FFFFFF"
          }}
        >

          {/* Top header bar */}
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left side - Menu + Offer Button */}
            <div className="flex items-center gap-3">
              {getHeaderProp("showMenuIcon") && (
                <button
                  onClick={() => onToggleDrawer?.()}
                  className="p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12H21M3 6H21M3 18H21" stroke={getHeaderProp("iconColor") || "#FFFFFF"} strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
              {getHeaderProp("showOfferButton") && (
                <div 
                  className="px-3 py-1.5 rounded-full text-white text-sm font-semibold flex items-center gap-2"
                  style={{ 
                    backgroundColor: getHeaderProp("offerButtonColor") || "#FC8181",
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V13M12 8V6C12 5.44772 12.4477 5 13 5H14C14.5523 5 15 5.44772 15 6V8H12ZM12 8H9.5C8.67157 8 8 8.67157 8 9.5C8 10.3284 8.67157 11 9.5 11H12M12 13H14.5C15.3284 13 16 13.6716 16 14.5C16 15.3284 15.3284 16 14.5 16H12M12 13V16M5 12C5 12.5523 5.44772 13 6 13H18C18.5523 13 19 12.5523 19 12C19 11.4477 18.5523 11 18 11H6C5.44772 11 5 11.4477 5 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>{getHeaderProp("offerButtonText") || "50% OFF"}</span>
                </div>
              )}
            </div>

            {/* Center - Logo */}
            <div className="flex items-center justify-center flex-1">
              {getHeaderProp("showLogoImage") && getHeaderProp("logoImage") ? (
                <img
                  src={getHeaderProp("logoImage")}
                  alt="Logo"
                  style={{
                    height: `${getHeaderProp("logoSize") || 40}px`,
                    width: 'auto',
                    maxWidth: '120px',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <span 
                  style={{ 
                    fontSize: `${getHeaderProp("logoSize") || 40}px`, 
                    fontWeight: '700',
                    color: getHeaderProp("logoColor") || "#FFFFFF"
                  }}
                >
                  {getHeaderProp("logoText") || "oe"}
                </span>
              )}
            </div>

            {/* Right side - Icons */}
            <div className="flex items-center gap-4">
              {getHeaderProp("showWishlistIcon") && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04096 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.12087 20.84 4.61V4.61Z" stroke={getHeaderProp("iconColor") || "#FFFFFF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              
              {getHeaderProp("showAccountIcon") && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke={getHeaderProp("iconColor") || "#FFFFFF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke={getHeaderProp("iconColor") || "#FFFFFF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}

              {getHeaderProp("showCartIcon") && (
                <div className="relative">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.4 5.1 16.4H17M17 13V16.4M9 19.5C9.8 19.5 10.5 20.2 10.5 21S9.8 22.5 9 22.5 7.5 21.8 7.5 21 8.2 19.5 9 19.5ZM20 19.5C20.8 19.5 21.5 20.2 21.5 21S20.8 22.5 20 22.5 18.5 21.8 18.5 21 19.2 19.5 20 19.5Z" stroke={getHeaderProp("iconColor") || "#FFFFFF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {getHeaderProp("showCartBadge") && getHeaderProp("cartBadgeCount") > 0 && (
                    <span 
                      className="absolute -top-2 -right-2 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
                      style={{ backgroundColor: getHeaderProp("cartBadgeColor") || "#EF4444", fontSize: '10px' }}
                    >
                      {getHeaderProp("cartBadgeCount") > 99 ? '99+' : getHeaderProp("cartBadgeCount")}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="px-4 pb-3">
            <div className="relative">
              <input
                type="text"
                placeholder={getHeaderProp("searchPlaceholder") || "Free Cash on Delivery"}
                className="w-full px-4 py-2.5 rounded-lg text-sm border-0 outline-none"
                style={{ 
                  backgroundColor: getHeaderProp("searchBackgroundColor") || "#F7FAFC",
                  color: getHeaderProp("searchTextColor") || "#4A5568"
                }}
                readOnly
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Navigation tabs */}
          {getHeaderProp("showNavTabs") && (
            <div 
              className="flex items-center px-2 pb-1"
              style={{ backgroundColor: getHeaderProp("navBackgroundColor") || "#4A5568" }}
            >
              {[
                { 
                  title: getHeaderProp("nav1Title") || "All", 
                  active: getHeaderProp("nav1Active") ?? true
                },
                { 
                  title: getHeaderProp("nav2Title") || "Classic", 
                  active: getHeaderProp("nav2Active") ?? false
                },
                { 
                  title: getHeaderProp("nav3Title") || "Essentials", 
                  active: getHeaderProp("nav3Active") ?? false
                },
                { 
                  title: getHeaderProp("nav4Title") || "Premium", 
                  active: getHeaderProp("nav4Active") ?? false
                }
              ].map((item: any, index: number) => (
                <div key={index} className="flex-1 relative">
                  <div 
                    className="flex items-center justify-center py-3 px-2 text-sm font-medium relative"
                    style={{ 
                      color: item.active ? (getHeaderProp("navActiveColor") || "#FFFFFF") : (getHeaderProp("navTextColor") || "#CBD5E0") 
                    }}
                  >
                    <span>{item.title}</span>
                    
                    {/* Active underline */}
                    {item.active && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: getHeaderProp("navActiveColor") || "#FFFFFF" }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case "BANNER":
      return (
        <div className="relative overflow-hidden w-full">
          <img 
            src={component.props.imageUrl}
            alt="Banner background"
            className="w-full object-cover"
            style={{ height: component.props.height || "200px" }}
          />
          {component.props.overlay && (
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          )}
          <div className="absolute inset-0 flex items-center justify-center text-center text-white p-6">
            <div>
              <h3 className="font-bold text-lg mb-2">{component.props.title}</h3>
              <p className="text-sm mb-3 opacity-90">{component.props.subtitle}</p>
              <button className="px-4 py-2 bg-white text-gray-900 rounded text-sm font-medium hover:bg-gray-100 transition-colors">
                {component.props.buttonText}
              </button>
            </div>
          </div>
        </div>
      );

    case "CAROUSEL":
      let carouselProducts = shopifyProducts.slice(0, 4);
      
      // Use selected data source
      if (component.props.dataSource === "collection" && component.props.collectionId) {
        // In a real app, this would fetch products from the selected collection
        const selectedCollection = shopifyCollections.find(c => c.id === component.props.collectionId);
        if (selectedCollection) {
          carouselProducts = shopifyProducts.slice(0, Math.min(6, selectedCollection.productsCount));
        }
      } else if (component.props.dataSource === "products" && component.props.productIds?.length > 0) {
        carouselProducts = shopifyProducts.filter(p => component.props.productIds.includes(p.id));
      }
      
      // Always ensure we have some products to show
      if (carouselProducts.length === 0) {
        carouselProducts = shopifyProducts.slice(0, 4);
      }
      
      return (
        <div className="w-full p-4">
          {component.props.title && (
            <h3 className="font-bold text-lg mb-3">{component.props.title}</h3>
          )}
          {component.props.dataSource === "collection" && component.props.collectionId && (
            <div className="mb-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md inline-block">
              Collection: {shopifyCollections.find(c => c.id === component.props.collectionId)?.title}
            </div>
          )}
          {component.props.dataSource === "products" && component.props.productIds?.length > 0 && (
            <div className="mb-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md inline-block">
              {component.props.productIds.length} selected product(s)
            </div>
          )}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {carouselProducts.slice(0, component.props.itemsPerView || 2).map((product: any, index: number) => (
              <div key={index} className="flex-shrink-0 w-32">
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <img 
                    src={product.images?.[0]?.url || product.imageUrl}
                    alt={product.title}
                    className="w-full h-24 object-cover"
                  />
                  <div className="p-2">
                    <h4 className="font-medium text-xs truncate">{product.title}</h4>
                    <p className="text-xs text-blue-600 font-semibold mt-1">
                      {formatPrice(product.variants?.[0]?.price?.amount || "0")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "FEATURED_COLLECTION":
      let featuredProducts = shopifyProducts.slice(0, 4);
      
      // Use selected data source
      if (component.props.dataSource === "collection" && component.props.collectionId) {
        const selectedCollection = shopifyCollections.find(c => c.id === component.props.collectionId);
        if (selectedCollection) {
          featuredProducts = shopifyProducts.slice(0, Math.min(component.props.itemsToShow || 4, selectedCollection.productsCount));
        }
      } else if (component.props.dataSource === "specific" && component.props.specificProducts?.length > 0) {
        featuredProducts = shopifyProducts.filter(p => component.props.specificProducts.includes(p.id));
      }
      
      const layout = component.props.layout || "grid";
      
      return (
        <div className="w-full bg-gray-50 p-4">
          <div className="text-center mb-4">
            <h3 className="font-bold text-xl mb-2">{component.props.title}</h3>
            {component.props.description && (
              <p className="text-gray-600 text-sm">{component.props.description}</p>
            )}
          </div>
          
          {/* Data source indicator */}
          {component.props.dataSource === "collection" && component.props.collectionId && (
            <div className="mb-3 flex justify-center">
              <div className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                📦 Collection: {shopifyCollections.find(c => c.id === component.props.collectionId)?.title}
              </div>
            </div>
          )}
          {component.props.dataSource === "specific" && component.props.specificProducts?.length > 0 && (
            <div className="mb-3 flex justify-center">
              <div className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                ✅ {component.props.specificProducts.length} selected product(s)
              </div>
            </div>
          )}
          
          {/* Product display based on layout */}
          {layout === "grid" && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {featuredProducts.slice(0, component.props.itemsToShow || 4).map((product: any, index: number) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <img 
                    src={product.images?.[0]?.url}
                    alt={product.title}
                    className="w-full h-24 object-cover"
                  />
                  <div className="p-2">
                    <h4 className="font-medium text-xs truncate">{product.title}</h4>
                    {component.props.showPrices && (
                      <p className="text-xs text-blue-600 font-semibold mt-1">
                        {formatPrice(product.variants?.[0]?.price?.amount || "0")}
                      </p>
                    )}
                    {component.props.showRatings && (
                      <div className="flex items-center mt-1">
                        <div className="flex text-yellow-400 text-xs">
                          {"★".repeat(4)}{"☆".repeat(1)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {layout === "list" && (
            <div className="space-y-2 mb-4">
              {featuredProducts.slice(0, component.props.itemsToShow || 4).map((product: any, index: number) => (
                <div key={index} className="bg-white rounded-lg p-2 flex items-center space-x-3">
                  <img 
                    src={product.images?.[0]?.url}
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm truncate">{product.title}</h4>
                    {component.props.showPrices && (
                      <p className="text-sm text-blue-600 font-semibold">
                        {formatPrice(product.variants?.[0]?.price?.amount || "0")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {layout === "carousel" && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {featuredProducts.slice(0, component.props.itemsToShow || 4).map((product: any, index: number) => (
                <div key={index} className="flex-shrink-0 w-28 bg-white rounded-lg shadow-sm border overflow-hidden">
                  <img 
                    src={product.images?.[0]?.url}
                    alt={product.title}
                    className="w-full h-20 object-cover"
                  />
                  <div className="p-2">
                    <h4 className="font-medium text-xs truncate">{product.title}</h4>
                    {component.props.showPrices && (
                      <p className="text-xs text-blue-600 font-semibold mt-1">
                        {formatPrice(product.variants?.[0]?.price?.amount || "0")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Action button */}
          {component.props.actionButtonText && (
            <div className="text-center">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                {component.props.actionButtonText}
              </button>
            </div>
          )}
        </div>
      );

    case "PRODUCT_GRID":
      let gridProducts = shopifyProducts.slice(0, 6);
      const columns = component.props.columns || 2;
      
      // Use selected data source
      if (component.props.dataSource === "collection" && component.props.collectionId) {
        // In a real app, this would fetch products from the selected collection
        const selectedCollection = shopifyCollections.find(c => c.id === component.props.collectionId);
        if (selectedCollection) {
          gridProducts = shopifyProducts.slice(0, Math.min(6, selectedCollection.productsCount));
        }
      } else if (component.props.dataSource === "products" && component.props.productIds?.length > 0) {
        gridProducts = shopifyProducts.filter(p => component.props.productIds.includes(p.id));
      }
      
      // Always ensure we have some products to show
      if (gridProducts.length === 0) {
        gridProducts = shopifyProducts.slice(0, 6);
      }
      
      return (
        <div className="w-full p-4">
          {component.props.title && (
            <h3 className="font-bold text-lg mb-3">{component.props.title}</h3>
          )}
          {component.props.dataSource === "collection" && component.props.collectionId && (
            <div className="mb-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md inline-block">
              Collection: {shopifyCollections.find(c => c.id === component.props.collectionId)?.title}
            </div>
          )}
          {component.props.dataSource === "products" && component.props.productIds?.length > 0 && (
            <div className="mb-3 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md inline-block">
              {component.props.productIds.length} selected product(s)
            </div>
          )}
          <div 
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {gridProducts.slice(0, columns * 3).map((product: any, index: number) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <img 
                  src={product.images?.[0]?.url || product.imageUrl}
                  alt={product.title}
                  className="w-full object-cover"
                  style={{ aspectRatio: component.props.aspectRatio?.replace(":", "/") || "1/1" }}
                />
                <div className="p-3">
                  <h4 className="font-medium text-sm truncate">{product.title}</h4>
                  {component.props.showPrice && (
                    <p className="text-sm text-blue-600 font-semibold mt-1">
                      {formatPrice(product.variants?.[0]?.price?.amount || "0")}
                      {product.variants?.[0]?.compareAtPrice && (
                        <span className="text-xs text-gray-400 line-through ml-2">
                          {formatPrice(product.variants[0].compareAtPrice.amount)}
                        </span>
                      )}
                    </p>
                  )}
                  {component.props.showRating && (
                    <div className="flex items-center mt-1">
                      <div className="flex text-yellow-400 text-xs">
                        {"★".repeat(4)}{"☆".repeat(1)}
                      </div>
                      <span className="text-xs text-gray-500 ml-1">(24)</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "COUNTDOWN":
      const endDate = new Date(component.props.endDate);
      const now = new Date();
      const timeDiff = Math.max(0, endDate.getTime() - now.getTime());
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      return (
        <div className="w-full text-center p-4 bg-gradient-to-r from-red-500 to-orange-500 text-white">
          {component.props.title && (
            <h3 className="font-bold text-lg mb-3">{component.props.title}</h3>
          )}
          <div className="flex justify-center gap-4">
            {[
              { value: days, label: "Days" },
              { value: hours, label: "Hours" },
              { value: minutes, label: "Mins" },
              { value: seconds, label: "Secs" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold">{String(item.value).padStart(2, '0')}</div>
                {component.props.showLabels && (
                  <div className="text-xs opacity-80">{item.label}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    
    case "TEXT_BLOCK":
      return (
        <div className="w-full p-4">
          <div 
            className="prose prose-sm max-w-none"
            style={{ 
              textAlign: component.props.textAlign,
              fontSize: component.props.fontSize,
              lineHeight: component.props.lineHeight 
            }}
            dangerouslySetInnerHTML={{ __html: component.props.content }}
          />
        </div>
      );
    
    case "BUTTON":
      return (
        <div className="w-full p-4">
          <button 
            className={cn(
              "rounded font-medium transition-colors inline-flex items-center",
              component.props.variant === "primary" && "bg-blue-600 text-white hover:bg-blue-700",
              component.props.variant === "secondary" && "bg-gray-600 text-white hover:bg-gray-700", 
              component.props.variant === "outline" && "border border-gray-300 text-gray-700 hover:bg-gray-50",
              component.props.variant === "ghost" && "text-blue-600 hover:bg-blue-50",
              component.props.size === "small" && "px-3 py-1 text-sm",
              component.props.size === "medium" && "px-4 py-2",
              component.props.size === "large" && "px-6 py-3 text-lg",
              "w-full justify-center"
            )}
          >
            {component.props.icon && <span className="mr-2">{component.props.icon}</span>}
            {component.props.text}
          </button>
        </div>
      );
    
    case "IMAGE":
      return (
        <div className="w-full">
          <img 
            src={component.props.imageUrl}
            alt={component.props.alt}
            className="w-full"
            style={{
              aspectRatio: component.props.aspectRatio?.replace(":", "/") || "16/9",
              objectFit: component.props.objectFit,
              borderRadius: component.props.borderRadius
            }}
          />
        </div>
      );
    
    case "HERO_SLIDER":
      // Count configured slides
      const slideCount = (component.props.slides?.length || 0) + 
        [component.props.slide1Url, component.props.slide2Url, component.props.slide3Url, component.props.slide4Url, component.props.slide5Url]
        .filter(url => url && url.trim()).length;
      
      return (
        <div className="w-full relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: component.props.height || 250 }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl">🎬</span>
              <p className="text-sm text-gray-600 mt-2">Hero Slider</p>
              <p className="text-xs text-gray-500">{slideCount} slides configured</p>
              {component.props.autoPlay && <p className="text-xs text-gray-500">Auto-play enabled</p>}
            </div>
          </div>
          {component.props.showDots && slideCount > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {Array.from({ length: Math.min(slideCount, 5) }, (_, i) => (
                <div key={i} className={`w-2 h-2 bg-white rounded-full ${i === 0 ? 'opacity-75' : 'opacity-50'}`}></div>
              ))}
            </div>
          )}
          {component.props.showArrows && slideCount > 1 && (
            <>
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded text-sm">‹</div>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded text-sm">›</div>
            </>
          )}
        </div>
      );
    
    case "PRODUCT_DETAIL_PAGE":
      return (
        <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Product Image */}
          <div className="aspect-square bg-gray-100 relative">
            {component.props.productImages && component.props.productImages.length > 0 ? (
              <img 
                src={component.props.productImages[0]} 
                alt={component.props.productTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">🛍️</span>
              </div>
            )}
                         {component.props.showImageIndicators && component.props.productImages && component.props.productImages.length > 1 && (
               <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                 {component.props.productImages.slice(0, 3).map((_: any, i: number) => (
                   <div key={i} className={`w-2 h-2 bg-white rounded-full ${i === 0 ? 'opacity-75' : 'opacity-50'}`}></div>
                 ))}
               </div>
             )}
            {component.props.showStockStatus && (
              <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                component.props.inStock ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {component.props.inStock ? `${component.props.stockQuantity} in stock` : 'Out of stock'}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="p-4 space-y-3">
            {component.props.showVendor && component.props.productVendor && (
              <p className="text-sm text-gray-600 font-medium">{component.props.productVendor}</p>
            )}
            
            <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
              {component.props.productTitle || "Product Title"}
            </h3>
            
            {component.props.showProductType && component.props.productType && (
              <p className="text-sm text-gray-500">{component.props.productType}</p>
            )}
            
                         {component.props.showTags && component.props.productTags && component.props.productTags.length > 0 && (
               <div className="flex flex-wrap gap-1">
                 {component.props.productTags.slice(0, 3).map((tag: any, i: number) => (
                   <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                     {tag}
                   </span>
                 ))}
               </div>
             )}
            
            {/* Price */}
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold" style={{ color: component.props.priceColor }}>
                ${component.props.productPrice || "0.00"}
              </span>
              {component.props.showComparePrice && component.props.compareAtPrice && (
                <>
                  <span className="text-sm line-through" style={{ color: component.props.compareAtPriceColor }}>
                    ${component.props.compareAtPrice}
                  </span>
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                    Save {Math.round(((parseFloat(component.props.compareAtPrice) - parseFloat(component.props.productPrice)) / parseFloat(component.props.compareAtPrice)) * 100)}%
                  </span>
                </>
              )}
            </div>
            
            {/* Quantity Selector Preview */}
            {component.props.showQuantitySelector && component.props.inStock && (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium">Qty:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 border rounded flex items-center justify-center text-sm" style={{ backgroundColor: component.props.quantityButtonColor }}>-</div>
                  <span className="w-8 text-center text-sm">1</span>
                  <div className="w-8 h-8 border rounded flex items-center justify-center text-sm" style={{ backgroundColor: component.props.quantityButtonColor }}>+</div>
                </div>
              </div>
            )}
            
            {/* Add to Cart Button */}
            <button 
              className="w-full py-3 rounded-lg text-white font-medium text-sm"
              style={{ backgroundColor: component.props.inStock ? component.props.addToCartButtonColor : '#CCCCCC' }}
              disabled={!component.props.inStock}
            >
              {component.props.inStock ? component.props.addToCartButtonText : 'Out of Stock'}
            </button>
            
            {/* Description Preview */}
            {component.props.showDescription && component.props.productDescription && (
              <div className="pt-3 border-t border-gray-200">
                <h4 className="font-medium text-sm mb-2">Description</h4>
                <p className="text-sm line-clamp-3" style={{ color: component.props.descriptionColor }}>
                  {component.props.productDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      );

    case "SPACER":
      return (
        <div 
          className="w-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500"
          style={{ height: component.props.height }}
        >
          Spacer ({component.props.height})
        </div>
      );
    
    default:
      return <div className="text-gray-500 text-sm">Component preview not available</div>;
  }
}

interface PropertyEditorProps {
  component: PageComponent | null;
  onUpdate: (componentId: string, props: Record<string, any>) => void;
}

function PropertyEditor({ component, onUpdate }: PropertyEditorProps) {
  const { shopifyProducts, shopifyCollections } = useLoaderData<typeof loader>();
  const [localTextValues, setLocalTextValues] = useState<Record<string, string>>({});
  const [localNumberValues, setLocalNumberValues] = useState<Record<string, string>>({});
  const [localColorValues, setLocalColorValues] = useState<Record<string, string>>({});
  const [localBooleanValues, setLocalBooleanValues] = useState<Record<string, boolean>>({});
  
  // Reset local values when component changes
  useEffect(() => {
    setLocalTextValues({});
    setLocalNumberValues({});
    setLocalColorValues({});
    setLocalBooleanValues({});
  }, [component?.id]);
  
  // Debug: Log what data we're receiving
  console.log("🔍 PropertyEditor - Shopify Products:", shopifyProducts);
  console.log("🔍 PropertyEditor - Shopify Collections:", shopifyCollections);
  console.log("🔍 PropertyEditor - Products count:", shopifyProducts?.length || 0);
  console.log("🔍 PropertyEditor - Collections count:", shopifyCollections?.length || 0);
  
  if (!component) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Select a component to edit its properties</p>
      </div>
    );
  }

  const componentDef = componentLibrary.find(c => c.id === component.componentId);
  
  if (!componentDef) {
    return <div className="p-6">Component definition not found</div>;
  }

  const handlePropertyChange = (propertyName: string, value: any) => {
    console.log("🔧 PropertyEditor - Property Change:", {
      componentId: component.id,
      componentType: component.componentId,
      propertyName,
      oldValue: component.props[propertyName],
      newValue: value,
      allProps: component.props,
      isLogoImage: propertyName === 'logoImage'
    });
    
    // Additional debug for logo image
    if (propertyName === 'logoImage') {
      console.log("🖼️ LOGO IMAGE PROPERTY UPDATE:", {
        oldUrl: component.props[propertyName],
        newUrl: value,
        updateData: {
          ...component.props,
          [propertyName]: value
        }
      });
    }
    
    onUpdate(component.id, {
      ...component.props,
      [propertyName]: value
    });
  };

  const handleProductsChange = (productIds: string[]) => {
    handlePropertyChange("productIds", productIds);
  };

  // Helper functions for local text input handling
  const handleTextInputChange = (propertyName: string, value: string) => {
    console.log("📝 Local Text Input Change:", {
      propertyName,
      value,
      componentId: component.id,
      isLogoImage: propertyName === 'logoImage'
    });
    
    // Update local state immediately for responsive UI
    setLocalTextValues(prev => ({ ...prev, [propertyName]: value }));
    
    // Update the actual component props
    handlePropertyChange(propertyName, value);
    
    // Additional debug for logo image
    if (propertyName === 'logoImage') {
      console.log("🖼️ Logo Image URL Set:", {
        url: value,
        willShowPreview: !!value
      });
    }
  };

  const getTextInputValue = (propertyName: string, componentDef: any) => {
    // Use local value if it exists, otherwise use component prop, otherwise use default
    if (localTextValues[propertyName] !== undefined) {
      return localTextValues[propertyName];
    }
    if (component.props[propertyName] !== undefined) {
      return String(component.props[propertyName]);
    }
    return String(componentDef.defaultProps[propertyName] || "");
  };

  // Helper functions for number input handling
  const handleNumberInputChange = (propertyName: string, value: string) => {
    console.log("🔢 Local Number Input Change:", {
      propertyName,
      value,
      componentId: component.id
    });
    
    // Update local state immediately for responsive UI
    setLocalNumberValues(prev => ({ ...prev, [propertyName]: value }));
    
    // Update the actual component props with parsed number
    const numValue = value === "" ? undefined : parseInt(value);
    handlePropertyChange(propertyName, numValue);
  };

  const getNumberInputValue = (propertyName: string, componentDef: any) => {
    // Use local value if it exists, otherwise use component prop, otherwise use default
    if (localNumberValues[propertyName] !== undefined) {
      return localNumberValues[propertyName];
    }
    if (component.props[propertyName] !== undefined) {
      return String(component.props[propertyName]);
    }
    return String(componentDef.defaultProps[propertyName] || "");
  };

  // Helper functions for color input handling
  const handleColorInputChange = (propertyName: string, value: string) => {
    console.log("🎨 Local Color Input Change:", {
      propertyName,
      value,
      componentId: component.id
    });
    
    // Update local state immediately for responsive UI
    setLocalColorValues(prev => ({ ...prev, [propertyName]: value }));
    
    // Update the actual component props
    handlePropertyChange(propertyName, value);
  };

  const getColorInputValue = (propertyName: string, componentDef: any) => {
    // Use local value if it exists, otherwise use component prop, otherwise use default
    if (localColorValues[propertyName] !== undefined) {
      return localColorValues[propertyName];
    }
    if (component.props[propertyName] !== undefined) {
      return String(component.props[propertyName]);
    }
    return String(componentDef.defaultProps[propertyName] || "#000000");
  };

  // Helper functions for boolean input handling
  const handleBooleanInputChange = (propertyName: string, value: boolean) => {
    console.log("☑️ Local Boolean Input Change:", {
      propertyName,
      value,
      componentId: component.id
    });
    
    // Update local state immediately for responsive UI
    setLocalBooleanValues(prev => ({ ...prev, [propertyName]: value }));
    
    // Update the actual component props
    handlePropertyChange(propertyName, value);
  };

  const getBooleanInputValue = (propertyName: string, componentDef: any) => {
    // Use local value if it exists, otherwise use component prop, otherwise use default
    if (localBooleanValues[propertyName] !== undefined) {
      return localBooleanValues[propertyName];
    }
    if (component.props[propertyName] !== undefined) {
      return Boolean(component.props[propertyName]);
    }
    return Boolean(componentDef.defaultProps[propertyName] || false);
  };

  // Check if a property should be shown based on conditions
  const shouldShowProperty = (property: any) => {
    if (!property.condition) {
      return true;
    }
    
    const conditionField = property.condition.field;
    const conditionValue = property.condition.value;
    
    // Get current value - check local state first, then component props, then default props
    let currentValue;
    
    // For boolean conditions, check local boolean state first
    if (localBooleanValues[conditionField] !== undefined) {
      currentValue = localBooleanValues[conditionField];
    } else if (component.props[conditionField] !== undefined) {
      currentValue = component.props[conditionField];
    } else {
      currentValue = componentDef.defaultProps[conditionField];
    }
    
    // Debug logging for logoImage property specifically
    if (property.name === "logoImage") {
      console.log("🔍 shouldShowProperty DEBUG for logoImage:", {
        propertyName: property.name,
        conditionField,
        conditionValue,
        currentValue,
        localBooleanValue: localBooleanValues[conditionField],
        componentProps: component.props[conditionField],
        defaultProps: componentDef.defaultProps[conditionField],
        result: currentValue === conditionValue
      });
    }
    
    return currentValue === conditionValue;
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900">
            <span>{componentDef.icon}</span>
            {componentDef.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Configure component properties</p>
        </div>
        
        <div className="p-4 space-y-6">
        
        {componentDef.config.properties.filter(shouldShowProperty).map((property) => (
          <div key={property.name} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              {property.label}
            </label>
            {property.description && (
              <p className="text-xs text-gray-500">{property.description}</p>
            )}
            
            {property.type === "text" && (
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={getTextInputValue(property.name, componentDef)}
                onChange={(e) => handleTextInputChange(property.name, e.target.value)}
                placeholder={`Enter ${property.label.toLowerCase()}...`}
              />
            )}
            
            {property.type === "boolean" && (
              <label className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={getBooleanInputValue(property.name, componentDef)}
                  onChange={(e) => handleBooleanInputChange(property.name, e.target.checked)}
                />
                <span className="ml-3 text-sm text-gray-700 font-medium">Enable {property.label}</span>
              </label>
            )}
            
            {property.type === "select" && (property as any).options && (
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                value={component.props[property.name] || componentDef.defaultProps[property.name] || ""}
                onChange={(e) => handlePropertyChange(property.name, e.target.value)}
              >
                {!component.props[property.name] && !componentDef.defaultProps[property.name] && (
                  <option value="">Select an option</option>
                )}
                {(property as any).options.map((option: string) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            )}

            {property.type === "shopify_collection" && (
              <div>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  value={component.props[property.name] || ""}
                  onChange={(e) => handlePropertyChange(property.name, e.target.value)}
                >
                  <option value="">Select a collection</option>
                  {(shopifyCollections || []).map((collection: any) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.title} ({collection.productsCount} products)
                    </option>
                  ))}
                </select>
                
                {/* Quick Action Buttons */}
                {shopifyCollections && shopifyCollections.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {shopifyCollections.slice(0, 4).map((collection: any, index: number) => (
                      <button
                        key={collection.id}
                        onClick={() => handlePropertyChange(property.name, collection.id)}
                        className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        {collection.title}
                      </button>
                    ))}
                  </div>
                )}
                
                {component.props[property.name] && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm text-blue-900">
                          {shopifyCollections.find((c: any) => c.id === component.props[property.name])?.title}
                        </h4>
                        <p className="text-xs text-blue-700">
                          {shopifyCollections.find((c: any) => c.id === component.props[property.name])?.productsCount} products
                        </p>
                      </div>
                      <button
                        onClick={() => handlePropertyChange(property.name, "")}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {property.type === "shopify_products" && (
              <div>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                  {(shopifyProducts || []).map((product: any) => (
                    <label key={product.id} className="flex items-center p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                        checked={(component.props[property.name] || []).includes(product.id)}
                        onChange={(e) => {
                          const currentIds = component.props[property.name] || [];
                          const newIds = e.target.checked
                            ? [...currentIds, product.id]
                            : currentIds.filter((id: string) => id !== product.id);
                          handleProductsChange(newIds);
                        }}
                      />
                      <div className="flex items-center space-x-3 flex-1">
                        <img 
                          src={product.images[0]?.url} 
                          alt={product.title}
                          className="w-8 h-8 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{product.title}</div>
                          <div className="text-xs text-blue-600">{formatPrice(product.variants[0]?.price?.amount || "0", product.variants[0]?.price?.currencyCode)}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {(component.props[property.name] || []).length} product(s) selected
                </div>
              </div>
            )}
            
            {property.type === "number" && (
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={getNumberInputValue(property.name, componentDef)}
                onChange={(e) => handleNumberInputChange(property.name, e.target.value)}
                min={(property as any).min}
                max={(property as any).max}
                placeholder={`Enter ${property.label.toLowerCase()}...`}
              />
            )}
            
            {property.type === "richtext" && (
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows={4}
                value={component.props[property.name] || ""}
                onChange={(e) => handlePropertyChange(property.name, e.target.value)}
                placeholder={`Enter ${property.label.toLowerCase()}...`}
              />
            )}

            {property.type === "color" && (
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    value={getColorInputValue(property.name, componentDef)}
                    onChange={(e) => handleColorInputChange(property.name, e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                    value={getColorInputValue(property.name, componentDef)}
                    onChange={(e) => handleColorInputChange(property.name, e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>
            )}

            {property.type === "shopify_image" && (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={getTextInputValue(property.name, componentDef)}
                    onChange={(e) => handleTextInputChange(property.name, e.target.value)}
                    placeholder="Enter image URL or browse from Shopify..."
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
                    onClick={() => {
                      // Create modal for Shopify image browser
                      const modal = document.createElement('div');
                      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                      modal.innerHTML = `
                        <div class="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                          <div class="flex items-center justify-between mb-4">
                            <h3 class="text-xl font-bold">Browse Shopify Images</h3>
                            <button class="close-modal text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                          </div>
                          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" id="shopify-images">
                            ${(shopifyProducts || []).map((product: any, index: number) => `
                              <div class="image-option relative group cursor-pointer hover:ring-2 hover:ring-blue-500 rounded-lg overflow-hidden" data-url="${product.images[0]?.url}" data-index="${index}">
                                <img 
                                  src="${product.images[0]?.url}" 
                                  alt="${product.title}"
                                  class="w-full h-32 object-cover pointer-events-none"
                                />
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center pointer-events-none">
                                  <span class="text-white font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                                </div>
                                <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 truncate pointer-events-none">
                                  ${product.title}
                                </div>
                              </div>
                            `).join('')}
                          </div>
                        </div>
                      `;
                      
                      document.body.appendChild(modal);
                      
                      // Add click handlers
                      modal.querySelector('.close-modal')?.addEventListener('click', () => {
                        document.body.removeChild(modal);
                      });
                      
                      modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                          document.body.removeChild(modal);
                        }
                      });
                      
                      // Handle image selection
                      modal.querySelectorAll('.image-option').forEach((imageDiv, index) => {
                        imageDiv.addEventListener('click', (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          console.log("🖼️ Modal Image Clicked:", {
                            index,
                            target: e.target,
                            currentTarget: e.currentTarget
                          });
                          
                          const url = (e.currentTarget as HTMLElement).getAttribute('data-url');
                          console.log("🔗 Extracted URL:", url);
                          
                          if (url) {
                            console.log("✅ Setting logo image URL:", url);
                            handleTextInputChange(property.name, url);
                            setTimeout(() => {
                              document.body.removeChild(modal);
                            }, 100);
                          } else {
                            console.error("❌ No URL found on clicked element");
                          }
                        });
                      });
                    }}
                  >
                    📁 Browse Images
                  </button>
                </div>
                
                {getTextInputValue(property.name, componentDef) && (
                  <div className="relative">
                    <img 
                      src={getTextInputValue(property.name, componentDef)} 
                      alt="Selected image"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => handleTextInputChange(property.name, "")}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}

export default function AppBuilder() {
  const loaderData = useLoaderData<typeof loader>();
  const { components, savedTemplates, shopifyProducts, shopifyCollections } = loaderData;
  const fetcher = useFetcher();
  const [pageComponents, setPageComponents] = useState<PageComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<PageComponent | null>(null);
  

  const [activeId, setActiveId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string>("");
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [saveMode, setSaveMode] = useState<"new" | "existing">("new");
  const [selectedExistingTemplate, setSelectedExistingTemplate] = useState<string>("");
  const [previewDevice, setPreviewDevice] = useState<"iphone" | "android">("iphone");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGeneratingAPK, setIsGeneratingAPK] = useState(false);
  const [isLivePreview, setIsLivePreview] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Auto-load the live preview template on component mount
  useEffect(() => {
    const autoLoadTemplate = async () => {
      // Check if we have the live preview template and no components loaded
      if (pageComponents.length === 0 && savedTemplates.length > 0) {
        const livePreviewTemplate = savedTemplates.find((t: any) => t.name === 'live-preview-1751483946613');
        
        if (livePreviewTemplate) {
          console.log('🔄 Auto-loading live preview template:', livePreviewTemplate.name);
          
          const formData = new FormData();
          formData.append("intent", "load-template");
          formData.append("templateId", livePreviewTemplate.id);
          fetcher.submit(formData, { method: "POST" });
        }
      }
    };

    // Small delay to ensure everything is loaded
    const timeout = setTimeout(autoLoadTemplate, 1000);
    return () => clearTimeout(timeout);
  }, [savedTemplates, pageComponents.length, fetcher]);
  
  // Handle drawer toggle
  const handleToggleDrawer = useCallback(() => {
    console.log("🎯 handleToggleDrawer called, current state:", isDrawerOpen);
    setIsDrawerOpen(prev => !prev);
  }, [isDrawerOpen]);
  
  // Handle template loading
  useEffect(() => {
    if (fetcher.data && (fetcher.data as any).success && (fetcher.data as any).template) {
      const template = (fetcher.data as any).template;
      setPageComponents(template.components);
      setSelectedComponent(null);
    }
  }, [fetcher.data]);
  
  // Monitor fetcher state changes
  useEffect(() => {
    console.log("🔍 FETCHER STATE CHANGED:", {
      state: fetcher.state,
      data: fetcher.data,
      hasData: !!fetcher.data,
      dataKeys: fetcher.data ? Object.keys(fetcher.data) : []
    });
  }, [fetcher.state, fetcher.data]);

  // Handle template save success - update templates list without page reload
  useEffect(() => {
    if (fetcher.data && (fetcher.data as any).success && (fetcher.data as any).templateId && !(fetcher.data as any).template) {
      console.log("✅ TEMPLATE SAVE SUCCESS - UPDATING STATE");
      
      // Update saved templates list in state instead of reloading page
      const savedTemplateData = (fetcher.data as any);
      
      // Show success message briefly
      setTimeout(() => {
        // Clear the fetcher data to hide success message
        // Note: This is a simple approach, in production you might want a proper toast system
      }, 3000);
      
    } else if (fetcher.data && !(fetcher.data as any).success) {
      console.error("❌ TEMPLATE SAVE FAILED:", fetcher.data);
      alert(`Template save failed: ${(fetcher.data as any).message || 'Unknown error'}`);
    }
  }, [fetcher.data]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    // If dragging from component library to canvas
    if (over.id === "canvas" && typeof active.id === "string") {
      const componentId = active.id;
      const componentDef = components.find(c => c.id === componentId);
      
      if (componentDef) {
        const newComponent: PageComponent = {
          id: generateId(),
          componentId: componentId,
          type: componentDef.type,
          props: { 
            ...componentDef.defaultProps,
            // Ensure dataSource is explicitly set for product components
            ...(componentDef.type === "CAROUSEL" || componentDef.type === "PRODUCT_GRID" ? { dataSource: "mock" } : {})
          },
          order: pageComponents.length
        };
        
        setPageComponents(prev => [...prev, newComponent]);
      }
    }
    
    // If reordering components in canvas
    if (over.id !== "canvas" && pageComponents.find(c => c.id === active.id)) {
      const oldIndex = pageComponents.findIndex(c => c.id === active.id);
      const newIndex = pageComponents.findIndex(c => c.id === over.id);
      
      if (oldIndex !== newIndex) {
        setPageComponents(prev => arrayMove(prev, oldIndex, newIndex));
      }
    }
    
    setActiveId(null);
  }, [components, pageComponents]);

  // Auto-save function with debouncing
  const autoSave = useCallback(async () => {
    if (!isLivePreview || pageComponents.length === 0) return;
    
    console.log("💾 Auto-saving for live preview...");
    
    try {
      // Use the specific template name for live preview
      const livePreviewTemplateName = "live-preview-1751483946613";
      
      // Check if this template already exists
      const existingTemplate = savedTemplates.find((t: any) => t.name === livePreviewTemplateName);
      
      const formData = new FormData();
      formData.append("intent", "save-template");
      formData.append("templateName", livePreviewTemplateName);
      formData.append("pageComponents", JSON.stringify(pageComponents));
      
      // If template exists, update it instead of creating new one
      if (existingTemplate) {
        formData.append("templateId", existingTemplate.id);
        console.log("🔄 Auto-save: Updating existing template", existingTemplate.id);
      } else {
        console.log("📝 Auto-save: Creating new live preview template");
      }
      
      // Submit without blocking UI
      fetcher.submit(formData, { method: "POST" });
      
      console.log("✅ Auto-save triggered");
    } catch (error) {
      console.error("❌ Auto-save failed:", error);
    }
  }, [isLivePreview, pageComponents, fetcher, savedTemplates]);

  const updateComponentProps = useCallback((componentId: string, props: Record<string, any>) => {
    console.log("🔄 UPDATE COMPONENT PROPS CALLED:", {
      componentId,
      newProps: props,
      propsKeys: Object.keys(props),
      hasLogoText: 'logoText' in props,
      logoTextValue: props.logoText
    });
    
    setPageComponents(prev => {
      const updated = prev.map(comp => {
        if (comp.id === componentId) {
          console.log("🎯 FOUND MATCHING COMPONENT:", {
            oldProps: comp.props,
            newProps: props,
            componentId: comp.componentId,
            type: comp.type
          });
          return { ...comp, props };
        }
        return comp;
      });
      
      console.log("📝 PAGE COMPONENTS AFTER UPDATE:", updated);
      return updated;
    });

    // Trigger auto-save for live preview
    if (isLivePreview) {
      // Clear existing timeout
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
      
      // Set new timeout for debounced auto-save
      const timeout = setTimeout(() => {
        autoSave();
      }, 1000); // 1 second delay
      
      setAutoSaveTimeout(timeout);
    }
  }, [isLivePreview, autoSaveTimeout, autoSave]);

  const deleteComponent = useCallback((componentId: string) => {
    setPageComponents(prev => prev.filter(comp => comp.id !== componentId));
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  }, [selectedComponent]);

  const handleSaveTemplate = useCallback(() => {
    console.log("🔧 HANDLE SAVE TEMPLATE CALLED:", {
      pageComponentsLength: pageComponents.length,
      templateName,
      saveMode,
      selectedExistingTemplate
    });

    if (pageComponents.length === 0) {
      alert("Please add some components to your page before saving");
      return;
    }

    let finalTemplateName = "";
    
    if (saveMode === "existing") {
      if (!selectedExistingTemplate) {
        alert("Please select an existing template to overwrite");
        return;
      }
      const existingTemplate = savedTemplates.find((t: any) => t.id === selectedExistingTemplate);
      finalTemplateName = existingTemplate?.name || "";
    } else {
      if (!templateName.trim()) {
        alert("Please enter a template name");
        return;
      }
      finalTemplateName = templateName;
    }

    console.log("🚀 SUBMITTING TEMPLATE:", {
      finalTemplateName,
      componentCount: pageComponents.length,
      components: pageComponents
    });

    // Debug each component before serialization
    pageComponents.forEach((comp, index) => {
      console.log(`🧩 FRONTEND Component ${index + 1}:`, {
        componentId: comp.componentId,
        type: comp.type,
        propsKeys: Object.keys(comp.props || {}),
        propsPreview: comp.componentId === "header" ? comp.props : "..."
      });
      
      // Test if component props can be JSON serialized
      try {
        const serialized = JSON.stringify(comp.props);
        const parsed = JSON.parse(serialized);
        console.log(`✅ Component ${index + 1} props serialization: OK`);
      } catch (e) {
        console.error(`❌ Component ${index + 1} props serialization failed:`, e);
        console.error(`❌ Problematic props:`, comp.props);
      }
    });

    // Test the entire pageComponents serialization
    try {
      const serializedComponents = JSON.stringify(pageComponents);
      console.log("✅ Full pageComponents serialization: OK", {
        length: serializedComponents.length,
        preview: serializedComponents.substring(0, 200) + "..."
      });
    } catch (e) {
      console.error("❌ Full pageComponents serialization failed:", e);
      console.error("❌ pageComponents:", pageComponents);
      alert("Error: Cannot save template due to serialization issue. Check console for details.");
      return;
    }

    const formData = new FormData();
    formData.append("intent", "save-template");
    formData.append("templateName", finalTemplateName);
    formData.append("pageComponents", JSON.stringify(pageComponents));
    if (saveMode === "existing") {
      formData.append("templateId", selectedExistingTemplate);
    }
    
    console.log("📤 SUBMITTING TO SERVER:", { 
      method: "POST", 
      formDataKeys: Array.from(formData.keys()),
      intent: formData.get("intent")
    });
    
    fetcher.submit(formData, { method: "POST" });
    
    console.log("📤 FETCHER STATE AFTER SUBMIT:", {
      state: fetcher.state,
      data: fetcher.data
    });
    
    setShowSaveDialog(false);
    setTemplateName("");
    setSelectedExistingTemplate("");
    setSaveMode("new");
  }, [templateName, pageComponents, fetcher, saveMode, selectedExistingTemplate, savedTemplates]);

  const clearCanvas = useCallback(() => {
    if (pageComponents.length > 0) {
      if (confirm("Are you sure you want to clear all components? This action cannot be undone.")) {
        setPageComponents([]);
        setSelectedComponent(null);
      }
    }
  }, [pageComponents]);

  const generateAPK = useCallback(async () => {
    if (pageComponents.length === 0) {
      alert("Please add some components to your page before generating APK");
      return;
    }

    setIsGeneratingAPK(true);

    try {
      // Save template first
      console.log("🚀 Starting APK generation process...");
      
      // Create a unique template name for APK generation
      const apkTemplateName = `apk-build-${Date.now()}`;
      
      const formData = new FormData();
      formData.append("intent", "save-template");
      formData.append("templateName", apkTemplateName);
      formData.append("pageComponents", JSON.stringify(pageComponents));
      
      // Submit template save
      fetcher.submit(formData, { method: "POST" });
      
      // Show success message with instructions
      alert(
        "🚀 APK Generation Started!\n\n" +
        "To complete the APK generation:\n\n" +
        "1. Open your terminal\n" +
        "2. Run: npm run mobile:init (first time only)\n" +
        "3. Run: npm run mobile:generate <your-shop-domain>\n" +
        "4. Run: npm run mobile:build <generated-app-path>\n" +
        "5. Run: npm run mobile:test <apk-path>\n\n" +
        "Check the console for detailed instructions!"
      );
      
      console.log("📱 APK Generation Instructions:");
      console.log("1. Initialize React Native template:");
      console.log("   npm run mobile:init");
      console.log("");
      console.log("2. Generate mobile app from your design:");
      console.log("   npm run mobile:generate tryongoeye.myshopify.com");
      console.log("");
      console.log("3. Build APK:");
      console.log("   npm run mobile:build ./generated-apps/<app-folder> debug");
      console.log("");
      console.log("4. Test APK on device:");
      console.log("   npm run mobile:test ./generated-apks/<apk-file> --launch");
      console.log("");
      console.log("🎯 Your template has been saved and is ready for APK generation!");
      
    } catch (error) {
      console.error("❌ Error generating APK:", error);
      alert("Error generating APK. Please check the console for details.");
    } finally {
      setIsGeneratingAPK(false);
    }
  }, [pageComponents, fetcher]);

  const activeComponent = components.find(c => c.id === activeId);



  // Regular Shopify admin layout
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen bg-gray-100">
        {/* Component Library Sidebar */}
        <div className="app-builder-sidebar">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold mb-2">Components</h2>
            <p className="text-sm text-gray-600 mb-4">Drag to add to your app</p>
            
            {/* Saved Templates */}
            {savedTemplates.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Saved Templates</h3>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  onChange={(e) => {
                    if (e.target.value) {
                      const formData = new FormData();
                      formData.append("intent", "load-template");
                      formData.append("templateId", e.target.value);
                      fetcher.submit(formData, { method: "POST" });
                      e.target.value = ""; // Reset dropdown
                    }
                  }}
                >
                  <option value="">Load template...</option>
                  {savedTemplates.map((template: any) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="p-4 space-y-2">
            {Object.entries(
              components.reduce((acc, component) => {
                const category = component.category;
                if (!acc[category]) acc[category] = [];
                acc[category].push(component);
                return acc;
              }, {} as Record<string, typeof components>)
            ).map(([category, categoryComponents]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {category}
                </h3>
                <div className="space-y-2 mb-4">
                  {categoryComponents.map((component) => (
                    <div
                      key={component.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("component", component.id);
                      }}
                    >
                      <ComponentItem component={component} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="app-builder-canvas">
          {/* Top Toolbar */}
          <div className="bg-white border-b border-gray-200 p-3 md:p-4 mb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="text-lg md:text-xl font-bold text-gray-900">App Builder</h1>
                <span className="text-xs md:text-sm text-gray-500">
                  {pageComponents.length} component{pageComponents.length !== 1 ? 's' : ''} • {savedTemplates.length} template{savedTemplates.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Load Template Button */}
                {savedTemplates.length > 0 && (
                  <div className="relative">
                    {pageComponents.length === 0 && savedTemplates.find((t: any) => t.name === 'live-preview-1751483946613') && (
                      <button
                        onClick={() => {
                          const liveTemplate = savedTemplates.find((t: any) => t.name === 'live-preview-1751483946613');
                          if (liveTemplate) {
                            const formData = new FormData();
                            formData.append("intent", "load-template");
                            formData.append("templateId", liveTemplate.id);
                            fetcher.submit(formData, { method: "POST" });
                          }
                        }}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium mr-2"
                      >
                        📂 Load Your Template
                      </button>
                    )}
                    <select 
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[120px] sm:min-w-[140px]"
                      onChange={(e) => {
                        if (e.target.value) {
                          if (pageComponents.length > 0) {
                            if (confirm("Loading a template will replace your current design. Continue?")) {
                              const formData = new FormData();
                              formData.append("intent", "load-template");
                              formData.append("templateId", e.target.value);
                              fetcher.submit(formData, { method: "POST" });
                            }
                          } else {
                            const formData = new FormData();
                            formData.append("intent", "load-template");
                            formData.append("templateId", e.target.value);
                            fetcher.submit(formData, { method: "POST" });
                          }
                          e.target.value = ""; // Reset dropdown
                        }
                      }}
                    >
                      <option value="">
                        <span className="hidden sm:inline">📂 Load Template...</span>
                        <span className="sm:hidden">📂 Load...</span>
                      </option>
                      {savedTemplates.map((template: any) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Preview Device Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewDevice("iphone")}
                    className={cn(
                      "px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap",
                      previewDevice === "iphone" 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <span className="hidden sm:inline">📱 iOS</span>
                    <span className="sm:hidden">📱</span>
                  </button>
                  <button
                    onClick={() => setPreviewDevice("android")}
                    className={cn(
                      "px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap",
                      previewDevice === "android" 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <span className="hidden sm:inline">🤖 Android</span>
                    <span className="sm:hidden">🤖</span>
                  </button>
                </div>
                
                <button
                  onClick={clearCanvas}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                  disabled={pageComponents.length === 0}
                >
                  <span className="hidden sm:inline">🗑️ Clear All</span>
                  <span className="sm:hidden">🗑️</span>
                </button>
                
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 whitespace-nowrap"
                  disabled={pageComponents.length === 0}
                >
                  <span className="hidden sm:inline">💾 Save Template</span>
                  <span className="sm:hidden">💾</span>
                </button>
                
                <button
                  onClick={() => setIsLivePreview(!isLivePreview)}
                  className={cn(
                    "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors font-medium whitespace-nowrap",
                    isLivePreview 
                      ? "bg-green-600 text-white hover:bg-green-700" 
                      : "bg-gray-600 text-white hover:bg-gray-700"
                  )}
                >
                  <span className="hidden sm:inline">
                    {isLivePreview ? '🟢 Live Preview ON' : '⚪ Live Preview OFF'}
                  </span>
                  <span className="sm:hidden">
                    {isLivePreview ? '🟢' : '⚪'}
                  </span>
                </button>

                <button
                  onClick={generateAPK}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 whitespace-nowrap"
                  disabled={pageComponents.length === 0 || isGeneratingAPK}
                >
                  <span className="hidden sm:inline">
                    {isGeneratingAPK ? '🔄 Generating...' : '📱 Generate APK'}
                  </span>
                  <span className="sm:hidden">
                    {isGeneratingAPK ? '🔄' : '📱'}
                  </span>
                </button>


              </div>
            </div>
          </div>



          <div className="max-w-sm mx-auto">
            {/* iPhone Preview */}
            {previewDevice === "iphone" && (
              <div className="relative mx-auto bg-black rounded-[3rem] p-2 shadow-2xl" style={{ width: '320px', height: '680px' }}>
                {/* iPhone Frame */}
                <div className="relative bg-white rounded-[2.5rem] h-full overflow-hidden">
                  
                  {/* Mobile Drawer - positioned at mobile device level */}
                  {isDrawerOpen && (
                    <div 
                      className="absolute inset-0 bg-black bg-opacity-50 z-40"
                      onClick={() => setIsDrawerOpen(false)}
                    />
                  )}
                  
                  <div 
                    className={`absolute top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 shadow-lg ${
                      isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                        <button 
                          onClick={() => setIsDrawerOpen(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      
                      {/* Menu Items */}
                      <nav className="space-y-4">
                        <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2">
                          <span>🏠</span> Home
                        </a>
                        <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2">
                          <span>📦</span> Products
                        </a>
                        <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2">
                          <span>🏷️</span> Categories
                        </a>
                        <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2">
                          <span>🛒</span> Cart
                        </a>
                        <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2">
                          <span>👤</span> Account
                        </a>
                        <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2">
                          <span>📞</span> Contact
                        </a>
                      </nav>
                    </div>
                  </div>
                  {/* Dynamic Island */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-black rounded-full z-10"></div>
                  
                  {/* Status Bar */}
                  <div className="relative pt-4 pb-2 px-6 bg-white">
                    <div className="flex items-center justify-between text-black text-sm font-semibold">
                      <div className="flex items-center space-x-1">
                        <span>9:41</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-black rounded-full"></div>
                          <div className="w-1 h-1 bg-black rounded-full"></div>
                          <div className="w-1 h-1 bg-black rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        </div>
                        <svg className="w-4 h-3" viewBox="0 0 24 24" fill="none">
                          <path d="M2 16h6v2H2v-2zm3.5-4.5L8 14H5.5l-2.5-2.5L5.5 9 8 11.5 5.5 14zm8.5-.5h8v2h-8v-2zm0 4h8v2h-8v-2zm0-8h8v2h-8v-2z" fill="currentColor"/>
                        </svg>
                        <div className="flex items-center">
                          <div className="w-6 h-3 border border-black rounded-sm">
                            <div className="w-4 h-2 bg-green-500 rounded-sm m-0.5"></div>
                          </div>
                          <div className="w-1 h-1 bg-black rounded-sm ml-0.5"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* App Content - Scrollable */}
                  <div 
                    className={cn(
                      "drop-zone h-[calc(100%-5rem)] overflow-y-auto scrollbar-hide bg-gray-50",
                      pageComponents.length === 0 && "empty",
                      activeId && "drag-over"
                    )}
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (pageComponents.length === 0) {
                        const componentId = e.dataTransfer.getData("component");
                        if (componentId) {
                          const componentDef = components.find(c => c.id === componentId);
                          if (componentDef) {
                            const newComponent: PageComponent = {
                              id: generateId(),
                              componentId: componentId,
                              type: componentDef.type,
                              props: { 
                                ...componentDef.defaultProps,
                                ...(componentDef.type === "CAROUSEL" || componentDef.type === "PRODUCT_GRID" ? { dataSource: "mock" } : {})
                              },
                              order: pageComponents.length
                            };
                            setPageComponents(prev => [...prev, newComponent]);
                          }
                        }
                      }
                    }}
                    id="canvas"
                  >
                    <SortableContext 
                      items={pageComponents.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {pageComponents.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">
                          <div className="text-4xl mb-2">📱</div>
                          <p className="mb-2 text-sm">Drag components here</p>
                          <p className="text-xs">iOS app preview</p>
                        </div>
                      ) : (
                        <>
                          {pageComponents.map((component) => (
                            <DroppableComponent
                              key={component.id}
                              component={component}
                              onSelect={setSelectedComponent}
                              isSelected={selectedComponent?.id === component.id}
                              shopifyProducts={shopifyProducts || []}
                              shopifyCollections={shopifyCollections || []}
                              onToggleDrawer={handleToggleDrawer}
                            />
                          ))}
                          
                          <div 
                            className="min-h-[60px] border-2 border-dashed border-gray-300 rounded-lg mx-4 my-4 flex items-center justify-center text-gray-400 text-xs transition-colors hover:border-blue-400 hover:text-blue-500"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const componentId = e.dataTransfer.getData("component");
                              if (componentId) {
                                const componentDef = components.find(c => c.id === componentId);
                                if (componentDef) {
                                  const newComponent: PageComponent = {
                                    id: generateId(),
                                    componentId: componentId,
                                    type: componentDef.type,
                                    props: { 
                                      ...componentDef.defaultProps,
                                      ...(componentDef.type === "CAROUSEL" || componentDef.type === "PRODUCT_GRID" ? { dataSource: "mock" } : {})
                                    },
                                    order: pageComponents.length
                                  };
                                  setPageComponents(prev => [...prev, newComponent]);
                                }
                              }
                            }}
                          >
                            + Drop new component
                          </div>
                        </>
                      )}
                    </SortableContext>
                  </div>
                  
                  {/* Home Indicator */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black rounded-full opacity-60"></div>
                </div>
              </div>
            )}

            {/* Android Preview */}
            {previewDevice === "android" && (
              <div className="relative mx-auto bg-gray-900 rounded-2xl p-1 shadow-2xl" style={{ width: '320px', height: '680px' }}>
                {/* Android Frame */}
                <div className="relative bg-white rounded-xl h-full overflow-hidden">
                
                  {/* Mobile Drawer - positioned at mobile device level */}
                  {isDrawerOpen && (
                    <div 
                      className="absolute inset-0 bg-black bg-opacity-50 z-40"
                      onClick={() => setIsDrawerOpen(false)}
                    />
                  )}
                  
                  <div 
                    className={`absolute top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 shadow-lg ${
                      isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                        <button 
                          onClick={() => setIsDrawerOpen(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      
                      {/* Menu Items */}
                      <nav className="space-y-4">
                        <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2">
                          <span>🏠</span> Home
                        </a>
                        <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2">
                          <span>📦</span> Products
                        </a>
                        <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2">
                          <span>🏷️</span> Categories
                        </a>
                        <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2">
                          <span>🛒</span> Cart
                        </a>
                        <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2">
                          <span>👤</span> Account
                        </a>
                        <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 py-2">
                          <span>📞</span> Contact
                        </a>
                      </nav>
                    </div>
                  </div>
                  {/* Status Bar */}
                  <div className="bg-white px-4 py-2">
                    <div className="flex items-center justify-between text-black text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">12:34</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {/* Signal Bars */}
                        <div className="flex items-end space-x-0.5">
                          <div className="w-1 h-2 bg-black rounded-sm"></div>
                          <div className="w-1 h-3 bg-black rounded-sm"></div>
                          <div className="w-1 h-4 bg-black rounded-sm"></div>
                          <div className="w-1 h-5 bg-black rounded-sm"></div>
                        </div>
                        {/* WiFi */}
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                        </svg>
                        {/* Battery */}
                        <div className="flex items-center">
                          <div className="w-6 h-3 border border-black rounded-sm">
                            <div className="w-4 h-2 bg-green-500 rounded-sm m-0.5"></div>
                          </div>
                          <span className="text-xs ml-1">85</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* App Content - Scrollable */}
                  <div 
                    className={cn(
                      "drop-zone h-[calc(100%-6rem)] overflow-y-auto scrollbar-hide bg-gray-50",
                      pageComponents.length === 0 && "empty",
                      activeId && "drag-over"
                    )}
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (pageComponents.length === 0) {
                        const componentId = e.dataTransfer.getData("component");
                        if (componentId) {
                          const componentDef = components.find(c => c.id === componentId);
                          if (componentDef) {
                            const newComponent: PageComponent = {
                              id: generateId(),
                              componentId: componentId,
                              type: componentDef.type,
                              props: { 
                                ...componentDef.defaultProps,
                                ...(componentDef.type === "CAROUSEL" || componentDef.type === "PRODUCT_GRID" ? { dataSource: "mock" } : {})
                              },
                              order: pageComponents.length
                            };
                            setPageComponents(prev => [...prev, newComponent]);
                          }
                        }
                      }
                    }}
                    id="canvas"
                  >
                    <SortableContext 
                      items={pageComponents.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {pageComponents.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">
                          <div className="text-4xl mb-2">🤖</div>
                          <p className="mb-2 text-sm">Drag components here</p>
                          <p className="text-xs">Android app preview</p>
                        </div>
                      ) : (
                        <>
                          {pageComponents.map((component) => (
                            <DroppableComponent
                              key={component.id}
                              component={component}
                              onSelect={setSelectedComponent}
                              isSelected={selectedComponent?.id === component.id}
                              shopifyProducts={shopifyProducts || []}
                              shopifyCollections={shopifyCollections || []}
                              onToggleDrawer={handleToggleDrawer}
                            />
                          ))}
                          
                          <div 
                            className="min-h-[60px] border-2 border-dashed border-gray-300 rounded-lg mx-4 my-4 flex items-center justify-center text-gray-400 text-xs transition-colors hover:border-blue-400 hover:text-blue-500"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const componentId = e.dataTransfer.getData("component");
                              if (componentId) {
                                const componentDef = components.find(c => c.id === componentId);
                                if (componentDef) {
                                  const newComponent: PageComponent = {
                                    id: generateId(),
                                    componentId: componentId,
                                    type: componentDef.type,
                                    props: { 
                                      ...componentDef.defaultProps,
                                      ...(componentDef.type === "CAROUSEL" || componentDef.type === "PRODUCT_GRID" ? { dataSource: "mock" } : {})
                                    },
                                    order: pageComponents.length
                                  };
                                  setPageComponents(prev => [...prev, newComponent]);
                                }
                              }
                            }}
                          >
                            + Drop new component
                          </div>
                        </>
                      )}
                    </SortableContext>
                  </div>
                  
                  {/* Android Navigation Bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-12 flex items-center justify-around">
                    {/* Back Button */}
                    <button className="p-2">
                      <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                      </svg>
                    </button>
                    
                    {/* Home Button */}
                    <button className="p-2">
                      <div className="w-6 h-6 border-2 border-gray-700 rounded-full bg-white"></div>
                    </button>
                    
                    {/* Recent Apps Button */}
                    <button className="p-2">
                      <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="app-builder-properties">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Properties</h2>
            {selectedComponent && (
              <p className="text-sm text-gray-600 mt-1">
                Editing: {componentLibrary.find(c => c.id === selectedComponent.componentId)?.name}
              </p>
            )}
          </div>
          
          <PropertyEditor 
            component={selectedComponent}
            onUpdate={updateComponentProps}
          />
          
          {selectedComponent && (
            <div className="p-6 border-t space-y-3">
              <button
                onClick={() => {
                  const componentDef = componentLibrary.find(c => c.id === selectedComponent.componentId);
                  if (componentDef) {
                    const componentData = {
                      ...componentDef,
                      props: selectedComponent.props
                    };
                    console.log("Saving component configuration:", componentData);
                    alert(`Component "${componentDef.name}" configuration saved! This would integrate with your component library.`);
                  }
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
              >
                💾 Save Component Configuration
              </button>
              
              <button
                onClick={() => deleteComponent(selectedComponent.id)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                🗑️ Delete Component
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Save Template</h3>
            
            {/* Save Mode Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Save Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSaveMode("new")}
                  className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${
                    saveMode === "new" 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  📄 New Template
                </button>
                {savedTemplates.length > 0 && (
                  <button
                    onClick={() => setSaveMode("existing")}
                    className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${
                      saveMode === "existing" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    💾 Update Existing
                  </button>
                )}
              </div>
            </div>

            {/* New Template Name Input */}
            {saveMode === "new" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template name..."
                  autoFocus
                />
              </div>
            )}

            {/* Existing Template Selection */}
            {saveMode === "existing" && savedTemplates.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template to Update
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedExistingTemplate}
                  onChange={(e) => setSelectedExistingTemplate(e.target.value)}
                >
                  <option value="">Choose existing template...</option>
                  {savedTemplates.map((template: any) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setTemplateName("");
                  setSelectedExistingTemplate("");
                  setSaveMode("new");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={
                  fetcher.state === "submitting" || 
                  (saveMode === "new" && !templateName.trim()) ||
                  (saveMode === "existing" && !selectedExistingTemplate)
                }
              >
                {fetcher.state === "submitting" ? "Saving..." : 
                 saveMode === "new" ? "Create Template" : "Update Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {fetcher.data && (fetcher.data as any).success && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          ✅ {(fetcher.data as any).message}
        </div>
      )}

      <DragOverlay>
        {activeComponent ? (
          <ComponentItem component={activeComponent} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
} 