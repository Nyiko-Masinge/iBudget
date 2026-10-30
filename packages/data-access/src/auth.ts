import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
const EmailSchema=z.string().trim().email().max(254);
export async function signInWithPassword(client:SupabaseClient,email:string,password:string){
 const validEmail=EmailSchema.parse(email); z.string().min(1).max(128).parse(password);
 const {data,error}=await client.auth.signInWithPassword({email:validEmail,password});
 if(error?.code==='email_not_confirmed') {
  throw new Error('Confirm this email address before signing in. Check the inbox for this address, or confirm the user in Supabase Authentication.');
 }
 if(error) throw new Error('Email or password was not accepted.');
 return data;
}
export async function registerWithPassword(client:SupabaseClient,email:string,password:string){
 const emailResult=EmailSchema.safeParse(email);
 if(!emailResult.success) throw new Error('Enter a valid email address.');
 if(password.length<12) throw new Error('Use a password with at least 12 characters.');
 if(password.length>128) throw new Error('Password must be 128 characters or fewer.');
 const validEmail=emailResult.data;
 const {data,error}=await client.auth.signUp({email:validEmail,password});
 if(error?.code==='email_address_not_authorized') {
  throw new Error('Supabase’s default email service only sends to addresses on your project team. Use a team email for testing or configure custom SMTP in Supabase.');
 }
 if(error?.code==='over_email_send_rate_limit') {
  throw new Error('Supabase’s email limit was reached. Wait before trying again or configure custom SMTP.');
 }
 if(error?.code==='signup_disabled') {
  throw new Error('Account creation is disabled. Enable email sign-ups in Supabase Authentication settings.');
 }
 if(error) throw new Error('Account could not be created. Check Supabase Authentication settings and try again.');
 return data;
}
