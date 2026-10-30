import { z } from 'zod';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
export const PublicSupabaseConfigSchema = z.object({url:z.string().url(),publishableKey:z.string().min(20)});
export function createBackendClient(config:unknown, options:Parameters<typeof createClient>[2]={}){
 const parsed=PublicSupabaseConfigSchema.safeParse(config);
 if(!parsed.success) throw new Error('Supabase public configuration is missing or invalid.');
 return createClient(parsed.data.url,parsed.data.publishableKey,options);
}
const MinorAmountSchema=z.union([z.number().int().positive().max(Number.MAX_SAFE_INTEGER),z.string().regex(/^\d+$/).refine(value=>BigInt(value)>0n&&BigInt(value)<=BigInt(Number.MAX_SAFE_INTEGER)).transform(Number)]);
export const TransactionListSchema=z.array(z.object({id:z.string().uuid(),transaction_type:z.enum(['income','expense','transfer','refund']),amount_minor:MinorAmountSchema,currency:z.string().length(3),description:z.string(),occurred_at:z.string().datetime({offset:true})}));
export async function listRecentTransactions(client:SupabaseClient,limit=10){
 const safeLimit=z.number().int().min(1).max(100).parse(limit);
 const {data,error}=await client.from('transactions').select('id,transaction_type,amount_minor,currency,description,occurred_at').is('deleted_at',null).order('occurred_at',{ascending:false}).limit(safeLimit);
 if(error) throw new Error('Unable to load transactions.');
 return TransactionListSchema.parse(data??[]);
}

const AccountSchema=z.object({id:z.string().uuid(),name:z.string().min(1).max(100),account_type:z.enum(['cash','checking','savings','credit']),currency:z.string().length(3)});
export async function listFinancialAccounts(client:SupabaseClient){
 const {data,error}=await client.from('financial_accounts').select('id,name,account_type,currency').eq('is_archived',false).order('created_at',{ascending:true});
 if(error) throw new Error('Unable to load your accounts.');
 return z.array(AccountSchema).parse(data??[]);
}
export async function createFinancialAccount(client:SupabaseClient,input:{name:string;accountType:'cash'|'checking'|'savings'|'credit';currency:string}){
 const valid=z.object({name:z.string().trim().min(1).max(100),accountType:z.enum(['cash','checking','savings','credit']),currency:z.string().length(3)}).parse(input);
 const {data,error}=await client.from('financial_accounts').insert({name:valid.name,account_type:valid.accountType,currency:valid.currency}).select('id,name,account_type,currency').single();
 if(error) throw new Error('Unable to create an account.');
 return AccountSchema.parse(data);
}
export async function listTransactionCategories(client:SupabaseClient,type:'income'|'expense'){
 const {data,error}=await client.from('categories').select('id,name').eq('category_type',type).order('name',{ascending:true});
 if(error) throw new Error('Unable to load categories.');
 return z.array(z.object({id:z.string().uuid(),name:z.string().min(1)})).parse(data??[]);
}
export async function createFinancialTransaction(client:SupabaseClient,input:{accountId:string;categoryId:string|null;type:'income'|'expense';amountMinor:number;currency:string;description:string;occurredAt:string}){
 const valid=z.object({accountId:z.string().uuid(),categoryId:z.string().uuid().nullable(),type:z.enum(['income','expense']),amountMinor:z.number().int().positive().max(Number.MAX_SAFE_INTEGER),currency:z.string().length(3),description:z.string().trim().min(1).max(240),occurredAt:z.string().datetime({offset:true})}).parse(input);
 const {error}=await client.from('transactions').insert({account_id:valid.accountId,category_id:valid.categoryId,transaction_type:valid.type,amount_minor:valid.amountMinor,currency:valid.currency,description:valid.description,occurred_at:valid.occurredAt});
 if(error) throw new Error('Unable to save this transaction. Check the account and try again.');
}

export { signInWithPassword, registerWithPassword } from './auth';



