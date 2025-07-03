#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTemplateSync() {
  console.log('🔧 Cleaning up templates and keeping only live-preview-1751483946613...');
  
  try {
    // Find the shop's mobile app
    const shop = 'tryongoeye.myshopify.com';
    
    let mobileApp = await prisma.mobileApp.findUnique({
      where: { shop: shop },
      include: {
        pages: {
          include: {
            components: {
              include: {
                component: true
              }
            }
          }
        }
      }
    });

    if (!mobileApp) {
      console.log('📱 Creating mobile app for shop:', shop);
      mobileApp = await prisma.mobileApp.create({
        data: {
          shop: shop,
          name: `${shop} Mobile App`,
          bundleId: `com.${shop.replace(/[^a-zA-Z0-9]/g, '')}.app`,
          status: 'DRAFT'
        }
      });
    }

    // Get all templates for this mobile app
    const allTemplates = await prisma.appPage.findMany({
      where: {
        appId: mobileApp.id
      }
    });

    console.log(`📋 Found ${allTemplates.length} total templates`);

    // Find the target template
    const targetTemplateName = 'live-preview-1751483946613';
    const targetTemplate = allTemplates.find(template => template.name === targetTemplateName);

    if (!targetTemplate) {
      console.log('❌ Target template not found. Creating it...');
      
      // Create the target template
      const newTemplate = await prisma.appPage.create({
        data: {
          appId: mobileApp.id,
          name: targetTemplateName,
          slug: targetTemplateName.toLowerCase(),
          type: 'CUSTOM'
        }
      });

      // Add default components
      await createDefaultComponents(newTemplate.id);
      console.log('✅ Created target template with default components');
    } else {
      console.log('✅ Target template found:', targetTemplate.name);
    }

    // Delete all other templates
    const templatesToDelete = allTemplates.filter(template => template.name !== targetTemplateName);
    
    if (templatesToDelete.length > 0) {
      console.log(`🗑️ Deleting ${templatesToDelete.length} other templates...`);
      
      for (const template of templatesToDelete) {
        // Delete page components first
        await prisma.pageComponent.deleteMany({
          where: { pageId: template.id }
        });
        
        // Delete the template
        await prisma.appPage.delete({
          where: { id: template.id }
        });
        
        console.log(`🗑️ Deleted template: ${template.name}`);
      }
    }

    // Verify final state
    const remainingTemplates = await prisma.appPage.findMany({
      where: { appId: mobileApp.id },
      include: {
        components: {
          include: {
            component: true
          }
        }
      }
    });

    console.log(`🎉 Cleanup complete! Remaining templates: ${remainingTemplates.length}`);
    remainingTemplates.forEach(template => {
      console.log(`  ✅ ${template.name} (${template.components.length} components)`);
    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createDefaultComponents(templateId) {
  // Ensure component definitions exist
  const componentDefinitions = [
    {
      name: 'Mobile Header',
      type: 'MOBILE_HEADER',
      category: 'Layout',
      description: 'Mobile app header with logo and navigation',
      config: {},
      defaultProps: {
        logoText: 'TryOnGoEye',
        showCartIcon: true,
        cartItemCount: 2,
        backgroundColor: '#1f2937',
        textColor: '#ffffff'
      }
    },
    {
      name: 'Hero Slider',
      type: 'HERO_SLIDER', 
      category: 'Content',
      description: 'Hero banner with slider functionality',
      config: {},
      defaultProps: {
        title: 'Summer Collection',
        description: 'Slide content will appear here',
        height: '200px',
        backgroundColor: '#f3f4f6'
      }
    },
    {
      name: 'Featured Collection',
      type: 'FEATURED_COLLECTION',
      category: 'E-commerce',
      description: 'Display featured products from a collection',
      config: {},
      defaultProps: {
        title: 'Featured Collection',
        layout: 'grid',
        itemsToShow: 4
      }
    },
    {
      name: 'Product Carousel',
      type: 'PRODUCT_CAROUSEL',
      category: 'E-commerce', 
      description: 'Horizontal scrolling product carousel',
      config: {},
      defaultProps: {
        title: 'Trending Products',
        itemsPerView: 2
      }
    }
  ];

  // Create component definitions if they don't exist
  for (const compDef of componentDefinitions) {
    let component = await prisma.component.findFirst({
      where: {
        name: compDef.name,
        type: compDef.type
      }
    });

    if (!component) {
      component = await prisma.component.create({
        data: {
          name: compDef.name,
          type: compDef.type,
          category: compDef.category,
          description: compDef.description,
          config: compDef.config,
          defaultProps: compDef.defaultProps,
          icon: '📱',
          isActive: true
        }
      });
      console.log('✅ Created component definition:', compDef.name);
    }

    // Create page component
    await prisma.pageComponent.create({
      data: {
        pageId: templateId,
        componentId: component.id,
        order: componentDefinitions.indexOf(compDef),
        props: compDef.defaultProps,
        styles: {}
      }
    });
    console.log('✅ Added component to template:', compDef.name);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  fixTemplateSync();
}

export { fixTemplateSync }; 