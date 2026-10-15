import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from './theme';

export function Page({children,scroll=true}:{children:ReactNode;scroll?:boolean}){
  return <SafeAreaView style={{flex:1,backgroundColor:C.bg}} edges={['top','left','right','bottom']}>
    {scroll?<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>{children}</ScrollView>:
      <View style={[s.page,{flex:1}]}>{children}</View>}
  </SafeAreaView>;
}
export function H1({children}:{children:ReactNode}){return <Text maxFontSizeMultiplier={1.6} style={s.h1}>{children}</Text>;}
export function H2({children}:{children:ReactNode}){return <Text maxFontSizeMultiplier={1.6} style={s.h2}>{children}</Text>;}
export function P({children,small=false}:{children:ReactNode;small?:boolean}){return <Text maxFontSizeMultiplier={1.8} style={small?s.small:s.p}>{children}</Text>;}
export function Card({children}:{children:ReactNode}){return <View style={s.card}>{children}</View>;}
export function Pill({children,warning=false}:{children:ReactNode;warning?:boolean}){return <View style={[s.pill,warning&&{backgroundColor:C.amberBg}]}><Text style={{color:warning?C.amber:C.green,fontSize:15,fontWeight:'700'}}>{children}</Text></View>;}
export function PrimaryButton({title,onPress,disabled=false,variant='green'}:{title:string;onPress:()=>void;disabled?:boolean;variant?:'green'|'secondary'|'danger'}){
  const bg=variant==='secondary'?C.card:variant==='danger'?C.red:C.green;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress}
    style={({pressed})=>[s.button,{backgroundColor:bg,opacity:disabled?0.45:pressed?0.75:1}]}>
    <Text allowFontScaling maxFontSizeMultiplier={1.65} style={[s.buttonText,{color:variant==='secondary'?C.text:C.white}]}>{title}</Text>
  </Pressable>;
}
export function Field({value,onChangeText,placeholder,label}:{value:string;onChangeText:(value:string)=>void;placeholder:string;label:string}){
  return <View style={{gap:8}}>
    <Text style={s.fieldLabel}>{label}</Text>
    <TextInput accessibilityLabel={label} style={s.input} value={value} onChangeText={onChangeText}
      placeholder={placeholder} placeholderTextColor={C.muted} autoCapitalize="none" />
  </View>;
}
export function InfoLine({label,value}:{label:string;value:string}){return <View style={s.line}><P>{label}</P><Text style={s.lineValue}>{value}</Text></View>;}
const s=StyleSheet.create({
  page:{padding:20,gap:16,paddingBottom:32},
  h1:{fontSize:28,lineHeight:36,fontWeight:'800',color:C.dark},
  h2:{fontSize:22,lineHeight:30,fontWeight:'800',color:C.text},
  p:{fontSize:18,lineHeight:27,color:C.text},
  small:{fontSize:16,lineHeight:24,color:C.muted},
  card:{backgroundColor:C.card,padding:18,borderRadius:18,gap:12},
  pill:{alignSelf:'flex-start',backgroundColor:'#DAEAD8',paddingHorizontal:12,paddingVertical:8,borderRadius:20},
  button:{minHeight:64,alignItems:'center',justifyContent:'center',paddingHorizontal:16,paddingVertical:12,borderRadius:16},
  buttonText:{fontSize:20,fontWeight:'800',textAlign:'center'},
  fieldLabel:{fontSize:18,color:C.text,fontWeight:'700'},
  input:{borderWidth:1.5,borderColor:C.border,borderRadius:14,minHeight:56,padding:14,fontSize:19,color:C.dark,backgroundColor:C.white},
  line:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:6},
  lineValue:{fontSize:20,fontWeight:'800',color:C.dark},
});
