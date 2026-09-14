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
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import RootNavigator from '@navigation/RootNavigator';
import { persistor, store } from '@store/index';
import { Colors } from '@theme/index';

const App = (): React.JSX.Element => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <StatusBar
              barStyle="light-content"
              backgroundColor={Colors.background.primary}
              translucent={false}
            />
            <RootNavigator />
            <Toast />
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
