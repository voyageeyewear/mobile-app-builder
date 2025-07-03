
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';

const Carousel = ({ props, navigation, products = [] }) => {
  // Use real products from API, fallback to mock if none available
  const displayProducts = products.length > 0 ? products.map(product => ({
    id: product.id,
    title: product.title,
    price: `$${product.variants?.[0]?.price?.amount || product.price || '0.00'}`,
    image: product.images?.[0]?.url || product.image || 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=center'
  })) : [
    { id: '1', title: 'Green Snowboard', price: '$29.99', image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=center' },
    { id: '2', title: 'Red Snowboard', price: '$39.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center' },
    { id: '3', title: 'iPhone 12', price: '$799.99', image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop&crop=center' },
  ];

  const handleProductPress = (product) => {
    if (navigation) {
      navigation.navigate('ProductPage', { productId: product.id });
    } else {
      console.log('Navigation to product:', product.id);
    }
  };
  
  return (
    <View style={styles.container}>
      {props.title && <Text style={styles.title}>{props.title}</Text>}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContainer}
      >
        {displayProducts.map((item, index) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.carouselItem, index === 0 && styles.firstItem]}
            onPress={() => handleProductPress(item)}
          >
            <Image source={{ uri: item.image }} style={styles.carouselImage} />
            <Text style={styles.carouselTitle}>{item.title}</Text>
            <Text style={styles.carouselPrice}>{item.price}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginHorizontal: 16,
    color: '#000000',
  },
  carouselContainer: {
    paddingRight: 16,
  },
  carouselItem: {
    width: 160,
    marginLeft: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstItem: {
    marginLeft: 16,
  },
  carouselImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  carouselTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  carouselPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default Carousel;
