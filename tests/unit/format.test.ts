import { formatMoney } from '@ibudget/finance-core';
describe('money display', () => { it('formats ZAR from minor units', () => expect(formatMoney(12550, 'ZAR', 'en-US')).toContain('125.50')); });
