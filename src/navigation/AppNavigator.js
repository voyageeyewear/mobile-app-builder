import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Import screens
import Apk_build_1751447654193Screen from '../screens/Apk_build_1751447654193Screen';
import DfdScreen from '../screens/DfdScreen';
import TestScreen from '../screens/TestScreen';

const screens = [
  { name: 'apk-build-1751447654193', component: Apk_build_1751447654193Screen, title: 'apk-build-1751447654193' },
  { name: 'dfd', component: DfdScreen, title: 'dfd' },
  { name: 'test', component: TestScreen, title: 'test' }
];

const AppNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const CurrentScreenComponent = screens[currentScreen].component;

  return (
    <View style={styles.container}>
      {/* Simple Tab Navigation */}
      <View style={styles.tabBar}>
        {screens.map((screen, index) => (
          <TouchableOpacity
            key={screen.name}
            style={[
              styles.tab,
              currentScreen === index && styles.activeTab
            ]}
            onPress={() => setCurrentScreen(index)}
          >
            <Text style={[
              styles.tabText,
              currentScreen === index && styles.activeTabText
            ]}>
              {screen.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Screen Content */}
      <View style={styles.screenContainer}>
        <CurrentScreenComponent />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingTop: 40,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  screenContainer: {
    flex: 1,
  },
});

export default AppNavigator; 