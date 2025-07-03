import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, SafeAreaView } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const ProductPage = ({ route, navigation, products = [] }) => {
  // Get product ID from navigation params
  const { productId } = route?.params || {};
  
  // Find the product from the products array
  const product = products.find(p => p.id === productId) || {
    id: productId || "sample-product",
    title: "Sample Product",
    description: "This is a sample product description. Add your product details here to showcase features, benefits, and specifications.",
    price: "29.99",
    compareAtPrice: "39.99",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop"
    ],
    vendor: "Sample Brand",
    productType: "Electronics",
    tags: ["featured", "bestseller"],
    variants: [
      {
        id: "variant-1",
        title: "Default",
        price: { amount: "29.99", currencyCode: "USD" },
        compareAtPrice: { amount: "39.99", currencyCode: "USD" }
      }
    ]
  };

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || product);
  const [cartItems, setCartItems] = useState(0);

  // Extract product data
  const productImages = product.images || ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop"];
  const productPrice = selectedVariant.price?.amount || product.price || "0.00";
  const compareAtPrice = selectedVariant.compareAtPrice?.amount || product.compareAtPrice;
  const inStock = true; // You can add stock management logic here
  const stockQuantity = 25; // You can get this from your inventory system

  // Handle add to cart
  const handleAddToCart = () => {
    if (!inStock) return;
    
    setCartItems(prev => prev + quantity);
    
    // Here you would typically integrate with your cart system
    console.log(`Added ${quantity} x ${product.title} to cart`);
    
    // Show success feedback
    alert(`Added ${quantity} x ${product.title} to cart!`);
    
    // Reset quantity after adding to cart
    setQuantity(1);
  };

  // Quantity controls
  const increaseQuantity = () => {
    if (quantity < stockQuantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // Calculate savings
  const savings = compareAtPrice && parseFloat(compareAtPrice) > parseFloat(productPrice) 
    ? (parseFloat(compareAtPrice) - parseFloat(productPrice)).toFixed(2)
    : null;

  const savingsPercentage = savings 
    ? Math.round(((parseFloat(compareAtPrice) - parseFloat(productPrice)) / parseFloat(compareAtPrice)) * 100)
    : null;

  // Format price
  const formatPrice = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.cartButton}>
          <Text style={styles.cartButtonText}>🛒</Text>
          {cartItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View style={styles.imageContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setSelectedImageIndex(index);
            }}
          >
            {productImages.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image 
                  source={{ uri: image }} 
                  style={styles.productImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          {productImages.length > 1 && (
            <View style={styles.imageIndicators}>
              {productImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === selectedImageIndex ? styles.activeIndicator : styles.inactiveIndicator
                  ]}
                />
              ))}
            </View>
          )}

          {/* Stock Badge */}
          <View style={[styles.stockBadge, inStock ? styles.inStockBadge : styles.outOfStockBadge]}>
            <Text style={[styles.stockText, inStock ? styles.inStockText : styles.outOfStockText]}>
              {inStock ? `${stockQuantity} in stock` : 'Out of stock'}
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          {/* Vendor */}
          {product.vendor && (
            <Text style={styles.vendor}>{product.vendor}</Text>
          )}

          {/* Product Title */}
          <Text style={styles.title}>{product.title}</Text>

          {/* Product Type */}
          {product.productType && (
            <Text style={styles.productType}>{product.productType}</Text>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {product.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Price Section */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(productPrice)}</Text>
            {compareAtPrice && (
              <Text style={styles.comparePrice}>
                {formatPrice(compareAtPrice)}
              </Text>
            )}
            {savings && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>Save {formatPrice(savings)} ({savingsPercentage}%)</Text>
              </View>
            )}
          </View>

          {/* Variant Selection (if multiple variants) */}
          {product.variants && product.variants.length > 1 && (
            <View style={styles.variantsSection}>
              <Text style={styles.variantsLabel}>Options:</Text>
              <View style={styles.variantsContainer}>
                {product.variants.map((variant, index) => (
                  <TouchableOpacity
                    key={variant.id}
                    style={[
                      styles.variantButton,
                      selectedVariant.id === variant.id && styles.selectedVariantButton
                    ]}
                    onPress={() => setSelectedVariant(variant)}
                  >
                    <Text style={[
                      styles.variantText,
                      selectedVariant.id === variant.id && styles.selectedVariantText
                    ]}>
                      {variant.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quantity Selector */}
          {inStock && (
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={[styles.quantityButton, { opacity: quantity <= 1 ? 0.5 : 1 }]}
                  onPress={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                
                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityText}>{quantity}</Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.quantityButton, { opacity: quantity >= stockQuantity ? 0.5 : 1 }]}
                  onPress={increaseQuantity}
                  disabled={quantity >= stockQuantity}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Add to Cart Button */}
          <TouchableOpacity 
            style={[
              styles.addToCartButton, 
              { backgroundColor: inStock ? '#007AFF' : '#CCCCCC' }
            ]}
            onPress={handleAddToCart}
            disabled={!inStock}
          >
            <Text style={styles.addToCartText}>
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </Text>
          </TouchableOpacity>

          {/* Product Description */}
          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.description}>
                {product.description}
              </Text>
            </View>
          )}

          {/* Additional Info */}
          <View style={styles.additionalInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Product ID:</Text>
              <Text style={styles.infoValue}>{product.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Availability:</Text>
              <Text style={[styles.infoValue, { color: inStock ? '#28A745' : '#DC3545' }]}>
                {inStock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
            {product.vendor && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Brand:</Text>
                <Text style={styles.infoValue}>{product.vendor}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  cartButton: {
    padding: 8,
    position: 'relative',
  },
  cartButtonText: {
    fontSize: 20,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 400,
  },
  imageWrapper: {
    width: screenWidth,
    height: 400,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
  },
  inactiveIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  stockBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  inStockBadge: {
    backgroundColor: 'rgba(40, 167, 69, 0.9)',
  },
  outOfStockBadge: {
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inStockText: {
    color: '#FFFFFF',
  },
  outOfStockText: {
    color: '#FFFFFF',
  },
  productInfo: {
    padding: 20,
  },
  vendor: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    lineHeight: 30,
  },
  productType: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginRight: 12,
  },
  comparePrice: {
    fontSize: 18,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  savingsBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  variantsSection: {
    marginBottom: 20,
  },
  variantsLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  variantButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  selectedVariantButton: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  variantText: {
    fontSize: 14,
    color: '#333333',
  },
  selectedVariantText: {
    color: '#FFFFFF',
  },
  quantitySection: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#F0F0F0',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  quantityDisplay: {
    marginHorizontal: 20,
    minWidth: 40,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  addToCartButton: {
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
  additionalInfo: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
});

export default ProductPage; 