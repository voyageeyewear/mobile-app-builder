import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, StyleSheet, FlatList, ScrollView, Dimensions } from 'react-native';

const MobileHeader = ({ props, products = [] }) => {
  console.log('🎯 MobileHeader rendering with props:', props);
  console.log('🎯 showMenuIcon:', props?.showMenuIcon);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  const placeholderTexts = [
    "Search products...",
    "Find your style...",
    "Discover new arrivals...",
    "Search by brand...",
    "What are you looking for?",
    "Search eyewear..."
  ];

  // Rotate placeholder text every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Menu drawer functions
  const toggleDrawer = () => {
    console.log('🍔 Toggle drawer - current state:', isDrawerOpen);
    setIsDrawerOpen(prev => !prev);
  };
  
  const handleMenuPress = () => {
    toggleDrawer();
  };

  // Search functions
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.length > 0) {
      const filtered = products.filter(product => 
        product.title.toLowerCase().includes(text.toLowerCase()) ||
        product.vendor.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const selectProduct = (product) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    console.log('Selected product:', product.title);
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchResultItem} 
      onPress={() => selectProduct(item)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.searchResultImage} 
        resizeMode="cover"
      />
      <View style={styles.searchResultContent}>
        <Text style={styles.searchResultTitle}>{item.title}</Text>
        <Text style={styles.searchResultPrice}>${item.price}</Text>
        <Text style={styles.searchResultVendor}>{item.vendor}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Main Header */}
      <View style={[styles.header, { backgroundColor: props.backgroundColor || '#000000' }]}>
        
        {/* Left Side - Menu + Offer Button */}
        <View style={styles.leftSide}>
          {/* Menu Button */}
          {props.showMenuIcon && (
            <TouchableOpacity 
              style={[styles.iconButton, isDrawerOpen && styles.activeButton]} 
              onPress={handleMenuPress}
              activeOpacity={0.6}
              accessible={true}
              accessibilityLabel="Open menu"
              accessibilityRole="button"
            >
              <Text style={[styles.iconText, styles.whiteIcon]}>☰</Text>
            </TouchableOpacity>
          )}
          
          {/* Offer Button */}
          {props.showOfferButton && (
            <TouchableOpacity 
              style={[styles.offerButton, { backgroundColor: props.offerButtonColor || '#FF6B6B' }]}
              activeOpacity={0.8}
            >
              <Text style={styles.offerText}>{props.offerButtonText || 'SALE'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Center - Logo */}
        <View style={styles.logoContainer}>
          {props.showLogoImage && props.logoImage ? (
            <Image 
              source={{ uri: props.logoImage }} 
              style={[styles.logoImage, { 
                width: props.logoSize || 40, 
                height: props.logoSize || 40 
              }]} 
              resizeMode="contain"
            />
          ) : (
            <Text style={[styles.logoText, { 
              color: props.logoColor || '#FFFFFF',
              fontSize: props.logoSize || 20
            }]}>
              {props.logoText || 'LOGO'}
            </Text>
          )}
        </View>

        {/* Right Side - User Action Icons */}
        <View style={styles.rightSide}>
          {/* Wishlist Icon */}
          {props.showWishlistIcon && (
            <TouchableOpacity 
              style={styles.compactIconButton}
              activeOpacity={0.6}
            >
              <Text style={[styles.iconText, styles.whiteIcon]}>♡</Text>
            </TouchableOpacity>
          )}
          
          {/* Account Icon */}
          {props.showAccountIcon && (
            <TouchableOpacity 
              style={styles.compactIconButton}
              activeOpacity={0.6}
            >
              <Text style={[styles.iconText, styles.whiteIcon]}>◎</Text>
            </TouchableOpacity>
          )}
          
          {/* Cart Icon */}
          {props.showCartIcon && (
            <TouchableOpacity 
              style={styles.compactIconButton}
              activeOpacity={0.6}
            >
              <Text style={[styles.iconText, styles.whiteIcon]}>◈</Text>
              {props.showCartBadge && props.cartBadgeCount > 0 && (
                <View style={[styles.cartBadge, { backgroundColor: props.cartBadgeColor || '#FF0000' }]}>
                  <Text style={styles.badgeText}>{props.cartBadgeCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Bar */}
      {props.showSearchBar !== false && (
        <View style={[styles.searchSection, { backgroundColor: props.backgroundColor || '#000000' }]}>
          <View style={styles.searchContainer}>
            <Text style={[styles.searchIcon, { color: props.iconColor || '#FFFFFF' }]}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: props.textColor || '#FFFFFF' }]}
              placeholder={placeholderTexts[placeholderIndex]}
              placeholderTextColor={(props.iconColor || '#FFFFFF') + '70'}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Text style={[styles.clearText, { color: props.iconColor || '#FFFFFF' }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <FlatList
                data={searchResults.slice(0, 5)}
                keyExtractor={(item) => item.id}
                renderItem={renderSearchResult}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {/* No Results */}
          {showSearchResults && searchResults.length === 0 && searchQuery.length > 0 && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No products found for "{searchQuery}"</Text>
            </View>
          )}
        </View>
      )}

      {/* Navigation Tabs */}
      {props.showNavTabs && (
        <View style={[styles.navTabs, { backgroundColor: props.navBackgroundColor || '#111111' }]}>
          {props.nav1Title && (
            <TouchableOpacity style={styles.navTab}>
              <Text style={[styles.navText, { 
                color: props.nav1Active ? (props.navActiveColor || '#FFFFFF') : (props.navTextColor || '#888888') 
              }]}>
                {props.nav1Title}
              </Text>
              {props.nav1Active && (
                <View style={[styles.activeIndicator, { backgroundColor: props.navActiveColor || '#FFFFFF' }]} />
              )}
            </TouchableOpacity>
          )}
          {props.nav2Title && (
            <TouchableOpacity style={styles.navTab}>
              <Text style={[styles.navText, { 
                color: props.nav2Active ? (props.navActiveColor || '#FFFFFF') : (props.navTextColor || '#888888') 
              }]}>
                {props.nav2Title}
              </Text>
              {props.nav2Active && (
                <View style={[styles.activeIndicator, { backgroundColor: props.navActiveColor || '#FFFFFF' }]} />
              )}
            </TouchableOpacity>
          )}
          {props.nav3Title && (
            <TouchableOpacity style={styles.navTab}>
              <Text style={[styles.navText, { 
                color: props.nav3Active ? (props.navActiveColor || '#FFFFFF') : (props.navTextColor || '#888888') 
              }]}>
                {props.nav3Title}
              </Text>
              {props.nav3Active && (
                <View style={[styles.activeIndicator, { backgroundColor: props.navActiveColor || '#FFFFFF' }]} />
              )}
            </TouchableOpacity>
          )}
          {props.nav4Title && (
            <TouchableOpacity style={styles.navTab}>
              <Text style={[styles.navText, { 
                color: props.nav4Active ? (props.navActiveColor || '#FFFFFF') : (props.navTextColor || '#888888') 
              }]}>
                {props.nav4Title}
              </Text>
              {props.nav4Active && (
                <View style={[styles.activeIndicator, { backgroundColor: props.navActiveColor || '#FFFFFF' }]} />
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Menu Drawer */}
      {isDrawerOpen && props.showMenuIcon && (
        <View style={[styles.drawerOverlay, { width: Dimensions.get('window').width, height: Dimensions.get('window').height }] }>
          <TouchableOpacity 
            style={styles.drawerBackdrop}
            onPress={toggleDrawer}
            activeOpacity={1}
          />
          <View style={[styles.drawerContainer, { backgroundColor: props.backgroundColor || '#000000' }]}> 
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <Text style={[styles.drawerTitle, { color: props.logoColor || '#FFFFFF' }]}> 
                {props.drawerTitle || 'Menu'}
              </Text>
              <TouchableOpacity onPress={toggleDrawer} style={styles.closeButton}>
                <Text style={[styles.iconText, { color: props.iconColor || '#FFFFFF' }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Drawer Menu Items */}
            <ScrollView style={styles.drawerMenu}>
              <TouchableOpacity style={styles.menuItem} onPress={toggleDrawer}>
                <Text style={[styles.menuItemText, { color: props.iconColor || '#FFFFFF' }]}>🏠  Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={toggleDrawer}>
                <Text style={[styles.menuItemText, { color: props.iconColor || '#FFFFFF' }]}>📱  Products</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={toggleDrawer}>
                <Text style={[styles.menuItemText, { color: props.iconColor || '#FFFFFF' }]}>📂  Categories</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={toggleDrawer}>
                <Text style={[styles.menuItemText, { color: props.iconColor || '#FFFFFF' }]}>♡  Wishlist</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={toggleDrawer}>
                <Text style={[styles.menuItemText, { color: props.iconColor || '#FFFFFF' }]}>👤  Account</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={toggleDrawer}>
                <Text style={[styles.menuItemText, { color: props.iconColor || '#FFFFFF' }]}>📞  Contact</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={toggleDrawer}>
                <Text style={[styles.menuItemText, { color: props.iconColor || '#FFFFFF' }]}>ℹ️  About</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 2,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 60,
    minHeight: 60,
    pointerEvents: 'box-none',
  },
  
  leftSide: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
  },
  
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    pointerEvents: 'none',
  },
  
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    zIndex: 2,
  },
  
  // Icon Button Styles
  iconButton: {
    padding: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 42,
    minHeight: 42,
    position: 'relative',
  },
  
  compactIconButton: {
    padding: 4,
    marginLeft: 0,
    marginRight: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 38,
    minHeight: 38,
    position: 'relative',
  },
  
  activeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  whiteIcon: {
    color: '#FFFFFF',
  },
  
  // Logo Styles
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  
  logoImage: {
    borderRadius: 4,
  },
  
  // Offer Button Styles
  offerButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 6,
  },
  
  offerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Cart Badge Styles
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Search Styles
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative',
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 36,
  },
  
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: 36,
  },
  
  clearButton: {
    padding: 6,
    marginLeft: 8,
  },
  
  clearText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Search Results Styles
  searchResultsContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  
  searchResultContent: {
    flex: 1,
  },
  
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  
  searchResultPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 2,
  },
  
  searchResultVendor: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  
  noResultsContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  
  noResultsText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 14,
  },
  
  // Navigation Tabs Styles
  navTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  
  navTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  
  navText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '80%',
    height: 2,
    borderRadius: 1,
  },
  
  // Drawer Styles
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 999,
    backgroundColor: 'transparent',
  },
  
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 999,
  },
  
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '75%',
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 1000,
  },
  
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  
  closeButton: {
    padding: 8,
  },
  
  drawerMenu: {
    flex: 1,
    paddingTop: 10,
  },
  
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MobileHeader;
