import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("🚀 DEV BUILDER LOADER - Starting...");
  return json({
    shop: "tryongoeye.myshopify.com",
    mobileAppUrl: "http://localhost:3001",
    builderUrl: "http://localhost:50750/app/builder"
  });
};

export default function DevBuilder() {
  const { shop, mobileAppUrl, builderUrl } = useLoaderData<typeof loader>();

  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif', 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      lineHeight: '1.6'
    }}>
      <h1 style={{ color: '#2563eb', marginBottom: '1rem' }}>
        📱 Development App Builder
      </h1>
      
      <div style={{ 
        background: '#dcfce7', 
        border: '1px solid #16a34a', 
        borderRadius: '8px', 
        padding: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#15803d' }}>✅ Development Mode Active</h3>
        <p style={{ margin: 0 }}>This bypasses Shopify authentication for local development.</p>
      </div>

      <div style={{ 
        background: '#dbeafe', 
        border: '1px solid #2563eb', 
        borderRadius: '8px', 
        padding: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1d4ed8' }}>📱 Mobile App Preview</h3>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <strong>Shop:</strong> {shop}
        </p>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <strong>Mobile App:</strong> <a href={mobileAppUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>{mobileAppUrl}</a>
        </p>
        <p style={{ margin: 0 }}>
          <strong>Template:</strong> live-preview-1751483946613
        </p>
      </div>

      <div style={{ 
        background: '#f3f4f6', 
        border: '1px solid #6b7280', 
        borderRadius: '8px', 
        padding: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>🎯 Current Status</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>✅ Main Server: Running on port 50750</li>
          <li>✅ Mobile App: Running on port 3001</li>
          <li>✅ Template: live-preview-1751483946613 (4 components)</li>
          <li>✅ Hero Slider: Real TryOnGoEye images working</li>
          <li>✅ Product Detail Pages: Navigation working</li>
        </ul>
      </div>

      <div style={{ 
        background: '#f3f4f6', 
        border: '1px solid #6b7280', 
        borderRadius: '8px', 
        padding: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>🔗 Quick Links</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a 
            href={mobileAppUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              background: '#2563eb', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '6px', 
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            📱 Open Mobile App
          </a>
          <a 
            href={builderUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              background: '#6b7280', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '6px', 
              textDecoration: 'none'
            }}
          >
            🔧 Main Builder (Auth Required)
          </a>
        </div>
      </div>

      <div style={{ 
        background: '#f3f4f6', 
        border: '1px solid #6b7280', 
        borderRadius: '8px', 
        padding: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>📋 Development Instructions</h3>
        <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li><strong>Mobile Preview:</strong> Visit <a href={mobileAppUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>{mobileAppUrl}</a> to see your app</li>
          <li><strong>Edit Template:</strong> Use the main builder at /app/builder (requires Shopify auth)</li>
          <li><strong>Components:</strong> Your template has Header, Hero Slider, Featured Collection, and Product Carousel</li>
          <li><strong>Product Pages:</strong> Click any product to see the detail page with navigation</li>
        </ol>
      </div>

      <div style={{ 
        background: '#f3f4f6', 
        border: '1px solid #6b7280', 
        borderRadius: '8px', 
        padding: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>🛠️ Technical Details</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li><strong>Template ID:</strong> live-preview-1751483946613</li>
          <li><strong>Components:</strong> 4 (mobile-header, hero-slider, featured-collection, carousel)</li>
          <li><strong>Products:</strong> 4 real TryOnGoEye products</li>
          <li><strong>Hero Images:</strong> 4 real store banners from goeye.in</li>
          <li><strong>Auto-save:</strong> Changes save automatically</li>
        </ul>
      </div>

      <div style={{ 
        background: '#fef3c7', 
        border: '1px solid #d97706', 
        borderRadius: '8px', 
        padding: '1rem' 
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>⚠️ Note</h3>
        <p style={{ margin: 0 }}>
          This is a development-only interface. For full builder functionality with component editing, 
          use the main builder route after Shopify authentication.
        </p>
      </div>
    </div>
  );
} 