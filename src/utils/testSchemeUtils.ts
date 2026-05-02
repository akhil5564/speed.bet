import { calculateDynamicSuperAmount, SchemeGroup } from './schemeUtils';

const mockSchemeGroups: SchemeGroup[] = [
    {
        group: 'Group 3-SUPER',
        rows: [
            { scheme: 'SUPER', pos: 1, count: 1, amount: 5000, super: 400 },
            { scheme: 'SUPER', pos: 6, count: 1, amount: 20, super: 10 },
        ],
    },
    {
        group: 'Group 3-BOX',
        rows: [
            { scheme: 'BOX', pos: 1, count: 1, amount: 5000, super: 300 },
            { scheme: 'BOX', pos: 6, count: 1, amount: 800, super: 30 },
        ],
    },
];

const testCases = [
    {
        name: 'SUPER 1st Prize',
        win: { type: 'D-1-SUPER', winType: 'SUPER 1', count: 1 },
        expectedSuper: 400
    },
    {
        name: 'SUPER other (Consolation)',
        win: { type: 'D-1-SUPER', winType: 'SUPER other', count: 1 },
        expectedSuper: 10
    },
    {
        name: 'BOX Perfect (1st)',
        win: { type: 'D-1-BOX', winType: 'BOX perfect', count: 1 },
        expectedSuper: 300
    },
    {
        name: 'BOX Permutation (Consolation/6th)',
        win: { type: 'D-1-BOX', winType: 'BOX permutation', count: 1 },
        expectedSuper: 30
    }
];

testCases.forEach(tc => {
    const result = calculateDynamicSuperAmount(tc.win, mockSchemeGroups, 'DEAR 1 PM');
    console.log(`Test [${tc.name}]: Expected ${tc.expectedSuper}, Got ${result} - ${result === tc.expectedSuper ? '✅ PASS' : '❌ FAIL'}`);
});
