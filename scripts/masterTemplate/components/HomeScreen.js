import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

// Import all available components
import MobileHeader from './MobileHeader';
import Banner from './Banner';
import Carousel from './Carousel';
import Countdown from './Countdown';
import ProductGrid from './ProductGrid';
import TextBlock from './TextBlock';
import Image from './Image';
import Button from './Button';
import HeroSlider from './HeroSlider';

const HomeScreen = ({ navigation, config, products }) => {
  const renderComponent = (component, index) => {
    // Map component IDs to React components
    const componentMap = {
      'mobile-header': MobileHeader,
      'banner': Banner,
      'carousel': Carousel,
      'countdown': Countdown,
      'product-grid': ProductGrid,
      'featured-collection': ProductGrid, // Alias for product grid
      'text-block': TextBlock,
      'image': Image,
      'button': Button,
      'hero-slider': HeroSlider
    };

    const ComponentClass = componentMap[component.componentId];
    
    if (!ComponentClass) {
      return (
        <View key={index} style={styles.unknownComponent}>
          <Text style={styles.errorText}>
            Unknown component: {component.componentId}
          </Text>
        </View>
      );
    }

    return (
      <ComponentClass 
        key={index}
        props={component.props || {}}
        products={products || []}
        navigation={navigation}
      />
    );
  };

  if (!config || !config.hasApp) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.indicator}>📱 No template found</Text>
        </View>
      </View>
    );
  }

  const components = config.components || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.indicator}>🟢 LIVE PREVIEW</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        bounces={true}
        showsVerticalScrollIndicator={false}
      >
        {components.map((component, index) => renderComponent(component, index))}
        {components.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No components added yet</Text>
            <Text style={styles.emptySubtext}>Add components in the builder to see them here</Text>
          </View>
        )}
        
        {/* Add some bottom padding for better scrolling */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  indicator: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  unknownComponent: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});

export default HomeScreen; 