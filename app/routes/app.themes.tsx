import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { themePresets, formatDate } from "../lib/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  
  // TODO: Load saved themes from database
  const savedThemes = [
    {
      id: "1",
      name: "Summer Campaign",
      primaryColor: "#FF6B6B",
      secondaryColor: "#4ECDC4",
      backgroundColor: "#FFFFFF",
      textColor: "#2C3E50",
      fontFamily: "Inter",
      isActive: true,
      createdAt: new Date(),
      scheduledStart: null,
      scheduledEnd: null
    },
    {
      id: "2", 
      name: "Holiday Special",
      primaryColor: "#C0392B",
      secondaryColor: "#27AE60",
      backgroundColor: "#FFFFFF",
      textColor: "#2C3E50",
      fontFamily: "Inter",
      isActive: false,
      createdAt: new Date(),
      scheduledStart: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      scheduledEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  ];
  
  return json({ 
    savedThemes,
    presets: themePresets 
  });
};

export default function Themes() {
  const { savedThemes, presets } = useLoaderData<typeof loader>();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Theme Management</h1>
            <p className="text-gray-600">Create and manage themes for your mobile app</p>
          </div>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            🎨 Create New Theme
          </button>
        </div>
      </div>

      {/* Active Theme */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Active Theme</h2>
        {savedThemes.find(theme => theme.isActive) ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: savedThemes.find(theme => theme.isActive)?.primaryColor }}
                />
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: savedThemes.find(theme => theme.isActive)?.secondaryColor }}
                />
              </div>
              <div>
                <h3 className="font-semibold">{savedThemes.find(theme => theme.isActive)?.name}</h3>
                <p className="text-sm text-gray-600">
                  Font: {savedThemes.find(theme => theme.isActive)?.fontFamily}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              🟢 Active
            </span>
          </div>
        ) : (
          <p className="text-gray-500">No active theme selected</p>
        )}
      </div>

      {/* Saved Themes */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Themes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedThemes.map((theme) => (
            <div key={theme.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{theme.name}</h3>
                {theme.isActive && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    Active
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-20">Colors:</span>
                  <div className="flex gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: theme.primaryColor }}
                      title="Primary Color"
                    />
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: theme.secondaryColor }}
                      title="Secondary Color"
                    />
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: theme.backgroundColor }}
                      title="Background Color"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-20">Font:</span>
                  <span className="text-sm font-medium" style={{ fontFamily: theme.fontFamily }}>
                    {theme.fontFamily}
                  </span>
                </div>
                
                {theme.scheduledStart && (
                  <div className="text-xs text-gray-500">
                    📅 Scheduled: {formatDate(new Date(theme.scheduledStart))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                  Edit
                </button>
                {!theme.isActive && (
                  <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Theme Presets */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Theme Presets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {presets.map((preset) => (
            <div key={preset.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">{preset.name}</h3>
                <div className="flex gap-2 mb-3">
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: preset.primaryColor }}
                    title="Primary Color"
                  />
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: preset.secondaryColor }}
                    title="Secondary Color"
                  />
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: preset.backgroundColor }}
                    title="Background Color"
                  />
                </div>
                <p className="text-sm text-gray-600" style={{ fontFamily: preset.fontFamily }}>
                  {preset.fontFamily} Font
                </p>
              </div>
              
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                Use This Preset
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Theme Scheduling */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">🗓️ Theme Scheduling</h2>
        <p className="text-gray-600 mb-4">
          Schedule themes for special events like holidays, sales, or seasonal campaigns.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Upcoming Scheduled Themes</h3>
            {savedThemes.filter(theme => theme.scheduledStart).length > 0 ? (
              savedThemes
                .filter(theme => theme.scheduledStart)
                .map(theme => (
                  <div key={theme.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{theme.name}</div>
                      <div className="text-sm text-gray-600">
                        Starts: {theme.scheduledStart && formatDate(new Date(theme.scheduledStart))}
                      </div>
                    </div>
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white transition-colors">
                      Edit
                    </button>
                  </div>
                ))
            ) : (
              <p className="text-gray-500 text-sm">No scheduled themes</p>
            )}
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Schedule</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                🎄 Christmas Theme (Dec 1-26)
              </button>
              <button className="w-full text-left p-3 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                🎃 Halloween Theme (Oct 15-31)
              </button>
              <button className="w-full text-left p-3 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                💝 Valentine's Theme (Feb 1-14)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 