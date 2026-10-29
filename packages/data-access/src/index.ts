import { z } from 'zod';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
export const PublicSupabaseConfigSchema = z.object({url:z.string().url(),publishableKey:z.string().min(20)});
export function createBackendClient(config:unknown, options:Parameters<typeof createClient>[2]={}){
 const parsed=PublicSupabaseConfigSchema.safeParse(config);
 if(!parsed.success) throw new Error('Supabase public configuration is missing or invalid.');
 return createClient(parsed.data.url,parsed.data.publishableKey,options);
}
export const TransactionListSchema=z.array(z.object({transaction_type:z.enum(['income','expense','transfer','refund']),amount_minor:z.union([z.number().int().positive().max(Number.MAX_SAFE_INTEGER),z.string().regex(/^\d+$/).refine(value=>BigInt(value)>0n&&BigInt(value)<=BigInt(Number.MAX_SAFE_INTEGER)).transform(Number)])}));
export async function listRecentTransactions(client:SupabaseClient,limit=10){
 const safeLimit=z.number().int().min(1).max(100).parse(limit);
 const {data,error}=await client.from('transactions').select('transaction_type,amount_minor').is('deleted_at',null).order('occurred_at',{ascending:false}).limit(safeLimit);
 if(error) throw new Error('Unable to load transactions.');
 return TransactionListSchema.parse(data??[]);
}

export { signInWithPassword, registerWithPassword } from './auth';



