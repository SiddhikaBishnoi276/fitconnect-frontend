/**
 * FitConnect — Root Component
 *
 * Wraps the entire app with:
 * - Redux store (+ persist gate)
 * - Navigation container
 * - Safe area provider
 * - Toast message provider
 */

import React from 'react';
import { StatusBar, View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';

import RootNavigator from '@navigation/RootNavigator';
import { persistor, store } from '@store/index';
import { Colors } from '@theme/index';

const App = (): React.JSX.Element => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Hello FitConnect</Text>
    </View>
  );
};

export default App;
