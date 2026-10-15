import { StyleSheet, Text, View } from 'react-native';
import { C } from './theme';
export function FauxMap(){
  return <View style={s.map} accessible accessibilityLabel="테스트용 가상 지도. 실제 GPS 위치가 아닙니다.">
    <View style={s.contourA}/><View style={s.contourB}/><View style={s.contourC}/>
    <View style={s.trackA}/><View style={s.trackB}/>
    <View style={s.dot}/>
    <Text style={s.badge}>가상 지도 · 실시간 위치 아님</Text>
  </View>;
}
const s=StyleSheet.create({
  map:{height:208,overflow:'hidden',borderRadius:18,backgroundColor:'#DCE9D9',justifyContent:'flex-end',padding:10},
  contourA:{position:'absolute',width:300,height:170,left:-65,top:-35,transform:[{rotate:'25deg'}],borderWidth:14,borderColor:'#C6DCC6',borderRadius:100},
  contourB:{position:'absolute',width:230,height:165,right:-70,top:-40,borderWidth:8,borderColor:'#B8D0B9',borderRadius:100},
  contourC:{position:'absolute',width:270,height:180,left:60,bottom:-115,borderWidth:11,borderColor:'#BED6BB',borderRadius:100},
  trackA:{position:'absolute',width:175,height:9,left:55,top:105,backgroundColor:C.green,transform:[{rotate:'-27deg'}],borderRadius:8},
  trackB:{position:'absolute',width:82,height:9,left:175,top:78,backgroundColor:C.green,transform:[{rotate:'26deg'}],borderRadius:8},
  dot:{position:'absolute',left:228,top:58,width:20,height:20,borderRadius:10,backgroundColor:'#286ACB',borderWidth:4,borderColor:C.white},
  badge:{backgroundColor:'#FFFFFFE8',alignSelf:'flex-start',color:C.dark,fontSize:15,fontWeight:'700',borderRadius:8,overflow:'hidden',padding:9},
});
