import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import Carousel from './src/components/Carousel';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>tryongoeye.myshopify.com Mobile App</Text>
        <Text style={styles.subtitle}>Generated from "live-preview-1751483946613" template</Text>
        
        <View props={{"logoText":"oe","logoSize":49,"logoColor":"#FFFFFF","backgroundColor":"#313652","iconColor":"#FFFFFF","textColor":"#FFFFFF","showOfferButton":true,"offerButtonText":"50% OFF","offerButtonColor":"#FC8181","showMenuIcon":true,"showWishlistIcon":true,"showAccountIcon":true,"showCartIcon":true,"showCartBadge":true,"cartBadgeCount":3,"cartBadgeColor":"#EF4444","searchPlaceholder":"Free Cash on Delivery","searchBackgroundColor":"#F7FAFC","searchTextColor":"#4A5568","showNavTabs":true,"navBackgroundColor":"#313652","navTextColor":"#CBD5E0","navActiveColor":"#FFFFFF","nav1Title":"All","nav1Active":true,"nav2Title":"Classic","nav2Active":false,"nav3Title":"Essentials","nav3Active":false,"nav4Title":"Premium","nav4Active":false,"logoImage":"https://cdn.shopify.com/s/files/1/0570/8120/0663/files/jpn_christmas_logo_goeye_png_1.png?v=1747214882","showLogoImage":true}} />
        <View props={{"slides":[{"url":"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop","type":"image"},{"url":"https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop","type":"image"}],"slide1Url":"https://goeye.in/cdn/shop/files/air_banner_1.jpg?v=1750422574&width=440","slide1Type":"image","slide2Url":"https://goeye.in/cdn/shop/files/ACTIVE.jpg?v=1750508489&width=440","slide2Type":"image","slide3Url":"https://goeye.in/cdn/shop/files/CLIP_ON_c6bf00e0-5990-47e4-8bee-bd5c8f7eafa7.jpg?v=1750508489&width=440","slide3Type":"image","slide4Url":"https://goeye.in/cdn/shop/files/glam_b51057db-0c47-4603-a8c2-e640a239eef5.jpg?v=1750675426&width=440","slide4Type":"image","slide5Url":"","slide5Type":"image","height":250,"borderRadius":12,"autoPlay":true,"autoPlayInterval":2000,"showDots":true,"showArrows":false}} />
        <View props={{"title":"Featured Collection","description":"Check out our best products","dataSource":"collection","collectionId":"","specificProducts":[],"layout":"grid","itemsToShow":4,"showPrices":true,"showRatings":true,"actionButtonText":"View All","actionButtonLink":"/collections/featured"}} />
        <Carousel props={{"title":"Featured Products","showArrows":true,"autoPlay":true,"itemsPerView":2,"spacing":"16px","dataSource":"mock","collectionId":"","productIds":[]}} />

        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>📱 Your Mobile App</Text>
          <Text style={styles.infoText}>• Generated from your app builder design</Text>
          <Text style={styles.infoText}>• Contains 4 components</Text>
          <Text style={styles.infoText}>• Native Android performance</Text>
          <Text style={styles.infoText}>• Ready for testing and distribution</Text>
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
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#4a5568',
    fontStyle: 'italic',
  },
  welcomeText: {
    fontSize: 18,
    textAlign: 'center',
    margin: 20,
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
});