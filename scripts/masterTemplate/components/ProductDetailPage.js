import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const ProductDetailPage = ({ props = {} }) => {
  const {
    productId = "",
    productTitle = "Sample Product",
    productDescription = "This is a sample product description. Add your product details here to showcase features, benefits, and specifications.",
    productPrice = "29.99",
    compareAtPrice = "",
    productImages = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop"
    ],
    productVendor = "Sample Brand",
    productType = "Electronics",
    productTags = ["featured", "bestseller"],
    inStock = true,
    stockQuantity = 25,
    showQuantitySelector = true,
    showDescription = true,
    showVendor = true,
    showProductType = true,
    showTags = true,
    showComparePrice = true,
    showStockStatus = true,
    addToCartButtonText = "Add to Cart",
    addToCartButtonColor = "#007AFF",
    quantityButtonColor = "#F0F0F0",
    priceColor = "#000000",
    compareAtPriceColor = "#999999",
    descriptionColor = "#333333",
    backgroundColor = "#FFFFFF",
    showImageIndicators = true,
    enableImageZoom = false
  } = props;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartItems, setCartItems] = useState(0);

  // Handle add to cart
  const handleAddToCart = () => {
    if (!inStock) return;
    
    setCartItems(prev => prev + quantity);
    
    // Here you would typically integrate with your cart system
    console.log(`Added ${quantity} x ${productTitle} to cart`);
    
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

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} showsVerticalScrollIndicator={false}>
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
        {showImageIndicators && productImages.length > 1 && (
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
        {showStockStatus && (
          <View style={[styles.stockBadge, inStock ? styles.inStockBadge : styles.outOfStockBadge]}>
            <Text style={[styles.stockText, inStock ? styles.inStockText : styles.outOfStockText]}>
              {inStock ? `${stockQuantity} in stock` : 'Out of stock'}
            </Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        {/* Vendor */}
        {showVendor && productVendor && (
          <Text style={styles.vendor}>{productVendor}</Text>
        )}

        {/* Product Title */}
        <Text style={styles.title}>{productTitle}</Text>

        {/* Product Type */}
        {showProductType && productType && (
          <Text style={styles.productType}>{productType}</Text>
        )}

        {/* Tags */}
        {showTags && productTags.length > 0 && (
          <View style={styles.tagsContainer}>
            {productTags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Price Section */}
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: priceColor }]}>${productPrice}</Text>
          {showComparePrice && compareAtPrice && (
            <Text style={[styles.comparePrice, { color: compareAtPriceColor }]}>
              ${compareAtPrice}
            </Text>
          )}
          {savings && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>Save ${savings} ({savingsPercentage}%)</Text>
            </View>
          )}
        </View>

        {/* Quantity Selector */}
        {showQuantitySelector && inStock && (
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={[styles.quantityButton, { backgroundColor: quantityButtonColor }]}
                onPress={decreaseQuantity}
                disabled={quantity <= 1}
              >
                <Text style={[styles.quantityButtonText, { opacity: quantity <= 1 ? 0.5 : 1 }]}>-</Text>
              </TouchableOpacity>
              
              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityText}>{quantity}</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.quantityButton, { backgroundColor: quantityButtonColor }]}
                onPress={increaseQuantity}
                disabled={quantity >= stockQuantity}
              >
                <Text style={[styles.quantityButtonText, { opacity: quantity >= stockQuantity ? 0.5 : 1 }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add to Cart Button */}
        <TouchableOpacity 
          style={[
            styles.addToCartButton, 
            { backgroundColor: inStock ? addToCartButtonColor : '#CCCCCC' }
          ]}
          onPress={handleAddToCart}
          disabled={!inStock}
        >
          <Text style={styles.addToCartText}>
            {inStock ? addToCartButtonText : 'Out of Stock'}
          </Text>
          {cartItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Product Description */}
        {showDescription && productDescription && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={[styles.description, { color: descriptionColor }]}>
              {productDescription}
            </Text>
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Product ID:</Text>
            <Text style={styles.infoValue}>{productId || 'N/A'}</Text>
          </View>
          {showStockStatus && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Availability:</Text>
              <Text style={[styles.infoValue, { color: inStock ? '#28A745' : '#DC3545' }]}>
                {inStock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
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
    marginRight: 12,
  },
  comparePrice: {
    fontSize: 18,
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
    position: 'relative',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartBadge: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
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

export default ProductDetailPage; 