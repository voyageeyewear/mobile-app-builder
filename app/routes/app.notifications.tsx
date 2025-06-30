import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { formatDate } from "../lib/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  
  // TODO: Load notification data from database
  const notificationStats = {
    totalSent: 15430,
    deliveryRate: 94.2,
    openRate: 23.1,
    clickRate: 4.7
  };
  
  const notificationTemplates = [
    {
      id: "1",
      name: "Cart Abandonment",
      type: "CART_ABANDONMENT",
      title: "Don't forget your items!",
      body: "You left {{item_count}} items in your cart. Complete your purchase now!",
      isActive: true,
      sentCount: 1250,
      openRate: 28.5,
      createdAt: new Date()
    },
    {
      id: "2",
      name: "Back in Stock",
      type: "BACK_IN_STOCK", 
      title: "{{product_name}} is back!",
      body: "The item you were waiting for is now available. Get it before it's gone!",
      isActive: true,
      sentCount: 856,
      openRate: 35.2,
      createdAt: new Date()
    },
    {
      id: "3",
      name: "Welcome Message",
      type: "CUSTOM",
      title: "Welcome to our app!",
      body: "Thanks for downloading our app. Enjoy exclusive deals and faster checkout!",
      isActive: true,
      sentCount: 2341,
      openRate: 18.7,
      createdAt: new Date()
    }
  ];
  
  const recentNotifications = [
    {
      id: "1",
      template: "Cart Abandonment",
      recipientCount: 145,
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "DELIVERED",
      openRate: 24.1
    },
    {
      id: "2", 
      template: "Flash Sale Alert",
      recipientCount: 1250,
      sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: "DELIVERED",
      openRate: 31.2
    },
    {
      id: "3",
      template: "Back in Stock",
      recipientCount: 89,
      sentAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      status: "DELIVERED", 
      openRate: 42.7
    }
  ];
  
  return json({ 
    notificationStats,
    notificationTemplates,
    recentNotifications
  });
};

export default function Notifications() {
  const { notificationStats, notificationTemplates, recentNotifications } = useLoaderData<typeof loader>();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Push Notifications</h1>
            <p className="text-gray-600">Manage automated notifications and engage your customers</p>
          </div>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            🔔 Create Notification
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sent</p>
              <p className="text-2xl font-bold text-gray-900">{notificationStats.totalSent.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">📤</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivery Rate</p>
              <p className="text-2xl font-bold text-gray-900">{notificationStats.deliveryRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Rate</p>
              <p className="text-2xl font-bold text-gray-900">{notificationStats.openRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">👀</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Click Rate</p>
              <p className="text-2xl font-bold text-gray-900">{notificationStats.clickRate}%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">👆</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Templates */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Templates</h2>
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Template</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Type</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Sent</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Open Rate</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {notificationTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-600">{template.title}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        template.type === 'CART_ABANDONMENT' ? 'bg-orange-100 text-orange-800' :
                        template.type === 'BACK_IN_STOCK' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {template.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-900">{template.sentCount.toLocaleString()}</td>
                    <td className="py-4 px-6 text-gray-900">{template.openRate}%</td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                          Edit
                        </button>
                        <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                          Test
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Automation Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold mb-4">🤖 Automation Rules</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Cart Abandonment</div>
                  <div className="text-sm text-gray-600">Send after 1 hour of inactivity</div>
                </div>
              </div>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white transition-colors">
                Edit
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Back in Stock</div>
                  <div className="text-sm text-gray-600">Notify when wishlist items available</div>
                </div>
              </div>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white transition-colors">
                Edit
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <div>
                  <div className="font-medium">Welcome Series</div>
                  <div className="text-sm text-gray-600">3-part onboarding sequence</div>
                </div>
              </div>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white transition-colors">
                Edit
              </button>
            </div>
          </div>
          
          <button className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            + Add New Rule
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold mb-4">🎯 Targeting Options</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Segmentation</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• New vs returning customers</li>
                <li>• Purchase history</li>
                <li>• Geographic location</li>
                <li>• App usage patterns</li>
              </ul>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Timing</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Time zone optimization</li>
                <li>• Best engagement hours</li>
                <li>• Frequency capping</li>
                <li>• Event-based triggers</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Personalization</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Dynamic product recommendations</li>
                <li>• Personalized offers</li>
                <li>• Name & location merge tags</li>
                <li>• Behavioral triggers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-semibold mb-4">📊 Recent Activity</h3>
        <div className="space-y-4">
          {recentNotifications.map((notification) => (
            <div key={notification.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600">📱</span>
                </div>
                <div>
                  <div className="font-medium">{notification.template}</div>
                                     <div className="text-sm text-gray-600">
                     Sent to {notification.recipientCount.toLocaleString()} users • {formatDate(new Date(notification.sentAt))}
                   </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-medium text-green-600">{notification.openRate}% opened</div>
                <div className="text-sm text-gray-600">{notification.status}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
} 