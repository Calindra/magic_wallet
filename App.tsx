import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation';

// fixes ReferenceError: Property 'Buffer' doesn't exist
global.Buffer = require('buffer').Buffer;

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
        <Navigation colorScheme={colorScheme} />
        <StatusBar style={'light'} />
      </SafeAreaProvider>
    );
  }
}
