/**
 * Custom entry - loads Firebase messaging FIRST so background handler is registered
 * for all 3 modes (foreground, background, quit). Required for quit-state notifications.
 */
import '@expo/metro-runtime';

// Load Firebase messaging before app - registers setBackgroundMessageHandler for background/quit
import './src/services/firebaseMessaging';

import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

renderRootComponent(App);
