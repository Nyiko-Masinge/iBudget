import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createBackendClient, PublicSupabaseConfigSchema } from '@ibudget/data-access';
const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const publicConfig={url,publishableKey};
export const supabaseConfigured=PublicSupabaseConfigSchema.safeParse(publicConfig).success;
const mobileSessionStorage={
 getItem:(name:string)=>SecureStore.getItemAsync(name),
 setItem:(name:string,value:string)=>SecureStore.setItemAsync(name,value),
 removeItem:(name:string)=>SecureStore.deleteItemAsync(name)
};
// Limit browser refresh-token persistence to the current tab. This reduces exposure
// from tokens left behind in long-lived localStorage, but CSP and XSS prevention are
// still required because scripts running on the page can access sessionStorage.
const webSessionStorage={
 getItem:(name:string)=>Promise.resolve(readWebSessionValue(name)),
 setItem:(name:string,value:string)=>Promise.resolve(writeWebSessionValue(name,value)),
 removeItem:(name:string)=>Promise.resolve(removeWebSessionValue(name))
};
function readWebSessionValue(name:string){try{return typeof window==='undefined'?null:window.sessionStorage.getItem(name);}catch{return null;}}
function writeWebSessionValue(name:string,value:string){try{if(typeof window!=='undefined')window.sessionStorage.setItem(name,value);}catch{/* Storage may be unavailable in restricted browser contexts. */}}
function removeWebSessionValue(name:string){try{if(typeof window!=='undefined')window.sessionStorage.removeItem(name);}catch{/* Storage may be unavailable in restricted browser contexts. */}}
const auth={autoRefreshToken:true,persistSession:true,detectSessionInUrl:false,flowType:'pkce' as const,storage:Platform.OS==='web'?webSessionStorage:mobileSessionStorage};
export const supabase=supabaseConfigured?createBackendClient(publicConfig,{auth}):null;
