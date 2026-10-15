import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { JournalProvider } from '../src/state/JournalContext';
export default function RootLayout(){
  return <JournalProvider><StatusBar style="dark"/><Stack screenOptions={{headerShown:false}}/></JournalProvider>;
}
