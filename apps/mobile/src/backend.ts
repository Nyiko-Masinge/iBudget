import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createBackendClient } from '@ibudget/data-access';
const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const supabaseConfigured=Boolean(url&&key&&!url.includes('your-project'));
const mobileSessionStorage={
 getItem:(name:string)=>SecureStore.getItemAsync(name),
 setItem:(name:string,value:string)=>SecureStore.setItemAsync(name,value),
 removeItem:(name:string)=>SecureStore.deleteItemAsync(name)
};
const auth={autoRefreshToken:true,persistSession:true,detectSessionInUrl:false,...(Platform.OS==='web'?{}:{storage:mobileSessionStorage})};
export const supabase=supabaseConfigured?createBackendClient({url,key},{auth}):null;
