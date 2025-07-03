
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';

const ProductGrid = ({ props, products = [], navigation }) => {
  // Use real products from API, fallback to mock if none available
  const displayProducts = products.length > 0 ? products.map(product => ({
    id: product.id,
    title: product.title,
    price: `$${product.price}`,
    image: product.image
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

  const renderProduct = ({ item }) => (
    <TouchableOpacity 
      style={styles.productItem}
      onPress={() => handleProductPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <Text style={styles.productTitle}>{item.title}</Text>
      {props.showPrice && <Text style={styles.productPrice}>{item.price}</Text>}
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      {props.title && <Text style={styles.title}>{props.title}</Text>}
      <FlatList
        data={displayProducts}
        renderItem={renderProduct}
        numColumns={props.columns || 2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000000',
  },
  grid: {
    paddingBottom: 16,
  },
  productItem: {
    flex: 1,
    margin: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default ProductGrid;
