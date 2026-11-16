import { z } from 'zod';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
export const PublicSupabaseConfigSchema = z.object({url:z.string().url(),publishableKey:z.string().min(20)});
export function createBackendClient(config:unknown, options:Parameters<typeof createClient>[2]={}){
 const parsed=PublicSupabaseConfigSchema.safeParse(config);
 if(!parsed.success) throw new Error('Supabase public configuration is missing or invalid.');
 return createClient(parsed.data.url,parsed.data.publishableKey,options);
}
const MinorAmountSchema=z.union([z.number().int().positive().max(Number.MAX_SAFE_INTEGER),z.string().regex(/^\d+$/).refine(value=>BigInt(value)>0n&&BigInt(value)<=BigInt(Number.MAX_SAFE_INTEGER)).transform(Number)]);
function backendError(action:string,error:{code?:string;message:string;details?:string;hint?:string;status?:number}){
 const code=error.code??(error.status?String(error.status):'unknown');
 // Keep the diagnostic actionable without exposing request headers, tokens, or personal data.
 const detail=[error.message,error.hint].filter(Boolean).join(' — ');
 return new Error(`${action} (${code}): ${detail}`);
}
export const TransactionListSchema=z.array(z.object({id:z.string().uuid(),transaction_type:z.enum(['income','expense','transfer','refund']),amount_minor:MinorAmountSchema,currency:z.string().length(3),description:z.string(),occurred_at:z.string().datetime({offset:true})}));
export async function listRecentTransactions(client:SupabaseClient,limit=10){
 const safeLimit=z.number().int().min(1).max(1000).parse(limit);
 const {data,error}=await client.from('transactions').select('id,transaction_type,amount_minor,currency,description,occurred_at').is('deleted_at',null).order('occurred_at',{ascending:false}).limit(safeLimit);
 if(error) throw backendError('Unable to load transactions',error);
 return TransactionListSchema.parse(data??[]);
}
export async function updateFinancialTransaction(client:SupabaseClient,input:{id:string;amountMinor:number;description:string}){const v=z.object({id:z.string().uuid(),amountMinor:z.number().int().positive().max(Number.MAX_SAFE_INTEGER),description:z.string().trim().min(1).max(240)}).parse(input);const {error}=await client.from('transactions').update({amount_minor:v.amountMinor,description:v.description,updated_at:new Date().toISOString()}).eq('id',v.id).is('deleted_at',null);if(error)throw backendError('Unable to update transaction',error);}
export async function deleteFinancialTransaction(client:SupabaseClient,id:string){const valid=z.string().uuid().parse(id);const {error}=await client.from('transactions').update({deleted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',valid).is('deleted_at',null);if(error)throw backendError('Unable to delete transaction',error);}

const AccountSchema=z.object({id:z.string().uuid(),name:z.string().min(1).max(100),account_type:z.enum(['cash','checking','savings','credit']),currency:z.string().length(3)});
export async function listFinancialAccounts(client:SupabaseClient){
 const {data,error}=await client.from('financial_accounts').select('id,name,account_type,currency').eq('is_archived',false).order('created_at',{ascending:true});
 if(error) throw backendError('Unable to load your accounts',error);
 return z.array(AccountSchema).parse(data??[]);
}
export async function createFinancialAccount(client:SupabaseClient,input:{name:string;accountType:'cash'|'checking'|'savings'|'credit';currency:string}){
 const valid=z.object({name:z.string().trim().min(1).max(100),accountType:z.enum(['cash','checking','savings','credit']),currency:z.string().length(3)}).parse(input);
 const {data,error}=await client.from('financial_accounts').insert({name:valid.name,account_type:valid.accountType,currency:valid.currency}).select('id,name,account_type,currency').single();
 if(error) throw backendError('Unable to create an account',error);
 return AccountSchema.parse(data);
}
export async function listTransactionCategories(client:SupabaseClient,type:'income'|'expense'){
 const {data,error}=await client.from('categories').select('id,name').eq('category_type',type).order('name',{ascending:true});
 if(error) throw backendError('Unable to load categories',error);
 return z.array(z.object({id:z.string().uuid(),name:z.string().min(1)})).parse(data??[]);
}
export async function createFinancialTransaction(client:SupabaseClient,input:{accountId:string;categoryId:string|null;type:'income'|'expense';amountMinor:number;currency:string;description:string;occurredAt:string}){
 const valid=z.object({accountId:z.string().uuid(),categoryId:z.string().uuid().nullable(),type:z.enum(['income','expense']),amountMinor:z.number().int().positive().max(Number.MAX_SAFE_INTEGER),currency:z.string().length(3),description:z.string().trim().min(1).max(240),occurredAt:z.string().datetime({offset:true})}).parse(input);
 const {error}=await client.from('transactions').insert({account_id:valid.accountId,category_id:valid.categoryId,transaction_type:valid.type,amount_minor:valid.amountMinor,currency:valid.currency,description:valid.description,occurred_at:valid.occurredAt});
 if(error) throw backendError('Unable to save transaction',error);
}

const BudgetSchema=z.object({id:z.string().uuid(),name:z.string(),period_type:z.enum(['weekly','monthly','custom']),start_date:z.string(),end_date:z.string(),currency:z.string().length(3),total_limit_minor:MinorAmountSchema,status:z.enum(['active','archived'])});
export async function listBudgets(client:SupabaseClient){const {data,error}=await client.from('budgets').select('id,name,period_type,start_date,end_date,currency,total_limit_minor,status').eq('status','active').order('start_date',{ascending:false});if(error)throw backendError('Unable to load budgets',error);return z.array(BudgetSchema).parse(data??[]);}
export async function createBudget(client:SupabaseClient,input:{name:string;periodType:'monthly'|'weekly';startDate:string;endDate:string;currency:string;limitMinor:number}){const v=z.object({name:z.string().trim().min(1).max(100),periodType:z.enum(['monthly','weekly']),startDate:z.string().date(),endDate:z.string().date(),currency:z.string().length(3),limitMinor:z.number().int().positive().max(Number.MAX_SAFE_INTEGER)}).parse(input);if(v.endDate<v.startDate)throw new Error('End date must be on or after the start date.');const {data,error}=await client.from('budgets').insert({name:v.name,period_type:v.periodType,start_date:v.startDate,end_date:v.endDate,currency:v.currency,total_limit_minor:v.limitMinor}).select('id,name,period_type,start_date,end_date,currency,total_limit_minor,status').single();if(error)throw backendError('Unable to create a budget',error);return BudgetSchema.parse(data);}
export async function updateBudget(client:SupabaseClient,input:{id:string;name:string;limitMinor:number}){const v=z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(100),limitMinor:z.number().int().positive().max(Number.MAX_SAFE_INTEGER)}).parse(input);const {error}=await client.from('budgets').update({name:v.name,total_limit_minor:v.limitMinor,updated_at:new Date().toISOString()}).eq('id',v.id).eq('status','active');if(error)throw backendError('Unable to update budget',error);}
export async function deleteBudget(client:SupabaseClient,id:string){const valid=z.string().uuid().parse(id);const {error}=await client.from('budgets').delete().eq('id',valid);if(error)throw backendError('Unable to delete budget',error);}
const GoalSchema=z.object({id:z.string().uuid(),name:z.string(),target_amount_minor:MinorAmountSchema,currency:z.string().length(3),target_date:z.string().nullable(),status:z.enum(['active','completed','paused','archived'])});
export async function listGoals(client:SupabaseClient){const {data,error}=await client.from('savings_goals').select('id,name,target_amount_minor,currency,target_date,status').in('status',['active','paused']).order('created_at',{ascending:false});if(error)throw backendError('Unable to load savings goals',error);return z.array(GoalSchema).parse(data??[]);}
export async function createGoal(client:SupabaseClient,input:{name:string;targetMinor:number;currency:string;targetDate:string|null}){const v=z.object({name:z.string().trim().min(1).max(100),targetMinor:z.number().int().positive().max(Number.MAX_SAFE_INTEGER),currency:z.string().length(3),targetDate:z.string().date().nullable()}).parse(input);const {data,error}=await client.from('savings_goals').insert({name:v.name,target_amount_minor:v.targetMinor,currency:v.currency,target_date:v.targetDate}).select('id,name,target_amount_minor,currency,target_date,status').single();if(error)throw backendError('Unable to create a savings goal',error);return GoalSchema.parse(data);}
export async function updateGoal(client:SupabaseClient,input:{id:string;name:string;targetMinor:number}){const v=z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(100),targetMinor:z.number().int().positive().max(Number.MAX_SAFE_INTEGER)}).parse(input);const {error}=await client.from('savings_goals').update({name:v.name,target_amount_minor:v.targetMinor,updated_at:new Date().toISOString()}).eq('id',v.id).in('status',['active','paused']);if(error)throw backendError('Unable to update savings goal',error);}
export async function deleteGoal(client:SupabaseClient,id:string){const valid=z.string().uuid().parse(id);const {error}=await client.from('savings_goals').delete().eq('id',valid);if(error)throw backendError('Unable to delete savings goal',error);}
export async function listGoalContributions(client:SupabaseClient,goalId:string){const id=z.string().uuid().parse(goalId);const {data,error}=await client.from('goal_contributions').select('goal_id,amount_minor').eq('goal_id',id);if(error)throw backendError('Unable to load goal progress',error);return z.array(z.object({goal_id:z.string().uuid(),amount_minor:MinorAmountSchema})).parse(data??[]);}
export async function contributeToGoal(client:SupabaseClient,input:{goalId:string;amountMinor:number}){const v=z.object({goalId:z.string().uuid(),amountMinor:z.number().int().positive().max(Number.MAX_SAFE_INTEGER)}).parse(input);const {error}=await client.from('goal_contributions').insert({goal_id:v.goalId,amount_minor:v.amountMinor,contribution_date:new Date().toISOString().slice(0,10)});if(error)throw backendError('Unable to record a contribution',error);}
export async function listAchievements(client:SupabaseClient){const {data,error}=await client.from('achievements').select('id,name,description,category,icon').eq('is_active',true).order('name');if(error)throw backendError('Unable to load achievements',error);return z.array(z.object({id:z.string().uuid(),name:z.string(),description:z.string(),category:z.string(),icon:z.string().nullable()})).parse(data??[]);}
export async function listUserAchievements(client:SupabaseClient){const {data,error}=await client.from('user_achievements').select('achievement_id,earned_at,progress_value,target_value');if(error)throw backendError('Unable to load your achievements',error);return z.array(z.object({achievement_id:z.string().uuid(),earned_at:z.string().nullable(),progress_value:z.number().int(),target_value:z.number().int()})).parse(data??[]);}
const ProfileSchema=z.object({id:z.string().uuid(),display_name:z.string().nullable(),preferred_currency:z.string().length(3),timezone:z.string()});
export async function getProfile(client:SupabaseClient){const {data:{user},error:authError}=await client.auth.getUser();if(authError||!user)throw backendError('Unable to identify your profile',authError??{message:'No signed-in user'});const {data,error}=await client.from('profiles').select('id,display_name,preferred_currency,timezone').eq('id',user.id).maybeSingle();if(error)throw backendError('Unable to load your profile',error);return data?ProfileSchema.parse(data):{id:user.id,display_name:null,preferred_currency:'ZAR',timezone:'Africa/Johannesburg'};}
export async function saveProfile(client:SupabaseClient,input:{displayName:string;preferredCurrency:string}){const v=z.object({displayName:z.string().trim().max(100),preferredCurrency:z.string().trim().length(3).transform(x=>x.toUpperCase())}).parse(input);const {data:{user},error:authError}=await client.auth.getUser();if(authError||!user)throw backendError('Unable to save your profile',authError??{message:'No signed-in user'});const {error}=await client.from('profiles').upsert({id:user.id,display_name:v.displayName||null,preferred_currency:v.preferredCurrency},{onConflict:'id'});if(error)throw backendError('Unable to save your profile',error);}

export { signInWithPassword, registerWithPassword, resendConfirmation, requestPasswordReset } from './auth';



