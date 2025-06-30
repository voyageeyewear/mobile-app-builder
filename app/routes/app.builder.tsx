import { useState, useCallback, useEffect } from "react";
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { componentLibrary, generateId, cn } from "../lib/utils";
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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  
  // Load saved templates from database
  const savedTemplates = await prisma.appPage.findMany({
    where: {
      app: {
        shop: shop
      }
    },
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
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  // Transform the data for frontend
  const templatesForFrontend = savedTemplates.map(template => ({
    id: template.id,
    name: template.name,
    createdAt: template.createdAt,
    components: template.components.map(comp => ({
      id: comp.id,
      componentId: comp.componentId,
      type: comp.component.type,
      props: comp.props as Record<string, any>,
      order: comp.order
    }))
  }));
  
  return json({ 
    components: componentLibrary,
    savedTemplates: templatesForFrontend
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  if (intent === "save-template") {
    const templateName = formData.get("templateName") as string;
    const pageComponents = JSON.parse(formData.get("pageComponents") as string);
    
    try {
      // Get or create the mobile app for this shop
      let mobileApp = await prisma.mobileApp.findUnique({
        where: { shop: shop }
      });
      
      if (!mobileApp) {
        mobileApp = await prisma.mobileApp.create({
          data: {
            shop: shop,
            name: `${shop} Mobile App`,
            bundleId: `com.${shop.replace('.', '')}.app`,
            status: 'DRAFT'
          }
        });
      }
      
      // Ensure all component definitions exist in database
      for (const comp of pageComponents) {
        const componentDef = componentLibrary.find(c => c.id === comp.componentId);
        if (componentDef) {
          await prisma.component.upsert({
            where: { id: comp.componentId },
            update: {},
            create: {
              id: comp.componentId,
              name: componentDef.name,
              type: componentDef.type as any,
              category: componentDef.category,
              description: componentDef.description || "",
              config: componentDef.config,
              defaultProps: componentDef.defaultProps,
              icon: componentDef.icon,
              isActive: true
            }
          });
        }
      }
      
      // Create the app page (template)
      const newTemplate = await prisma.appPage.create({
        data: {
          appId: mobileApp.id,
          name: templateName,
          slug: templateName.toLowerCase().replace(/\s+/g, '-'),
          type: 'CUSTOM',
          components: {
            create: pageComponents.map((comp: any, index: number) => ({
              componentId: comp.componentId,
              order: index,
              props: comp.props,
              styles: comp.styles || {}
            }))
          }
        }
      });
      
      return json({ 
        success: true, 
        message: "Template saved successfully!",
        templateId: newTemplate.id
      });
    } catch (error) {
      console.error("Error saving template:", error);
      return json({ 
        success: false, 
        message: "Failed to save template. Please try again." 
      });
    }
  }
  
  if (intent === "load-template") {
    const templateId = formData.get("templateId") as string;
    
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
        return json({ success: false, message: "Template not found" });
      }
      
      const templateData = {
        id: template.id,
        name: template.name,
        components: template.components.map(comp => ({
          id: generateId(), // Generate new IDs for the loaded components
          componentId: comp.componentId,
          type: comp.component.type,
          props: comp.props as Record<string, any>,
          order: comp.order
        }))
      };
      
      return json({ 
        success: true, 
        message: "Template loaded successfully!",
        template: templateData
      });
    } catch (error) {
      console.error("Error loading template:", error);
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
}

function DroppableComponent({ component, onSelect, isSelected }: DroppableComponentProps) {
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
      <div className="mt-3 p-3 bg-gray-50 rounded">
        <ComponentPreview component={component} />
      </div>
    </div>
  );
}

function ComponentPreview({ component }: { component: PageComponent }) {
  const componentDef = componentLibrary.find(c => c.id === component.componentId);
  
  if (!componentDef) return <div>Unknown component</div>;

  switch (componentDef.type) {
    case "BANNER":
      return (
        <div className="relative">
          <div 
            className="w-full rounded bg-gray-200 flex items-center justify-center text-center p-6"
            style={{ height: component.props.height || "200px" }}
          >
            <div>
              <h3 className="font-bold text-lg">{component.props.title}</h3>
              <p className="text-sm text-gray-600">{component.props.subtitle}</p>
              <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded text-sm">
                {component.props.buttonText}
              </button>
            </div>
          </div>
        </div>
      );
    
    case "TEXT_BLOCK":
      return (
        <div 
          className="prose prose-sm"
          style={{ 
            textAlign: component.props.textAlign,
            fontSize: component.props.fontSize,
            lineHeight: component.props.lineHeight 
          }}
          dangerouslySetInnerHTML={{ __html: component.props.content }}
        />
      );
    
    case "BUTTON":
      return (
        <button 
          className={cn(
            "rounded font-medium transition-colors",
            component.props.variant === "primary" && "bg-blue-600 text-white",
            component.props.variant === "secondary" && "bg-gray-600 text-white", 
            component.props.variant === "outline" && "border border-gray-300 text-gray-700",
            component.props.size === "small" && "px-3 py-1 text-sm",
            component.props.size === "medium" && "px-4 py-2",
            component.props.size === "large" && "px-6 py-3 text-lg",
            component.props.fullWidth && "w-full"
          )}
        >
          {component.props.icon && <span className="mr-2">{component.props.icon}</span>}
          {component.props.text}
        </button>
      );
    
    case "IMAGE":
      return (
        <img 
          src={component.props.imageUrl}
          alt={component.props.alt}
          className="w-full"
          style={{
            aspectRatio: component.props.aspectRatio.replace(":", "/"),
            objectFit: component.props.objectFit,
            borderRadius: component.props.borderRadius
          }}
        />
      );
    
    case "SPACER":
      return (
        <div 
          className="bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500"
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
    onUpdate(component.id, {
      ...component.props,
      [propertyName]: value
    });
  };

  return (
    <div className="p-6">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <span>{componentDef.icon}</span>
        {componentDef.name}
      </h3>
      
      <div className="space-y-4">
        {componentDef.config.properties.map((property) => (
          <div key={property.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {property.label}
            </label>
            
            {property.type === "text" && (
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={component.props[property.name] || ""}
                onChange={(e) => handlePropertyChange(property.name, e.target.value)}
              />
            )}
            
            {property.type === "boolean" && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={component.props[property.name] || false}
                  onChange={(e) => handlePropertyChange(property.name, e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-600">Enable</span>
              </label>
            )}
            
            {property.type === "select" && (property as any).options && (
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={component.props[property.name] || ""}
                onChange={(e) => handlePropertyChange(property.name, e.target.value)}
              >
                {(property as any).options.map((option: string) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}
            
            {property.type === "number" && (
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={component.props[property.name] || ""}
                onChange={(e) => handlePropertyChange(property.name, parseInt(e.target.value))}
                min={(property as any).min}
                max={(property as any).max}
              />
            )}
            
            {property.type === "richtext" && (
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={component.props[property.name] || ""}
                onChange={(e) => handlePropertyChange(property.name, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AppBuilder() {
  const { components, savedTemplates } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [pageComponents, setPageComponents] = useState<PageComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<PageComponent | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string>("");
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  
  // Handle template loading
  useEffect(() => {
    if (fetcher.data && (fetcher.data as any).success && (fetcher.data as any).template) {
      const template = (fetcher.data as any).template;
      setPageComponents(template.components);
      setSelectedComponent(null);
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
          props: { ...componentDef.defaultProps },
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

  const updateComponentProps = useCallback((componentId: string, props: Record<string, any>) => {
    setPageComponents(prev => 
      prev.map(comp => 
        comp.id === componentId ? { ...comp, props } : comp
      )
    );
  }, []);

  const deleteComponent = useCallback((componentId: string) => {
    setPageComponents(prev => prev.filter(comp => comp.id !== componentId));
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  }, [selectedComponent]);

  const handleSaveTemplate = useCallback(() => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }

    if (pageComponents.length === 0) {
      alert("Please add some components to your page before saving");
      return;
    }

    const formData = new FormData();
    formData.append("intent", "save-template");
    formData.append("templateName", templateName);
    formData.append("pageComponents", JSON.stringify(pageComponents));
    
    fetcher.submit(formData, { method: "POST" });
    setShowSaveDialog(false);
    setTemplateName("");
  }, [templateName, pageComponents, fetcher]);

  const clearCanvas = useCallback(() => {
    if (pageComponents.length > 0) {
      if (confirm("Are you sure you want to clear all components? This action cannot be undone.")) {
        setPageComponents([]);
        setSelectedComponent(null);
      }
    }
  }, [pageComponents]);

  const activeComponent = components.find(c => c.id === activeId);

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
          <div className="bg-white border-b border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-gray-900">App Builder</h1>
                <span className="text-sm text-gray-500">
                  {pageComponents.length} component{pageComponents.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={clearCanvas}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={pageComponents.length === 0}
                >
                  Clear All
                </button>
                
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  disabled={pageComponents.length === 0}
                >
                  💾 Save Template
                </button>
                
                <button
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                  disabled={pageComponents.length === 0}
                >
                  🚀 Publish App
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-sm mx-auto">
            <div className="preview-device preview-iphone">
              <div className="preview-screen">
                <div className="h-full">
                  {/* Status Bar */}
                  <div className="h-12 bg-black flex items-center justify-center text-white text-sm">
                    9:41 AM
                  </div>
                  
                  {/* App Content */}
                  <div 
                    className={cn(
                      "drop-zone min-h-[calc(100%-3rem)]",
                      activeId && "drag-over"
                    )}
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
                            props: { ...componentDef.defaultProps },
                            order: pageComponents.length
                          };
                          setPageComponents(prev => [...prev, newComponent]);
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
                          <p className="mb-2">Drag components here to start building</p>
                          <p className="text-xs">Your mobile app preview will appear here</p>
                        </div>
                      ) : (
                        pageComponents.map((component) => (
                          <DroppableComponent
                            key={component.id}
                            component={component}
                            onSelect={setSelectedComponent}
                            isSelected={selectedComponent?.id === component.id}
                          />
                        ))
                      )}
                    </SortableContext>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="p-6 border-t">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Save Template</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name
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
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                disabled={fetcher.state === "submitting"}
              >
                {fetcher.state === "submitting" ? "Saving..." : "Save Template"}
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