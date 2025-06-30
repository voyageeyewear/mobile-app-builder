import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { formatDate } from "../lib/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  
  // TODO: Load analytics data from database
  const analyticsData = {
    overview: {
      totalUsers: 12543,
      activeUsers: 3842,
      sessions: 8761,
      avgSessionDuration: "4m 32s",
      conversionRate: 3.4,
      revenue: 45230
    },
    userStats: {
      newUsers: 1245,
      returningUsers: 2597,
      retention24h: 85.2,
      retention7d: 42.1,
      retention30d: 18.5
    },
    popularScreens: [
      { name: "Home", views: 15420, avgTime: "2m 14s", bounceRate: 24.1 },
      { name: "Product Listing", views: 12180, avgTime: "3m 45s", bounceRate: 31.2 },
      { name: "Product Detail", views: 8750, avgTime: "2m 58s", bounceRate: 18.7 },
      { name: "Cart", views: 4320, avgTime: "1m 23s", bounceRate: 45.2 },
      { name: "Checkout", views: 2140, avgTime: "4m 12s", bounceRate: 25.8 }
    ],
    conversionFunnel: [
      { step: "App Opens", users: 12543, percentage: 100 },
      { step: "Product Views", users: 8750, percentage: 69.8 },
      { step: "Add to Cart", users: 4320, percentage: 34.4 },
      { step: "Checkout Started", users: 2140, percentage: 17.1 },
      { step: "Purchase Completed", users: 426, percentage: 3.4 }
    ],
    topProducts: [
      { name: "Wireless Headphones", views: 2340, sales: 156, revenue: 15600 },
      { name: "Smart Watch", views: 1890, sales: 89, revenue: 22250 },
      { name: "Phone Case", views: 1650, sales: 234, revenue: 4680 },
      { name: "Bluetooth Speaker", views: 1420, sales: 67, revenue: 6030 },
      { name: "Laptop Stand", views: 1180, sales: 45, revenue: 2250 }
    ],
    recentEvents: [
      {
        id: "1",
        type: "PURCHASE",
        user: "Anonymous User",
        amount: 149.99,
        product: "Wireless Headphones",
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: "2", 
        type: "ADD_TO_CART",
        user: "Customer #1234",
        product: "Smart Watch",
        timestamp: new Date(Date.now() - 45 * 60 * 1000)
      },
      {
        id: "3",
        type: "APP_OPEN",
        user: "New User",
        timestamp: new Date(Date.now() - 60 * 60 * 1000)
      }
    ]
  };
  
  return json(analyticsData);
};

export default function Analytics() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Track your mobile app performance and user behavior</p>
          </div>
          <div className="flex gap-3">
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              📊 Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.totalUsers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.activeUsers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">🟢</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.sessions.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">📱</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Session</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.avgSessionDuration}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.conversionRate}%</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${data.overview.revenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* User Retention */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold mb-6">📈 User Retention</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">24 Hour Retention</span>
              <span className="font-semibold">{data.userStats.retention24h}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${data.userStats.retention24h}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">7 Day Retention</span>
              <span className="font-semibold">{data.userStats.retention7d}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${data.userStats.retention7d}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">30 Day Retention</span>
              <span className="font-semibold">{data.userStats.retention30d}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: `${data.userStats.retention30d}%` }}
              />
            </div>
          </div>
        </div>

        {/* User Types */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold mb-6">👤 User Types</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">New Users</span>
              </div>
              <span className="font-semibold text-lg">{data.userStats.newUsers.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Returning Users</span>
              </div>
              <span className="font-semibold text-lg">{data.userStats.returningUsers.toLocaleString()}</span>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {Math.round((data.userStats.returningUsers / (data.userStats.newUsers + data.userStats.returningUsers)) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Returning User Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Screens */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📱 Popular Screens</h2>
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Screen</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Views</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Avg Time</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Bounce Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.popularScreens.map((screen, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{screen.name}</td>
                    <td className="py-4 px-6 text-gray-900">{screen.views.toLocaleString()}</td>
                    <td className="py-4 px-6 text-gray-900">{screen.avgTime}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        screen.bounceRate < 30 ? 'bg-green-100 text-green-800' :
                        screen.bounceRate < 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {screen.bounceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Conversion Funnel & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold mb-6">🎯 Conversion Funnel</h3>
          <div className="space-y-4">
            {data.conversionFunnel.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">{step.step}</span>
                  <span className="font-semibold">{step.users.toLocaleString()} ({step.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${
                      index === 0 ? 'bg-blue-600' :
                      index === 1 ? 'bg-green-600' :
                      index === 2 ? 'bg-yellow-600' :
                      index === 3 ? 'bg-orange-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${step.percentage}%` }}
                  />
                </div>
                {index < data.conversionFunnel.length - 1 && (
                  <div className="absolute right-0 top-8 text-xs text-gray-500">
                    {Math.round(((step.users - data.conversionFunnel[index + 1].users) / step.users) * 100)}% drop-off
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold mb-6">🏆 Top Products</h3>
          <div className="space-y-4">
            {data.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-semibold text-blue-600">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.views} views • {product.sales} sales</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">${product.revenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-semibold mb-6">⚡ Real-time Activity</h3>
        <div className="space-y-4">
          {data.recentEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  event.type === 'PURCHASE' ? 'bg-green-100' :
                  event.type === 'ADD_TO_CART' ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  <span className={`text-lg ${
                    event.type === 'PURCHASE' ? 'text-green-600' :
                    event.type === 'ADD_TO_CART' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {event.type === 'PURCHASE' ? '💰' :
                     event.type === 'ADD_TO_CART' ? '🛒' :
                     '📱'}
                  </span>
                </div>
                                 <div>
                   <div className="font-medium">
                     {event.type === 'PURCHASE' && `${event.user} purchased ${(event as any).product}`}
                     {event.type === 'ADD_TO_CART' && `${event.user} added ${(event as any).product} to cart`}
                     {event.type === 'APP_OPEN' && `${event.user} opened the app`}
                   </div>
                   <div className="text-sm text-gray-600">
                     {formatDate(new Date(event.timestamp))}
                   </div>
                 </div>
               </div>
               
               {(event as any).amount && (
                 <div className="text-right">
                   <div className="font-semibold text-green-600">${(event as any).amount}</div>
                 </div>
               )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            View All Events
          </button>
        </div>
      </div>
    </div>
  );
} 