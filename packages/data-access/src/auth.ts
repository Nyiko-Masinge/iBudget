import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
const EmailSchema=z.string().trim().email().max(254);
export async function signInWithPassword(client:SupabaseClient,email:string,password:string){
 const emailResult=EmailSchema.safeParse(email);
 if(!emailResult.success) throw new Error('Enter a valid email address.');
 if(!password) throw new Error('Enter your password.');
 const validEmail=emailResult.data;
 const {data,error}=await client.auth.signInWithPassword({email:validEmail,password});
 if(error?.code==='email_not_confirmed') {
  throw new Error('Your email is not confirmed yet. Check your inbox or tap “Resend confirmation email”.');
 }
 if(error?.code==='invalid_credentials') throw new Error('That email and password combination was not recognized. Check both or reset your password.');
 if(error?.status===404) throw new Error('Supabase returned 404. Check that apps/mobile/.env uses the Project URL and publishable key from the same active project where this user exists, then restart Expo with --clear.');
 if(error) throw new Error(`Sign-in failed (${error.code ?? error.status}). Please try again.`);
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
 if(error?.code==='signup_disabled') {
  throw new Error('Account creation is disabled. Enable email sign-ups in Supabase Authentication settings.');
 }
 if(error?.code==='email_exists') throw new Error('An account already exists for this email. Sign in or reset its password.');
 if(error?.status===404) throw new Error('Supabase returned 404 during sign-up. Check that the Project URL and publishable key in apps/mobile/.env belong to the same active project, then restart Expo with --clear.');
 if(error) throw new Error(`Account could not be created (${error.code ?? error.status}). Please try again.`);
 return data;
}

export async function resendConfirmation(client:SupabaseClient,email:string,emailRedirectTo:string){
 const validEmail=EmailSchema.safeParse(email);
 if(!validEmail.success) throw new Error('Enter a valid email address first.');
 const {error}=await client.auth.resend({type:'signup',email:validEmail.data,options:{emailRedirectTo}});
 if(error?.code==='email_address_not_authorized') throw new Error('Supabase’s default email service only sends to project team addresses. Configure custom SMTP to send to other addresses.');
 if(error?.code==='over_email_send_rate_limit') throw new Error('The email sending limit was reached. Wait before trying again or configure custom SMTP.');
 if(error) throw new Error(`Could not resend confirmation (${error.code ?? error.status}). Please try again.`);
}

export async function requestPasswordReset(client:SupabaseClient,email:string,redirectTo:string){
 const validEmail=EmailSchema.safeParse(email);
 if(!validEmail.success) throw new Error('Enter a valid email address first.');
 const {error}=await client.auth.resetPasswordForEmail(validEmail.data,{redirectTo});
 if(error?.code==='email_address_not_authorized') throw new Error('Supabase’s default email service only sends to project team addresses. Configure custom SMTP to send to other addresses.');
 if(error?.code==='over_email_send_rate_limit') throw new Error('The email sending limit was reached. Wait before trying again or configure custom SMTP.');
 if(error) throw new Error(`Could not send password reset (${error.code ?? error.status}). Please try again.`);
}
