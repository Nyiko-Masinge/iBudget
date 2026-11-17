import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
const EmailSchema=z.string().trim().email().max(254);
export async function signInWithPassword(client:SupabaseClient,email:string,password:string){
 const emailResult=EmailSchema.safeParse(email);
 if(!emailResult.success) throw new Error('Enter a valid email address.');
 if(!password) throw new Error('Enter your password.');
 const validEmail=emailResult.data;
 const {data,error}=await client.auth.signInWithPassword({email:validEmail,password});
 if(error) throw new Error('Unable to sign in with those details. Check your email and password, or reset your password.');
 return data;
}
export async function registerWithPassword(client:SupabaseClient,email:string,password:string,emailRedirectTo:string){
 const emailResult=EmailSchema.safeParse(email);
 if(!emailResult.success) throw new Error('Enter a valid email address.');
 if(password.length<12) throw new Error('Use a password with at least 12 characters.');
 if(password.length>128) throw new Error('Password must be 128 characters or fewer.');
 const validEmail=emailResult.data;
 const {data,error}=await client.auth.signUp({email:validEmail,password,options:{emailRedirectTo}});
 if(error?.code==='email_address_not_authorized') {
  throw new Error('Supabase’s default email service only sends to addresses on your project team. Use a team email for testing or configure custom SMTP in Supabase.');
 }
 if(error?.code==='over_email_send_rate_limit') {
  throw new Error('Supabase’s email limit was reached. Wait before trying again or configure custom SMTP.');
 }
 if(error?.code==='signup_disabled') throw new Error('Account creation is currently unavailable. Please try again later.');
 if(error?.code==='email_exists') throw new Error('If this address can be registered, check your inbox for next steps.');
 if(error) throw new Error('If this address can be registered, check your inbox for next steps.');
 return data;
}

export async function resendConfirmation(client:SupabaseClient,email:string,emailRedirectTo:string){
 const validEmail=EmailSchema.safeParse(email);
 if(!validEmail.success) throw new Error('Enter a valid email address first.');
 const {error}=await client.auth.resend({type:'signup',email:validEmail.data,options:{emailRedirectTo}});
 if(error) throw new Error('If this address needs confirmation, a message will be sent. Check your inbox and spam folder.');
}

export async function requestPasswordReset(client:SupabaseClient,email:string,redirectTo:string){
 const validEmail=EmailSchema.safeParse(email);
 if(!validEmail.success) throw new Error('Enter a valid email address first.');
 const {error}=await client.auth.resetPasswordForEmail(validEmail.data,{redirectTo});
 if(error) throw new Error('If an account exists for that email, a reset message will be sent. Check your inbox and spam folder.');
}
