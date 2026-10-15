import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { C } from '../../src/ui/theme';
export default function MainTabs(){
  return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:C.green,
    tabBarInactiveTintColor:C.muted,tabBarLabelStyle:{fontSize:16,fontWeight:'700'},
    tabBarStyle:{height:74,paddingBottom:10,paddingTop:5,backgroundColor:C.bg,borderTopColor:C.border}}}>
    <Tabs.Screen name="index" options={{title:'홈',tabBarIcon:()=> <Text style={{fontSize:23}}>🏠</Text>}}/>
    <Tabs.Screen name="mountains" options={{title:'나의 산',tabBarIcon:()=> <Text style={{fontSize:23}}>⛰️</Text>}}/>
    <Tabs.Screen name="badges" options={{title:'뱃지',tabBarIcon:()=> <Text style={{fontSize:23}}>🏅</Text>}}/>
  </Tabs>;
}
