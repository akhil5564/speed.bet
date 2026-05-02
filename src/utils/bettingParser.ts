/**
 * Utility for parsing betting entries from text (e.g., WhatsApp messages)
 */

export interface RawEntry {
    number: string;
    count: number;
    type: string;
}

/**
 * Normalizes and cleans WhatsApp text, then parses it into RawEntry objects.
 * Skips lines that do not match supported patterns.
 */
export const parseBettingText = (text: string): RawEntry[] => {
    if (!text) return [];

    const lines = text.split(/\r?\n/);
    const entries: RawEntry[] = [];

    for (let line of lines) {
        // 1. Pre-process: Strip WhatsApp headers and normalize
        // Remove [DD/MM, HH:MM AM/PM] Name: 
        line = line.replace(/^\[\d{2}\/\d{2},\s*\d{1,2}:\d{2}\s*(?:am|pm)\]\s*[^:]+:\s*/i, '').trim();

        if (!line) continue;
        if (line.toLowerCase().includes('set')) continue;

        // Common separator regex: includes space, dot, @, #, hyphen, underscore, star, plus, equals, comma
        const sep = '[\\s\\.@#\\-_\\*\\+=,]*';
        const sepAtLeastOne = '[\\s\\.@#\\-_\\*\\+=,]+';

        // 2. Matching Patterns

        // ------------- ABC pattern (abc.2.15, abc-4=50 → Number 4, Count 50 for A, B, C each) -------------
        const abcMatch = line.match(new RegExp(`^abc${sep}(\\d{1,3})${sep}(\\d+)$`, 'i'));
        if (abcMatch) {
            const [, number, count] = abcMatch;
            ['A', 'B', 'C'].forEach(type => {
                entries.push({ number, count: parseInt(count, 10), type });
            });
            continue;
        }

        // ------------- Single type pattern (A-4-20, A=4=20 → Number 4, Count 20) -------------
        const singleMatch = line.match(new RegExp(`^([ABC])${sep}(\\d{1,3})${sep}(\\d+)$`, 'i'));
        if (singleMatch) {
            const [, letter, number, count] = singleMatch;
            entries.push({ number, count: parseInt(count, 10), type: letter.toUpperCase() });
            continue;
        }

        // ------------- Pairs (AB, BC, AC) -------------
        const pairMatch = line.match(new RegExp(`^(ab|bc|ac)${sepAtLeastOne}(\\d+)${sepAtLeastOne}(\\d+)$`, 'i'));
        if (pairMatch) {
            const [, pair, number, count] = pairMatch;
            entries.push({ number, count: parseInt(count, 10), type: pair.toUpperCase() });
            continue;
        }

        // ------------- Dot/Triple pattern (664.5.3 → 664 5 SUPER, 664 3 BOX) -------------
        const tripleMatch = line.match(new RegExp(`^(\\d{2,3})${sepAtLeastOne}(\\d+)${sepAtLeastOne}(\\d+)$`));
        if (tripleMatch) {
            const [, number, superCount, boxCount] = tripleMatch;
            entries.push({ number, count: parseInt(superCount, 10), type: 'SUPER' });
            entries.push({ number, count: parseInt(boxCount, 10), type: 'BOX' });
            continue;
        }

        // ------------- Plus pattern (212+3+2 → 212 3 SUPER, 212 2 BOX) -------------
        const plusMatch = line.match(/^(\d{2,3})\+(\d+)\+(\d+)$/);
        if (plusMatch) {
            const [, number, count1, count2] = plusMatch;
            entries.push({ number, count: parseInt(count1, 10), type: 'SUPER' });
            entries.push({ number, count: parseInt(count2, 10), type: 'BOX' });
            continue;
        }

        // ------------- Robust Generic Parser (Handles 015,1box, 138-10-box, 123 10, etc.) -------------
        const genericMatch = line.match(new RegExp(`^(\\d{1,4})${sepAtLeastOne}(\\d+)\\s*${sep}(box|b)?$`, 'i'));
        if (genericMatch) {
            const [, number, count, typeSuffix] = genericMatch;
            const isBox = !!typeSuffix;
            const finalType = isBox ? 'BOX' : (number.length >= 2 ? 'SUPER' : 'DEFAULT');
            entries.push({ number, count: parseInt(count, 10), type: finalType });
            continue;
        }

        // ------------- Standard space/symbol separated fallback -------------
        const simpleMatch = line.match(/^(\d{1,4})\s*[^\w\s]*\s*(\d+)/);
        if (simpleMatch) {
            const [, number, count] = simpleMatch;
            entries.push({ number, count: parseInt(count, 10), type: 'DEFAULT' });
            continue;
        }

        // If no patterns match, we skip the line (as requested by user)
        console.log('Skipping unsupported line:', line);
    }

    return entries;
};
