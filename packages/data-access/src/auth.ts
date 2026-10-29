import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
const EmailSchema=z.string().trim().email().max(254);
export async function signInWithPassword(client:SupabaseClient,email:string,password:string){
 const validEmail=EmailSchema.parse(email); z.string().min(1).max(128).parse(password);
 const {data,error}=await client.auth.signInWithPassword({email:validEmail,password});
 if(error) throw new Error('Email or password was not accepted.');
 return data;
}
export async function registerWithPassword(client:SupabaseClient,email:string,password:string){
 const validEmail=EmailSchema.parse(email); z.string().min(12).max(128).parse(password);
 const {data,error}=await client.auth.signUp({email:validEmail,password});
 if(error) throw new Error('Account could not be created. Check the details and try again.');
 return data;
}
