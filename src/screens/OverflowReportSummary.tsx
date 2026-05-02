import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import apiClient from '../api/apiClient';
import { Domain } from './NetPayScreen';
import axios from 'axios'; // Added axios import

const OverflowReportSummary = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const DEFAULT_LIMITS: Record<string, number> = {
        'SUPER': 70,
        'BOX': 70,
        'AB': 170,
        'BC': 170,
        'AC': 170,
        'A': 1500,
        'B': 1500,
        'C': 1500,
    };

    const { report, loggedInUser, allUsersData, currentLevelUser } = (route.params as any) || {};
    const [reportData, setReportData] = useState(report || {});
    const [loading, setLoading] = useState(false);
    const [limitsMap, setLimitsMap] = useState<Record<string, Record<string, number>>>({});

    const {
        count = 0,
        amount = 0,
        date = '',
        fromDate = '',
        toDate = '',
        createdBy,
        timeLabel,
        entries = [],
        byAgent = [],
    } = reportData;

    const fetchReportData = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                fromDate,
                toDate,
                createdBy: currentLevelUser || createdBy || "",
                timeLabel: timeLabel || "all",
                loggedInUser,
                view: "detailed", // Changed to detailed to get entry breakdown for descendants
                // Pass extra filters if they exist
                ...(report.filters || {})
            };

            const res = await axios.get(`${Domain}/report/salesReport`, { params });
            if (res.data) {
                setReportData(res.data);
            }
        } catch (err: any) {
            console.error("❌ Error auto-refreshing overflow summary:", err);
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, createdBy, timeLabel, loggedInUser, currentLevelUser, report.filters]);

    useFocusEffect(
        useCallback(() => {
            fetchReportData();
        }, [fetchReportData])
    );

    const normalizeDrawTime = (t: string) => {
        if (!t) return 'DEAR 1 PM'; // Fallback
        const upper = t.toUpperCase().trim();
        if (upper.includes('LSK 3 PM') || upper.includes('KERALA 3 PM') || upper.includes('LSK3') || upper.includes('KERALA3')) return 'KERALA 3 PM';
        if (upper.includes('DEAR 1') || upper.includes('DEAR1')) return 'DEAR 1 PM';
        if (upper.includes('DEAR 6') || upper.includes('DEAR6')) return 'DEAR 6 PM';
        if (upper.includes('DEAR 8') || upper.includes('DEAR8')) return 'DEAR 8 PM';
        return t;
    };

    const fetchLimits = useCallback(async () => {
        try {
            const slots = ['DEAR 1 PM', 'KERALA 3 PM', 'DEAR 6 PM', 'DEAR 8 PM'];
            const results = await Promise.all(
                slots.map(slot => apiClient.get(`/overflow-limit/by-drawtime?drawTime=${slot}`).catch(() => ({ data: { limits: {} } })))
            );

            const newMap: Record<string, Record<string, number>> = {};
            slots.forEach((slot, index) => {
                newMap[slot] = { ...DEFAULT_LIMITS, ...(results[index]?.data?.limits || {}) };
            });
            setLimitsMap(newMap);
        } catch (error: any) {
            if (error.response?.status !== 404) {
                console.error('Error fetching limits for summary:', error);
            }
        }
    }, []);

    useEffect(() => {
        fetchLimits();
    }, [fetchLimits]);

    const extractBetType = (typeStr: string) => {
        if (!typeStr) return "";
        const parts = typeStr.split(/[-_]/);
        return parts[parts.length - 1].toUpperCase().trim();
    };

    // Hierarchy Logic Helper
    const getAllDescendants = (parent: string, users: any[]): string[] => {
        let descendants: string[] = [];
        const children = users.filter((u) => u.createdBy === parent);
        children.forEach((child) => {
            descendants.push(child.username);
            descendants = [...descendants, ...getAllDescendants(child.username, users)];
        });
        return descendants;
    };

    const getBranchOverflow = (agentName: string) => {
        if (!allUsersData) return { count: 0, overCount: 0 };
        const descendants = getAllDescendants(agentName, allUsersData);
        const branchUsernames = [agentName, ...descendants];

        let totalQty = 0;
        let totalOver = 0;

        branchUsernames.forEach((uname) => {
            // Find entries for this agent in the reports data
            const agentEntries = entries.filter((e: any) => (e.createdBy || e.agent || e.A) === uname);
            agentEntries.forEach((item: any) => {
                const qty = item.count || item.total || item.qty || 0;
                const rawTicket = item.ticketName || item.ticket || item.type || '';
                const ticketKey = extractBetType(rawTicket);

                // SLOT-AWARE LIMITS
                const entryDraw = normalizeDrawTime(item.drawTime || item.timeLabel || timeLabel);
                const slotLimits = limitsMap[entryDraw] || limitsMap['DEAR 1 PM'] || DEFAULT_LIMITS;

                const limit = slotLimits[ticketKey] || slotLimits[rawTicket] || 0;
                const over = Math.max(0, qty - limit);

                totalQty += qty;
                totalOver += over;
            });
        });

        return { count: totalQty, overCount: totalOver };
    };

    const effectiveParent = currentLevelUser || createdBy || loggedInUser;

    const currentTotal = getBranchOverflow(effectiveParent);

    // Direct Sales (Self)
    const selfEntries = entries.filter((e: any) => (e.createdBy || e.agent || e.A) === effectiveParent);
    let selfQty = 0;
    let selfOver = 0;
    selfEntries.forEach((item: any) => {
        const qty = item.count || item.total || 0;
        const rawTicket = item.ticketName || item.ticket || item.type || '';
        const ticketKey = extractBetType(rawTicket);

        // SLOT-AWARE LIMITS
        const entryDraw = normalizeDrawTime(item.drawTime || item.timeLabel || timeLabel);
        const slotLimits = limitsMap[entryDraw] || limitsMap['DEAR 1 PM'] || DEFAULT_LIMITS;

        const limit = slotLimits[ticketKey] || slotLimits[rawTicket] || 0;
        const over = Math.max(0, qty - limit);
        selfQty += qty;
        selfOver += over;
    });

    const displayedAgents = (allUsersData || [])
        .filter((u: any) => u.createdBy === effectiveParent)
        .map((u: any) => {
            const totals = getBranchOverflow(u.username);
            if (totals.count > 0 || totals.overCount > 0) {
                return {
                    agent: u.username,
                    count: totals.count,
                    overCount: totals.overCount,
                    usertype: u.usertype,
                };
            }
            return null;
        })
        .filter((a: any) => a !== null);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Overflow Summary</Text>
                    {effectiveParent !== loggedInUser && (
                        <Text style={{ fontSize: 12, color: '#666' }}>{effectiveParent}</Text>
                    )}
                </View>
                <TouchableOpacity onPress={() => (navigation as any).navigate('Main')}>
                    <AntDesign name="home" size={24} color="red" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                {/* Branch Summary Card */}
                <View style={styles.card}>
                    <Text style={styles.dateText}>{fromDate}</Text>
                    {timeLabel && timeLabel.toLowerCase() !== 'all' && <Text style={styles.timeText}>{timeLabel}</Text>}

                    <View style={styles.row}>
                        <Text style={styles.label}>Total Quantity :</Text>
                        <Text style={styles.value}>{currentTotal?.count}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Overflow :</Text>
                        <Text style={[styles.value, { color: '#ff4d4d' }]}>{currentTotal?.overCount}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => (navigation as any).navigate('overflowresult', {
                            data: entries.filter((e: any) => [effectiveParent, ...getAllDescendants(effectiveParent, allUsersData)].includes(e.createdBy || e.agent)),
                            filters: { ...report.filters, date: fromDate, time: timeLabel, agent: effectiveParent }
                        })}
                    >
                        <Text style={styles.buttonText}>View All Detailed</Text>
                    </TouchableOpacity>
                </View>

                <View>
                    <Text style={[styles.headerTitle, { textAlign: 'center', marginVertical: 15, color: '#008080' }]}>
                        Breakdown for {effectiveParent}
                    </Text>

                    {/* Self Row */}
                    {(selfQty > 0 || selfOver > 0) && (
                        <View style={[styles.card, styles.agentCard, { backgroundColor: '#fff9f9' }]}>
                            <View style={styles.agentHeader}>
                                <Ionicons name="person-circle" size={20} color="#333" />
                                <Text style={[styles.agentName, { color: '#333' }]}>{'(Direct Overflows)'}</Text>
                                <Text style={styles.userTypeBadge}>SELF</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Quantity :</Text>
                                <Text style={styles.value}>{selfQty}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Overflow :</Text>
                                <Text style={[styles.value, { color: '#ff4d4d' }]}>{selfOver}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: '#211e1f' }]}
                                onPress={() => (navigation as any).navigate('overflowresult', {
                                    data: entries.filter((e: any) => (e.createdBy || e.agent) === effectiveParent),
                                    filters: { ...report.filters, date: fromDate, time: timeLabel, agent: effectiveParent, showOnlyDirect: true }
                                })}
                            >
                                <Text style={styles.buttonText}>View Direct Entries</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Child Rows */}
                    {displayedAgents.map((agentData: any, index: number) => (
                        <View key={`${agentData.agent}-${index}`} style={[styles.card, styles.agentCard]}>
                            <View style={styles.agentHeader}>
                                <Ionicons name="person-circle" size={20} color="#008080" />
                                <Text style={styles.agentName}>{agentData.agent}</Text>
                                <Text style={styles.userTypeBadge}>{agentData.usertype?.toUpperCase()}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Quantity :</Text>
                                <Text style={styles.value}>{agentData.count}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Overflow :</Text>
                                <Text style={[styles.value, { color: '#ff4d4d' }]}>{agentData.overCount}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.button, agentData.usertype === 'master' ? {} : styles.agentButton]}
                                onPress={() => {
                                    if (agentData.usertype === 'master') {
                                        (navigation as any).push('OverflowReportSummary', {
                                            report: { ...report, createdBy: agentData.agent },
                                            loggedInUser,
                                            allUsersData,
                                            currentLevelUser: agentData.agent
                                        });
                                    } else {
                                        (navigation as any).navigate('overflowresult', {
                                            data: entries.filter((e: any) => (e.createdBy || e.agent) === agentData.agent),
                                            filters: { ...report.filters, date: fromDate, time: timeLabel, agent: agentData.agent }
                                        });
                                    }
                                }}
                            >
                                <Text style={styles.buttonText}>
                                    {agentData.usertype === 'master' ? 'View Children' : 'View Detailed'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default OverflowReportSummary;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f1f1', padding: 10, marginTop: 30 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ccc',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    card: {
        backgroundColor: '#fff', borderRadius: 6, padding: 15,
        marginTop: 15, shadowColor: '#000', elevation: 2,
    },
    agentCard: { borderLeftWidth: 3, borderLeftColor: '#008080' },
    agentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    agentName: { fontSize: 18, fontWeight: 'bold', color: '#008080', marginLeft: 8 },
    row: { flexDirection: 'row', marginTop: 10, alignItems: 'center', justifyContent: 'space-between' },
    label: { fontSize: 16, color: '#333' },
    value: { fontSize: 16, fontWeight: 'bold' },
    dateText: { fontSize: 16, color: '#008080', textAlign: 'center', fontWeight: 'bold' },
    timeText: { fontSize: 14, color: '#666', textAlign: 'center', fontStyle: 'italic', marginTop: 4 },
    button: { backgroundColor: '#211e1f', paddingVertical: 12, borderRadius: 5, marginTop: 20 },
    agentButton: { backgroundColor: '#211e1f' },
    buttonText: { textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: 'bold' },
    userTypeBadge: {
        fontSize: 10,
        backgroundColor: '#eee',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        color: '#666',
        fontWeight: 'bold',
    },
});
