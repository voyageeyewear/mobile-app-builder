import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './HomeScreen';
import ProductPage from './ProductPage';

const Stack = createStackNavigator();

const AppNavigator = ({ config, products }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          options={{ headerShown: false }}
        >
          {(props) => (
            <HomeScreen 
              {...props} 
              config={config} 
              products={products}
            />
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="ProductPage" 
          component={ProductPage}
          options={{ 
            headerShown: false,
            presentation: 'modal'
          }}
          initialParams={{ products }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 