import { z } from 'zod';
export const TransactionTypeSchema = z.enum(['income','expense','transfer','refund']);
export const AmountMinorSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export interface LedgerTransaction { kind: z.infer<typeof TransactionTypeSchema>; amountMinor: number; }
export interface BudgetPosition { limitMinor: number; spentMinor: number; }
function safeMinor(value:number){if(!Number.isSafeInteger(value))throw new RangeError('Money value is outside the supported safe integer range.');return value;}
function addMoney(a:number,b:number){return safeMinor(a+b);}
export function sumIncome(rows:LedgerTransaction[]):number{return rows.reduce((total,row)=>row.kind==='income'?addMoney(total,safeMinor(row.amountMinor)):total,0);}
export function sumExpenses(rows:LedgerTransaction[]):number{return rows.reduce((total,row)=>row.kind==='expense'?addMoney(total,safeMinor(row.amountMinor)):row.kind==='refund'?addMoney(total,-safeMinor(row.amountMinor)):total,0);}
export function budgetRemaining(budget:BudgetPosition):number{return safeMinor(safeMinor(budget.limitMinor)-safeMinor(budget.spentMinor));}
export function safeToSpend(balanceMinor:number,protectedCommitmentsMinor:number,bufferMinor:number):number{return Math.max(0,safeMinor(safeMinor(balanceMinor)-safeMinor(protectedCommitmentsMinor)-safeMinor(bufferMinor)));}
export function healthZone(remainingMinor:number,limitMinor:number):'green'|'yellow'|'red'{safeMinor(remainingMinor);safeMinor(limitMinor);if(limitMinor<=0||remainingMinor<0)return'red';const ratio=remainingMinor/limitMinor;return ratio>0.2?'green':ratio>=0.05?'yellow':'red';}
export function formatMoney(minor:number,currency='ZAR',locale='en-ZA'):string{return new Intl.NumberFormat(locale,{style:'currency',currency}).format(safeMinor(minor)/100);}
