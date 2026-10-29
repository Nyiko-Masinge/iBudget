import { budgetRemaining, healthZone, safeToSpend, sumExpenses, sumIncome } from '../../src/domain/money';

describe('minor-unit financial rules', () => {
 it('aggregates income and excludes transfers', () => expect(sumIncome([{kind:'income',amountMinor:15000},{kind:'transfer',amountMinor:4200}])).toBe(15000));
 it('nets refunds against expenses', () => expect(sumExpenses([{kind:'expense',amountMinor:10000},{kind:'refund',amountMinor:2500},{kind:'transfer',amountMinor:3000}])).toBe(7500));
 it('allows negative budget remaining to indicate an overrun', () => expect(budgetRemaining({limitMinor:100,spentMinor:101})).toBe(-1));
 it('clamps safe-to-spend at zero', () => expect(safeToSpend(500,200,400)).toBe(0));
 it('classifies threshold edges consistently', () => { expect(healthZone(21,100)).toBe('green'); expect(healthZone(20,100)).toBe('yellow'); expect(healthZone(4,100)).toBe('red'); });
});
