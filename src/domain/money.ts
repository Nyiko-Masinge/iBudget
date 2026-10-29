export type TransactionKind = 'income' | 'expense' | 'transfer' | 'refund';
export interface LedgerTransaction { kind: TransactionKind; amountMinor: number; }
export interface BudgetPosition { limitMinor: number; spentMinor: number; }

export function sumIncome(rows: LedgerTransaction[]): number {
  return rows.reduce((total, row) => total + (row.kind === 'income' ? row.amountMinor : 0), 0);
}
export function sumExpenses(rows: LedgerTransaction[]): number {
  return rows.reduce((total, row) => total + (row.kind === 'expense' ? row.amountMinor : row.kind === 'refund' ? -row.amountMinor : 0), 0);
}
export function budgetRemaining(budget: BudgetPosition): number {
  return budget.limitMinor - budget.spentMinor;
}
export function safeToSpend(balanceMinor: number, protectedCommitmentsMinor: number, bufferMinor: number): number {
  return Math.max(0, balanceMinor - protectedCommitmentsMinor - bufferMinor);
}
export function healthZone(remainingMinor: number, limitMinor: number): 'green' | 'yellow' | 'red' {
  if (limitMinor <= 0 || remainingMinor < 0) return 'red';
  const ratio = remainingMinor / limitMinor;
  return ratio > 0.2 ? 'green' : ratio >= 0.05 ? 'yellow' : 'red';
}
export function formatMoney(minor: number, currency = 'ZAR', locale = 'en-ZA'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100);
}
