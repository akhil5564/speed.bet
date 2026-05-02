import { Domain } from '../screens/NetPayScreen';

export interface SchemeRow {
    scheme: string;
    pos: number;
    count: number;
    amount: number;
    super: number;
    _id?: string;
}

export interface SchemeGroup {
    group: string;
    rows: SchemeRow[];
}

const initialSchemeData: SchemeGroup[] = [
    {
        group: 'Group 1',
        rows: [
            { scheme: 'A', pos: 1, count: 1, amount: 100, super: 0 },
            { scheme: 'B', pos: 1, count: 1, amount: 100, super: 0 },
            { scheme: 'C', pos: 1, count: 1, amount: 100, super: 0 },
        ],
    },
    {
        group: 'Group 2',
        rows: [
            { scheme: 'AB', pos: 1, count: 1, amount: 700, super: 30 },
            { scheme: 'BC', pos: 1, count: 1, amount: 700, super: 30 },
            { scheme: 'AC', pos: 1, count: 1, amount: 700, super: 30 },
        ],
    },
    {
        group: 'Group 3-SUPER',
        rows: [
            { scheme: 'SUPER', pos: 1, count: 1, amount: 5000, super: 400 },
            { scheme: 'SUPER', pos: 2, count: 1, amount: 500, super: 50 },
            { scheme: 'SUPER', pos: 3, count: 1, amount: 250, super: 20 },
            { scheme: 'SUPER', pos: 4, count: 1, amount: 100, super: 20 },
            { scheme: 'SUPER', pos: 5, count: 1, amount: 50, super: 20 },
            { scheme: 'SUPER', pos: 6, count: 1, amount: 20, super: 10 },
        ],
    },
    {
        group: 'Group 3-BOX',
        rows: [
            { scheme: 'BOX', pos: 1, count: 1, amount: 3000, super: 300 },
            { scheme: 'BOX', pos: 2, count: 1, amount: 800, super: 30 },
            { scheme: 'BOX', pos: 3, count: 1, amount: 800, super: 30 },
            { scheme: 'BOX', pos: 4, count: 1, amount: 800, super: 30 },
            { scheme: 'BOX', pos: 5, count: 1, amount: 800, super: 30 },
            { scheme: 'BOX', pos: 6, count: 1, amount: 800, super: 30 },
        ],
    },
];

const schemeCache: Record<string, SchemeGroup[]> = {};

/**
 * Clears the scheme cache to ensure fresh data is fetched after updates.
 */
export const clearSchemeCache = () => {
    for (const key in schemeCache) {
        delete schemeCache[key];
    }
};

/**
 * Re-groups flat backend data into the structured format required by the UI and calculations.
 */
const regroupData = (inputData: any): SchemeGroup[] | null => {
    if (!inputData) return null;

    const rawList = Array.isArray(inputData)
        ? inputData
        : (inputData.draw?.schemes || inputData.schemes || inputData.data?.draw?.schemes || inputData.data?.schemes || inputData.data || null);

    if (!rawList || !Array.isArray(rawList)) return null;

    // Flatten if input is already partially grouped
    const flatData: any[] = [];
    rawList.forEach((item, index) => {
        if (item && item.rows && Array.isArray(item.rows)) {
            item.rows.forEach((r: any) => {
                flatData.push({ ...r, group: item.group || r.group });
            });
        } else if (item && typeof item === 'object') {
            flatData.push(item);
        }
    });

    console.log(`[schemeUtils] flatData size: ${flatData.length}. Sample:`, JSON.stringify(flatData.slice(0, 2)));

    const grouped = initialSchemeData.map(g => ({ ...g, rows: [] as SchemeRow[] }));

    flatData.forEach(item => {
        let groupIndex = grouped.findIndex(g => g.group === item.group);

        if (groupIndex === -1 && item.group) {
            groupIndex = grouped.findIndex(g =>
                item.group.toLowerCase().includes(g.group.toLowerCase()) ||
                g.group.toLowerCase().includes(item.group.toLowerCase())
            );
        }

        if (groupIndex === 2 && item.scheme === 'BOX') {
            groupIndex = 3;
        }

        if (groupIndex !== -1) {
            const { group, ...row } = item;
            if (row.scheme || row.pos) {
                grouped[groupIndex].rows.push(row as SchemeRow);
            }
        } else {
            console.log(`[schemeUtils] FAILED to match group for item:`, { group: item.group, scheme: item.scheme });
        }
    });

    return grouped.map((g, i) => {
        if (g.rows.length === 0) return initialSchemeData[i];
        return {
            ...g,
            rows: g.rows.map((r: any) => ({
                ...r,
                super: (r.super !== undefined && r.super !== null && !isNaN(r.super)) ? Number(r.super) : 0
            }))
        };
    });
};

import apiClient from '../api/apiClient';

/**
 * Generates a consistent cache key for a specific draw and scheme.
 */
export const getSchemeCacheKey = (drawName: string, schemeId: string): string => {
    const dName = mapDrawNameForApi(drawName || 'DEAR 1 PM');
    let tabNum = 1;
    if (schemeId && typeof schemeId === 'string' && schemeId.toUpperCase() !== 'N/A') {
        tabNum = parseInt(schemeId.replace(/[^0-9]/g, '')) || 1;
    }
    return `${dName}|${tabNum}`;
};

/**
 * Maps varying draw names to the standardized format expected by the API.
 */
export const mapDrawNameForApi = (name: string): string => {
    const n = (name || '').toString().trim().toUpperCase();

    if (!n || n === 'ALL') return 'DEAR 1 PM';

    // Mapping based on NetPayScreen logic and user feedback
    if (n.includes('LSK') || n.includes('KERALA')) return 'LSK 3 PM';
    if (n.includes('DEAR 1') || n.includes('1PM')) return 'DEAR 1 PM';
    if (n.includes('DEAR 6') || n.includes('6PM')) return 'DEAR 6 PM';
    if (n.includes('DEAR 8') || n.includes('8PM')) return 'DEAR 8 PM';

    return n;
};

/**
 * Fetches scheme details for a specific draw and tab number.
 * Caches the results to avoid redundant API calls.
 */
export const fetchSchemeData = async (drawName: string, schemeId: string): Promise<SchemeGroup[] | null> => {
    const cacheKey = getSchemeCacheKey(drawName, schemeId);

    if (schemeCache[cacheKey]) {
        return schemeCache[cacheKey];
    }

    try {
        const [dName, tabNumStr] = cacheKey.split('|');
        const tabNum = parseInt(tabNumStr, 10) || 1;
        const url = `/draw-scheme`;
        console.log(`[schemeUtils] fetchSchemeData: cacheKey="${cacheKey}" -> URL: ${url}?activeTab=${tabNum}&drawName=${dName}`);

        const response = await apiClient.get(url, {
            params: { activeTab: tabNum, drawName: dName }
        });

        const data = response.data;

        if (response.status === 200 && data) {
            const schemes = regroupData(data);
            if (schemes) {
                schemeCache[cacheKey] = schemes;
                return schemes;
            }
        }
    } catch (error: any) {
        // Silently fail if scheme not found - calc will use 0 or defaults
    }

    return null;
};

/**
 * Normalizes the bet type from full strings like "D-1-SUPER" or "A" to standard keys.
 */
export const normalizeBetType = (typeStr: string): string => {
    if (!typeStr) return '';
    const parts = typeStr.split('-');
    let type = parts[parts.length - 1].toUpperCase();
    if (type === 'A' || type === 'B' || type === 'C') return type;
    if (type.includes('AB') || type.includes('BC') || type.includes('AC')) return type;
    if (type.includes('SUPER')) return 'SUPER';
    if (type.includes('BOX')) return 'BOX';
    return type;
};

/**
 * Extracts the draw name from a bill object and maps it to the standardized API format.
 */
export const extractDrawName = (bill: any, fallback?: string): string => {
    const dName = (bill.drawName || bill.timeLabel || bill.draw || '').toString();
    if (dName && dName.toUpperCase().trim() !== 'ALL') {
        const mapped = mapDrawNameForApi(dName);
        console.log(`[schemeUtils] extractDrawName: bill.drawName="${dName}" -> "${mapped}"`);
        return mapped;
    }

    const fName = (fallback || '').toString();
    if (fName && fName.toUpperCase().trim() !== 'ALL') {
        const mapped = mapDrawNameForApi(fName);
        console.log(`[schemeUtils] extractDrawName: fallback (time)="${fName}" -> "${mapped}"`);
        return mapped;
    }

    // Final default
    console.log(`[schemeUtils] extractDrawName: defaulted to "DEAR 1 PM"`);
    return 'DEAR 1 PM';
};

/**
 * Calculates the total "Super" (commission/prize) amount for a winning entry.
 */
export const calculateDynamicSuperAmount = (
    win: any,
    schemeGroups: SchemeGroup[],
    drawName: string
): number => {
    if (!schemeGroups) return 0;

    const betType = normalizeBetType(win.type);
    const winTypeStr = (win.winType || '').toUpperCase();

    let targetGroup = '';
    if (betType === 'A' || betType === 'B' || betType === 'C') {
        targetGroup = 'Group 1';
    } else if (['AB', 'BC', 'AC'].includes(betType)) {
        targetGroup = 'Group 2';
    } else if (betType === 'SUPER') {
        targetGroup = 'Group 3-SUPER';
    } else if (betType === 'BOX') {
        targetGroup = 'Group 3-BOX';
    }

    const group = schemeGroups.find(g => g.group === targetGroup);
    if (!group) {
        console.log(`[schemeUtils] No group found for ${targetGroup} (betType: ${betType}, draw: ${drawName})`);
        return 0;
    }

    let row: SchemeRow | undefined;
    if (betType === 'SUPER' || betType === 'BOX') {
        const match = winTypeStr.match(/(\d+)/);
        const pos = match
            ? parseInt(match[1], 10)
            : (winTypeStr.includes("OTHER") || winTypeStr.includes("PERMUTATION") ? 6 : 1);
        row = group.rows.find(r => r.pos === pos);
    } else {
        row = group.rows.find(r => r.scheme === betType);
    }

    if (row) {
        const amount = (row.super || 0) * (win.count || 1);
        console.log(`[schemeUtils] Calc: ${win.type} -> row.super=${row.super} * ${win.count} = ${amount}`);
        return amount;
    }

    console.log(`[schemeUtils] No row found in ${targetGroup} for ${betType} / ${winTypeStr}`);
    return 0;
};
