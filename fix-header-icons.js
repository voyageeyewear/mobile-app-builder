// Simple script to create template with all mobile header icons enabled
async function createFullHeaderTemplate() {
  const timestamp = Date.now();
  
  const completeHeaderProps = {
    logoText: "oe",
    logoSize: 49,
    logoColor: "#FFFFFF",
    logoImage: "https://cdn.shopify.com/s/files/1/0756/1350/3718/files/jpn_christmas_logo_goeye_png_1.png?v=1747214882",
    showLogoImage: true,
    backgroundColor: "#030303",
    iconColor: "#FFFFFF", 
    textColor: "#FFFFFF",
    showOfferButton: true,
    offerButtonText: "50% OFF",
    offerButtonColor: "#FC8181",
    // ALL ICONS ENABLED
    showMenuIcon: true,      // Menu working
    showWishlistIcon: true,  // Wishlist enabled
    showAccountIcon: true,   // Account FIXED
    showCartIcon: true,      // Cart working
    showCartBadge: true,
    cartBadgeCount: 3,
    cartBadgeColor: "#EF4444",
    searchPlaceholder: "Search products...",
    searchBackgroundColor: "#F7FAFC",
    searchTextColor: "#4A5568",
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
    nav4Active: false
  };

  const templateComponents = [
    {
      id: "header-" + timestamp,
      componentId: "mobile-header",
      type: "MOBILE_HEADER",
      props: completeHeaderProps,
      order: 0
    },
    {
      id: "banner-" + timestamp,
      componentId: "banner", 
      type: "BANNER",
      props: {
        imageUrl: "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=800&h=400&fit=crop",
        title: "Complete Mobile Header Demo",
        subtitle: "All icons enabled: Menu, Wishlist, Account, Cart",
        buttonText: "Shop Now",
        buttonLink: "/products",
        overlay: true,
        height: "200px"
      },
      order: 1
    }
  ];

  try {
    console.log('🚀 Creating complete mobile header template...');
    console.log('📱 Will enable ALL 4 icons:');
    console.log('   ☰ Menu Icon: ✅ Enabled');
    console.log('   ♡ Wishlist Icon: ✅ Enabled'); 
    console.log('   👤 Account Icon: ✅ Enabled (FIXED!)');
    console.log('   🛒 Cart Icon: ✅ Enabled');
    
    const templateName = "Complete Header All Icons " + new Date().toLocaleTimeString();
    
    const formData = new URLSearchParams();
    formData.append("intent", "save-template");
    formData.append("templateName", templateName);
    formData.append("pageComponents", JSON.stringify(templateComponents));
    
    const response = await fetch('http://localhost:58809/app/builder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    if (response.ok) {
      console.log('✅ SUCCESS! Complete header template created!');
      console.log('📋 Template name: "' + templateName + '"');
      console.log('🎯 Features enabled:');
      console.log('   🍔 Working menu drawer');
      console.log('   ♡ Wishlist icon'); 
      console.log('   👤 Account icon (NEWLY ENABLED!)');
      console.log('   🛒 Cart with badge (3 items)');
      console.log('   🎁 Offer button (50% OFF)');
      console.log('   🔍 Search bar with rotating placeholders');
      console.log('   📑 Navigation tabs');
      console.log('');
      console.log('📱 Check your live preview - you should now see all 4 icons!');
      console.log('🔄 The mobile app will auto-generate with the new template.');
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to create template:', response.status);
      console.log('Response:', errorText.substring(0, 200) + '...');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the template creation
createFullHeaderTemplate(); 