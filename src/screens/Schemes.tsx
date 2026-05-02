import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Scheme 1 (default)
const scheme1 = [
  {
    group: 'Group 1',
    items: [
      { name: 'DEAR1-A', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
      { name: 'DEAR1-B', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
      { name: 'DEAR1-C', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
    ],
  },
  {
    group: 'Group 2',
    items: [
      { name: 'DEAR1-AB', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 30 }] },
      { name: 'DEAR1-BC', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 30 }] },
      { name: 'DEAR1-AC', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 30 }] },
    ],
  },
  {
    group: 'Group 3',
    items: [
      {
        name: 'DEAR1-SUPER',
        rate: 8,
        data: [
          { position: 1, count: 1, amount: 5000, super: 400 },
          { position: 2, count: 1, amount: 500, super: 50 },
          { position: 3, count: 1, amount: 250, super: 20 },
          { position: 4, count: 1, amount: 100, super: 20 },
          { position: 5, count: 1, amount: 50, super: 20 },
          { position: 6, count: 30, amount: 20, super: 10 },
        ],
      },
      {
        name: 'DEAR1-BOX',
        rate: 8,
        data: [{ position: 1, count: 1, amount: 3000, super: 300 }],
      },
    ],
  },
];

// Scheme 2
const scheme2 = [
  {
    group: 'Group 2',
    items: [
      { name: 'DEAR1-AB', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 15 }] },
      { name: 'DEAR1-BC', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 15 }] },
      { name: 'DEAR1-AC', rate: 8, data: [{ position: 1, count: 1, amount: 700, super: 15 }] },
    ],
  },
  {
    group: 'Group 1',
    items: [
      { name: 'DEAR1-A', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
      { name: 'DEAR1-B', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
      { name: 'DEAR1-C', rate: 10.6, data: [{ position: 1, count: 1, amount: 100, super: 0 }] },
    ],
  },
  {
    group: 'Group 3',
    items: [
      {
        name: 'DEAR1-SUPER',
        rate: 8,
        data: [
          { position: 1, count: 1, amount: 5000, super: 400 },
          { position: 2, count: 1, amount: 500, super: 50 },
          { position: 3, count: 1, amount: 250, super: 20 },
          { position: 4, count: 1, amount: 100, super: 20 },
          { position: 5, count: 1, amount: 50, super: 20 },
          { position: 6, count: 30, amount: 20, super: 10 },
        ],
      },
      {
        name: 'DEAR1-BOX',
        rate: 8,
        data: [{ position: 1, count: 1, amount: 3000, super: 150 }],
      },
    ],
  },
];

const SchemeCard = ({ name, rate, group, data }: any) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.groupBadge}>{group}</Text>
    </View>
    <Text style={styles.rate}>
      Rate: <Text style={styles.bold}>{rate}</Text>
    </Text>
    <View style={styles.tableHeader}>
      <Text style={styles.cellHeader}>Pos</Text>
      <Text style={styles.cellHeader}>Count</Text>
      <Text style={styles.cellHeader}>Amount</Text>
      <Text style={styles.cellHeader}>Super</Text>
    </View>
    {data.map((item: any, index: number) => (
      <View
        key={index}
        style={[
          styles.tableRow,
          index % 2 === 0 && { backgroundColor: '#f0f4ff' },
        ]}
      >
        <Text style={styles.cell}>{item.position}</Text>
        <Text style={styles.cell}>{item.count}</Text>
        <Text style={styles.cell}>{item.amount}</Text>
        <Text style={styles.cell}>{item.super}</Text>
      </View>
    ))}
  </View>
);

import { Domain } from './NetPayScreen';

const SchemeScreen = () => {
  const [userScheme, setUserScheme] = useState<string>('');
  const [schemeData, setSchemeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [realRates, setRealRates] = useState<Record<string, number>>({});
  const [selectedDraw, setSelectedDraw] = useState('DEAR 1');

  const drawList = ['DEAR 1', 'DEAR 6', 'DEAR 8', 'KERALA 3'];

  const drawMap: Record<string, string> = {
    'DEAR 1': 'DEAR 1 PM',
    'DEAR 6': 'DEAR 6 PM',
    'DEAR 8': 'DEAR 8 PM',
    'KERALA 3': 'LSK 3 PM',
  };

  const prefixMap: Record<string, string> = {
    'DEAR 1': 'DEAR1',
    'DEAR 6': 'DEAR6',
    'DEAR 8': 'DEAR8',
    'KERALA 3': 'LSK3',
  };

  useEffect(() => {
    const fetchSchemeAndRates = async () => {
      setLoading(true);
      const storedScheme = await AsyncStorage.getItem('scheme');
      const username = await AsyncStorage.getItem('username');
      const scheme = storedScheme || '';
      setUserScheme(scheme);

      let tabNum = 1;
      if (scheme.toLowerCase().includes('scheme')) {
        tabNum = parseInt(scheme.replace(/scheme\s*/i, '')) || 1;
      }

      try {
        const backendDraw = drawMap[selectedDraw];
        const schemeUrl = `${Domain}/draw-scheme?activeTab=${tabNum}&drawName=${encodeURIComponent(backendDraw)}`;
        const schemeRes = await axios.get(schemeUrl);
        const schemeJson = schemeRes.data;

        // Use regroupData logic if available, or just set it
        // The CreateSchemeScreen.tsx has a regroupData, but Schemes.tsx is simple.
        // Looking at Schemes.tsx, it expect items array.
        // Let's adapt the fetched data to the format Schemes.tsx expects.
        if (schemeJson && (schemeJson.schemes || schemeJson.draw?.schemes)) {
          const rawSchemes = schemeJson.schemes || schemeJson.draw?.schemes;
          // Simple transform if needed, but let's check if regroupData is needed.
          // CreateSchemeScreen.tsx has a regroupData that handles groups and rows.
          // Schemes.tsx has groups and items.

          const transformed = rawSchemes.map((g: any) => ({
            group: g.group,
            items: g.rows.map((r: any) => ({
              name: prefixMap[selectedDraw] + '-' + r.scheme,
              rate: r.amount, // fallback
              data: [{ position: r.pos, count: r.count, amount: r.amount, super: r.super }]
            }))
          }));
          setSchemeData(transformed);
        } else {
          setSchemeData(scheme1); // Fallback
        }
      } catch (err) {
        console.error('Error fetching scheme structure:', err);
        setSchemeData(scheme1);
      }

      // Fetch real rates from backend for the selected draw
      if (username) {
        try {
          const backendDraw = drawMap[selectedDraw];
          const url = `${Domain}/rateMaster?user=${encodeURIComponent(username)}&draw=${encodeURIComponent(backendDraw)}`;
          const res = await axios.get(url);
          const data = res.data;

          if (data && data.rates) {
            const rateMap: Record<string, number> = {};
            data.rates.forEach((r: any) => {
              rateMap[r.label.toUpperCase()] = r.rate;
            });
            setRealRates(rateMap);
          } else {
            setRealRates({}); // Clear if no rates found
          }
        } catch (error) {
          console.error('❌ Error fetching real rates for schemes:', error);
          setRealRates({});
        }
      }

      setLoading(false);
    };

    fetchSchemeAndRates();
  }, [selectedDraw]);

  const getRealRate = (name: string, fallback: number) => {
    if (name.includes('SUPER')) return realRates['SUPER'] || fallback;
    if (name.includes('BOX')) return realRates['BOX'] || fallback;
    if (name.includes('AB')) return realRates['AB'] || fallback;
    if (name.includes('BC')) return realRates['BC'] || fallback;
    if (name.includes('AC')) return realRates['AC'] || fallback;
    if (name.endsWith('-A')) return realRates['A'] || fallback;
    if (name.endsWith('-B')) return realRates['B'] || fallback;
    if (name.endsWith('-C')) return realRates['C'] || fallback;
    return fallback;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading Scheme...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.userSchemeBox}>
        <Text style={styles.userSchemeText}>
          Your Scheme: <Text style={styles.userSchemeBold}>{userScheme || 'N/A'}</Text>
        </Text>
      </View>

      <View style={styles.filterBox}>
        <Text style={styles.filterLabel}>Select Draw:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedDraw}
            onValueChange={(itemValue) => setSelectedDraw(itemValue)}
            style={styles.picker}
            dropdownIconColor="#000"
          >
            {drawList.map((draw) => (
              <Picker.Item key={draw} label={draw} value={draw} color="#000" />
            ))}
          </Picker>
        </View>
      </View>

      {schemeData.map((schemeGroup, groupIndex) => (
        <View key={groupIndex}>
          {schemeGroup.items.map((item: any, itemIndex: number) => {
            const drawPrefix = prefixMap[selectedDraw];
            const displayName = item.name.replace('DEAR1', drawPrefix);
            return (
              <SchemeCard
                key={itemIndex}
                name={displayName}
                rate={getRealRate(item.name, item.rate)}
                group={schemeGroup.group}
                data={item.data}
              />
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f2f2f2',
    marginTop: 40,
    marginBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userSchemeBox: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  userSchemeText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  userSchemeBold: {
    fontWeight: 'bold',
    fontSize: 17,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  groupBadge: {
    backgroundColor: '#007bff',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    overflow: 'hidden',
  },
  rate: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
    color: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  cellHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  filterBox: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
});

export default SchemeScreen;
