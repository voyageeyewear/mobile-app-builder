import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const componentLibrary = [
  {
    id: "banner",
    name: "Banner",
    type: "BANNER",
    category: "Layout",
    icon: "🎯",
    description: "Hero banner with image and text overlay",
    defaultProps: {
      imageUrl: "https://via.placeholder.com/400x200",
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
      spacing: "16px"
    },
    config: {
      properties: [
        { name: "title", type: "text", label: "Section Title" },
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
      aspectRatio: "1:1"
    },
    config: {
      properties: [
        { name: "title", type: "text", label: "Section Title" },
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
      imageUrl: "https://via.placeholder.com/400x300",
      alt: "Image description",
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
    id: "button",
    name: "Button",
    type: "BUTTON",
    category: "Interactive",
    icon: "🔘",
    description: "Call-to-action button",
    defaultProps: {
      text: "Click Me",
      link: "/",
      variant: "primary",
      size: "medium",
      fullWidth: false,
      icon: ""
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