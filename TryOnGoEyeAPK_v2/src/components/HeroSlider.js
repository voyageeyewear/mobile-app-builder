import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';

const HeroSlider = ({ props = {} }) => {
  const {
    slides = [],
    slide1Url = "",
    slide1Type = "image",
    slide2Url = "",
    slide2Type = "image", 
    slide3Url = "",
    slide3Type = "image",
    slide4Url = "",
    slide4Type = "image",
    slide5Url = "",
    slide5Type = "image",
    height = 250,
    borderRadius = 12,
    autoPlay = true,
    autoPlayInterval = 4000,
    showDots = true,
    showArrows = true
  } = props;

  // Build slides array - prioritize individual slide properties over legacy slides array
  const individualSlides = [
    ...(slide1Url ? [{ url: slide1Url, type: slide1Type }] : []),
    ...(slide2Url ? [{ url: slide2Url, type: slide2Type }] : []),
    ...(slide3Url ? [{ url: slide3Url, type: slide3Type }] : []),
    ...(slide4Url ? [{ url: slide4Url, type: slide4Type }] : []),
    ...(slide5Url ? [{ url: slide5Url, type: slide5Type }] : [])
  ];
  
  // Use individual slides if any are configured, otherwise fall back to legacy slides array
  const processedSlides = individualSlides.length > 0 ? individualSlides : slides;

  // Group slides into pairs for side-by-side display
  const groupedSlides = [];
  for (let i = 0; i < processedSlides.length; i += 2) {
    const pair = processedSlides.slice(i, i + 2);
    groupedSlides.push(pair);
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const totalGroups = groupedSlides.length;

  // Auto-play functionality - cycles through groups
  useEffect(() => {
    if (autoPlay && totalGroups > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === totalGroups - 1 ? 0 : prevIndex + 1
        );
      }, autoPlayInterval);

      return () => clearInterval(interval);
    }
  }, [autoPlay, autoPlayInterval, totalGroups]);

  if (!processedSlides || processedSlides.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🎬 Hero Slider</Text>
          <Text style={styles.placeholderSubtext}>No slides configured</Text>
        </View>
      </View>
    );
  }

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? totalGroups - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === totalGroups - 1 ? 0 : currentIndex + 1);
  };

  const currentGroup = groupedSlides[currentIndex] || [];

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.slideContainer, { borderRadius }]}>
        <View style={styles.imageRow}>
          {currentGroup.map((slide, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image
                source={{ uri: slide.url }}
                style={[styles.slideImage, { borderRadius: borderRadius * 0.7 }]}
                resizeMode="cover"
              />
            </View>
          ))}
          
          {/* If only one image in the group, add placeholder */}
          {currentGroup.length === 1 && (
            <View style={[styles.imageWrapper, styles.placeholderWrapper]}>
              <View style={[styles.imagePlaceholder, { borderRadius: borderRadius * 0.7 }]}>
                <Text style={styles.placeholderIcon}>📸</Text>
                <Text style={styles.placeholderText}>Add Image</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Navigation Arrows */}
        {showArrows && totalGroups > 1 && (
          <>
            <TouchableOpacity 
              style={[styles.arrow, styles.leftArrow]} 
              onPress={goToPrevious}
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.arrow, styles.rightArrow]} 
              onPress={goToNext}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      
      {/* Navigation Dots */}
      {showDots && totalGroups > 1 && (
        <View style={styles.dotsContainer}>
          {groupedSlides.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.activeDot : styles.inactiveDot
              ]}
              onPress={() => goToSlide(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
    position: 'relative',
  },
  slideContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  imageRow: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  imageWrapper: {
    flex: 1,
    height: '100%',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  placeholderWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F7FAFC',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#718096',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  leftArrow: {
    left: 16,
  },
  rightArrow: {
    right: 16,
  },
  arrowText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#4A90E2',
  },
  inactiveDot: {
    backgroundColor: '#CBD5E0',
  },
});

export default HeroSlider; 