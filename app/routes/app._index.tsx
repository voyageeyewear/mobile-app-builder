import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { formatDate } from "../lib/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  
  // Mock data - replace with actual database queries
  const mockData = {
    appStatus: "draft", // draft, published, archived
    totalDownloads: 0,
    activeUsers: 0,
    conversionRate: 0,
    revenue: 0,
    lastUpdated: new Date(),
    recentActivity: [
      { id: 1, action: "App created", timestamp: new Date(), user: "You" },
    ]
  };
  
  return json(mockData);
};

export default function AppIndex() {
  const data = useLoaderData<typeof loader>();

  const quickActions = [
    {
      title: "Design Your App",
      description: "Use our drag-and-drop builder to create your mobile app",
      icon: "🎨",
      link: "/app/builder",
      color: "bg-blue-500"
    },
    {
      title: "Manage Themes",
      description: "Create and customize themes for different seasons",
      icon: "🎭",
      link: "/app/themes",
      color: "bg-purple-500"
    },
    {
      title: "Push Notifications",
      description: "Set up automated notifications for your customers",
      icon: "📱",
      link: "/app/notifications",
      color: "bg-green-500"
    },
    {
      title: "View Analytics",
      description: "Track user engagement and app performance",
      icon: "📊",
      link: "/app/analytics",
      color: "bg-orange-500"
    }
  ];

  const features = [
    {
      title: "🚀 No-Code Builder",
      description: "Create beautiful mobile apps without any coding knowledge using our intuitive drag-and-drop interface."
    },
    {
      title: "📱 Native Performance",
      description: "Generate true native iOS and Android apps that deliver superior performance and user experience."
    },
    {
      title: "🔄 Real-time Sync",
      description: "Automatically sync your Shopify products, inventory, and orders in real-time."
    },
    {
      title: "🔔 Smart Notifications",
      description: "Send personalized push notifications for cart abandonment, promotions, and more."
    },
    {
      title: "🎨 Theme System",
      description: "Create multiple themes and schedule them for different seasons or campaigns."
    },
    {
      title: "📈 Advanced Analytics",
      description: "Track user behavior, conversion rates, and revenue with detailed analytics."
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mobile App Builder</h1>
        <p className="text-gray-600">Create and manage your Shopify mobile app with ease</p>
      </div>

      {/* App Status Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Your Mobile App</h2>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                data.appStatus === 'published' ? 'bg-green-100 text-green-800' :
                data.appStatus === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {data.appStatus === 'published' ? '🟢 Published' :
                 data.appStatus === 'draft' ? '🟡 Draft' : '⚫ Archived'}
              </span>
              <span className="text-sm text-gray-500">
                Last updated: {formatDate(new Date(data.lastUpdated))}
              </span>
            </div>
          </div>
          <Link 
            to="/app/builder"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Open Builder
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalDownloads.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">📥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{data.activeUsers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{data.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${data.revenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}

              className="group block bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <span className="text-2xl">{action.icon}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 Getting Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">1️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">Design Your App</h3>
            <p className="text-sm text-gray-600">Use our drag-and-drop builder to create your app layout and add components</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">2️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">Customize Themes</h3>
            <p className="text-sm text-gray-600">Create beautiful themes that match your brand and schedule them for campaigns</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">3️⃣</span>
            </div>
            <h3 className="font-semibold mb-2">Publish & Monitor</h3>
            <p className="text-sm text-gray-600">Deploy your app and track performance with our analytics dashboard</p>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <Link 
            to="/app/builder"
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start Building Your App
            <span className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
