// Simple script to fix the account icon in the current template
async function fixAccountIcon() {
  try {
    // Get current template
    const response = await fetch('http://localhost:58809/api/live-config/tryongoeye.myshopify.com');
    const config = await response.json();
    
    console.log('📋 Current template:', config.name);
    console.log('🔍 Current account icon setting:', config.components[0].props.showAccountIcon);
    
    // Update the mobile header props
    const updatedComponents = config.components.map(comp => {
      if (comp.componentId === 'mobile-header') {
        return {
          ...comp,
          props: {
            ...comp.props,
            showAccountIcon: true  // ✅ Enable account icon
          }
        };
      }
      return comp;
    });
    
    // Save updated template
    const formData = new URLSearchParams();
    formData.append("intent", "save-template");
    formData.append("templateName", `${config.name} - Account Icon Fixed`);
    formData.append("pageComponents", JSON.stringify(updatedComponents.map((comp, index) => ({
      id: `updated-${Date.now()}-${index}`,
      componentId: comp.componentId,
      type: comp.type,
      props: comp.props,
      order: comp.order
    }))));
    
    const saveResponse = await fetch('http://localhost:58809/app/builder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    if (saveResponse.ok) {
      console.log('✅ Template updated! Account icon should now be visible.');
      console.log('📱 Check your live preview - you should now see:');
      console.log('   🍔 Menu button (hamburger)');
      console.log('   ♡ Wishlist icon');
      console.log('   👤 Account icon (newly enabled!)');
      console.log('   🛒 Cart icon with badge');
    } else {
      console.log('❌ Failed to update template');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
fixAccountIcon(); 