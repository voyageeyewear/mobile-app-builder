import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import HeroSlider from './src/components/HeroSlider';

export default function App() {
  // Sample image data for demonstration
  const heroSliderProps = {
    slide1Url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    slide1Type: "image",
    slide2Url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    slide2Type: "image",
    slide3Url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    slide3Type: "image",
    slide4Url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    slide4Type: "image",
    height: 200,
    borderRadius: 12,
    autoPlay: true,
    autoPlayInterval: 3000,
    showDots: true,
    showArrows: true
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>TryOnGoEye Mobile App</Text>
        <Text style={styles.subtitle}>Hero Slider Demo</Text>
        
        <HeroSlider props={heroSliderProps} />
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>✨ Hero Slider Features:</Text>
          <Text style={styles.infoText}>• Side-by-side image display</Text>
          <Text style={styles.infoText}>• Touch/swipe navigation</Text>
          <Text style={styles.infoText}>• Auto-play functionality</Text>
          <Text style={styles.infoText}>• Navigation dots and arrows</Text>
          <Text style={styles.infoText}>• Responsive design</Text>
        </View>
        
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>📱 Test Instructions:</Text>
          <Text style={styles.instructionsText}>• Swipe left/right to navigate</Text>
          <Text style={styles.instructionsText}>• Tap arrows to navigate</Text>
          <Text style={styles.instructionsText}>• Tap dots to jump to specific slides</Text>
          <Text style={styles.instructionsText}>• Watch auto-play in action</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a202c',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#4a5568',
  },
  infoContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4299e1',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2d3748',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#4a5568',
    lineHeight: 24,
  },
  instructionsContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#48bb78',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2d3748',
  },
  instructionsText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#4a5568',
    lineHeight: 24,
  },
});
