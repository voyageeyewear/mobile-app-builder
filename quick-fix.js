
// Direct fix for account icon
async function fixAccountIcon() {
  try {
    const response = await fetch('http://localhost:58809/api/live-config/tryongoeye.myshopify.com');
    const config = await response.json();
    
    // Update showAccountIcon to true
    const updatedComponents = config.components.map(comp => {
      if (comp.componentId === 'mobile-header') {
        comp.props.showAccountIcon = true;
        console.log('✅ Account icon enabled!');
      }
      return comp;
    });
    
    console.log('Updated mobile header props:', updatedComponents[0].props);
    console.log('Now you should see: Menu(☰) + Wishlist(♡) + Account(👤) + Cart(🛒)');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAccountIcon();
