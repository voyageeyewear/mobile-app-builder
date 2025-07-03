// Using built-in fetch (Node.js 18+)

async function createCompleteTemplate() {
  const templateData = [
    {
      id: `comp-${Date.now()}-1`,
      componentId: "mobile-header",
      type: "MOBILE_HEADER",
      props: {
        // Logo Configuration
        logoText: "oe",
        logoSize: 49,
        logoColor: "#FFFFFF",
        logoImage: "https://cdn.shopify.com/s/files/1/0756/1350/3718/files/jpn_christmas_logo_goeye_png_1.png?v=1747214882",
        showLogoImage: true,
        
        // Header Colors
        backgroundColor: "#030303",
        iconColor: "#FFFFFF",
        textColor: "#FFFFFF",
        
        // Offer Button (NEW)
        showOfferButton: true,
        offerButtonText: "50% OFF",
        offerButtonColor: "#FC8181",
        
        // Menu and Icons (ALL ENABLED)
        showMenuIcon: true,
        showWishlistIcon: true,  // ✅ ENABLED
        showAccountIcon: true,   // ✅ ENABLED  
        showCartIcon: true,
        showCartBadge: true,
        cartBadgeCount: 3,
        cartBadgeColor: "#EF4444",
        
        // Search Bar Configuration
        showSearchBar: true,
        searchPlaceholder: "Search products...",
        searchBackgroundColor: "rgba(255,255,255,0.1)",
        searchTextColor: "#FFFFFF",
        searchIconColor: "#FFFFFF80",
        searchPlaceholderColor: "#FFFFFF60",
        searchBorderRadius: 25,
        searchFontSize: 14,
        showSearchClear: true,
        searchClearColor: "#FFFFFF80",
        searchClearBackground: "rgba(255,255,255,0.1)",
        
        // Navigation Tabs
        showNavTabs: true,
        navBackgroundColor: "#050505",
        navTextColor: "#CBD5E0",
        navActiveColor: "#FFFFFF",
        nav1Title: "All",
        nav1Active: true,
        nav2Title: "Classic", 
        nav2Active: false,
        nav3Title: "Essentials",
        nav3Active: false,
        nav4Title: "Premium",
        nav4Active: false,
        
        // Drawer Configuration
        drawerTitle: "Menu",
        drawerItems: [
          { icon: "🏠", title: "Home" },
          { icon: "📱", title: "Products" },
          { icon: "📂", title: "Categories" },
          { icon: "♡", title: "Wishlist" },
          { icon: "👤", title: "Account" },
          { icon: "📞", title: "Contact" },
          { icon: "ℹ️", title: "About" }
        ]
      },
      order: 0
    },
    {
      id: `comp-${Date.now()}-2`,
      componentId: "banner",
      type: "BANNER",
      props: {
        imageUrl: "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=800&h=400&fit=crop",
        title: "Welcome to our store",
        subtitle: "Discover amazing products with full header functionality",
        buttonText: "Shop Now",
        buttonLink: "/products",
        overlay: true,
        height: "200px"
      },
      order: 1
    },
    {
      id: `comp-${Date.now()}-3`,
      componentId: "featured-collection",
      type: "FEATURED_COLLECTION",
      props: {
        title: "Featured Products",
        description: "Check out our best products",
        dataSource: "collection",
        collectionId: "",
        specificProducts: [],
        layout: "grid",
        itemsToShow: 4,
        showPrices: true,
        showRatings: true,
        actionButtonText: "View All",
        actionButtonLink: "/collections/featured"
      },
      order: 2
    }
  ];

  const templateName = `Complete Mobile Header Template - ${new Date().toLocaleString()}`;
  
  try {
    console.log("🚀 Creating comprehensive mobile header template...");
    console.log("📋 Template components:", templateData.length);
    console.log("🎯 Mobile Header props:", Object.keys(templateData[0].props).length, "properties");
    
    const formData = new URLSearchParams();
    formData.append("intent", "save-template");
    formData.append("templateName", templateName);
    formData.append("pageComponents", JSON.stringify(templateData));
    
    const response = await fetch('http://localhost:58809/app/builder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log("✅ Template created successfully!");
      console.log("📱 Result:", result);
      console.log("🔄 Mobile app should auto-generate with all header features enabled");
      
      console.log("\n🎯 Enabled Features:");
      console.log("✅ Menu Drawer with 7 navigation items");
      console.log("✅ Logo Image + Text");
      console.log("✅ Offer Button (50% OFF)");
      console.log("✅ Wishlist Icon");
      console.log("✅ Account Icon");
      console.log("✅ Cart Icon with Badge (3 items)");
      console.log("✅ Search Bar with rotating placeholders");
      console.log("✅ Navigation Tabs (All, Classic, Essentials, Premium)");
      
      console.log("\n📱 Check your live preview now - all icons should be visible!");
    } else {
      const errorText = await response.text();
      console.error("❌ Failed to create template:", response.status, errorText);
    }
  } catch (error) {
    console.error("❌ Error creating template:", error);
  }
}

// Run if called directly
createCompleteTemplate(); 