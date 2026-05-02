import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  Add: { pastedText?: string; selectedTime?: string };
  Paste: { selectedTime?: string };
};

const TIME_SHORTCODES: { [key: string]: string } = {
  'LSK 3 PM': 'LSK3',
  'DEAR 1 PM': 'D-1-',
  'DEAR 6 PM': 'D-6-',
  'DEAR 8 PM': 'D-8-'
};

const PasteScreen: React.FC = () => {
  const [text, setText] = useState('');
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Paste'>>();

  // Paste raw clipboard content without any modifications
  const handlePaste = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (clipboardContent) {
        console.log('Raw pasted:', clipboardContent);

        const extractedLines = clipboardContent
          .split('\n')
          .map(line => {
            // Remove WhatsApp header if present but preserve other whitespace
            line = line.replace(/^\[\d{2}\/\d{2},\s*\d{1,2}:\d{2}\s*(?:am|pm)\]\s*[^:]+:\s*/i, '');

            // Only skip completely empty lines, preserve lines with whitespace
            if (!line.trim()) return null;

            // Skip if line contains 'set'
            if (line.toLowerCase().includes('set')) {
              return null;
            }

            // Handle ABC format with MULTIPLE SYMBOLS: Abc...2...15, Abc---2---15, Abc@@@2@@@15, etc.
            const abcMatch = line.match(/abc\s*[^\w\s]*\s*(\d)\s*[^\w\s]*\s*(\d+)/i);
            if (abcMatch) {
              const [, number, count] = abcMatch;
              return ['A', 'B', 'C']
                .map(type => `${number} ${count} ${type}`)
                .join('\n');
            }

            // Enhanced ABC with multiple symbols: Abc...2...15, Abc@@@2@@@15, etc.
            const abcMultiMatch = line.match(/abc\s*[^\w\s]{2,}\s*(\d)\s*[^\w\s]{2,}\s*(\d+)/i);
            if (abcMultiMatch) {
              const [, number, count] = abcMultiMatch;
              return ['A', 'B', 'C']
                .map(type => `${number} ${count} ${type}`)
                .join('\n');
            }

            // DISABLED: Pair combinations (ab, bc, ac) - User doesn't want these patterns
            /*
            const pairSymbolMatch = line.match(/(ab|bc|ac)\s*[^\w\s]*\s*(\d{2})\s*[^\w\s]*\s*(\d+)/i);
            if (pairSymbolMatch) {
              const [, pair, number, count] = pairSymbolMatch;
              const pairMap = {
                'ab': ['A', 'B'],
                'bc': ['B', 'C'], 
                'ac': ['A', 'C']
              };
              const types = pairMap[pair.toLowerCase() as keyof typeof pairMap];
              return types
                .map(type => `${number} ${count} ${type}`)
                .join('\n');
            }

            const pairMultiMatch = line.match(/(ab|bc|ac)\s*[^\w\s]{2,}\s*(\d{2})\s*[^\w\s]{2,}\s*(\d+)/i);
            if (pairMultiMatch) {
              const [, pair, number, count] = pairMultiMatch;
              const pairMap = {
                'ab': ['A', 'B'],
                'bc': ['B', 'C'], 
                'ac': ['A', 'C']
              };
              const types = pairMap[pair.toLowerCase() as keyof typeof pairMap];
              return types
                .map(type => `${number} ${count} ${type}`)
                .join('\n');
            }
            */

            // Handle "Abc" equals format: Abc=9=10 (all A, B, C types with number 9, count 10)
            const abcEqualsMatch = line.match(/abc\s*=\s*(\d)\s*=\s*(\d+)/i);
            if (abcEqualsMatch) {
              const [, number, count] = abcEqualsMatch;
              return ['A', 'B', 'C']
                .map(type => `${number} ${count} ${type}`)
                .join('\n');
            }

            // DISABLED: Pair equals combinations (ab=23=5, bc=23=5, ac=23=5) - User doesn't want these
            /*
            const pairEqualsMatch = line.match(/(ab|bc|ac)\s*=\s*(\d{2})\s*=\s*(\d+)/i);
            if (pairEqualsMatch) {
              const [, pair, number, count] = pairEqualsMatch;
              const pairMap = {
                'ab': ['A', 'B'],
                'bc': ['B', 'C'], 
                'ac': ['A', 'C']
              };
              const types = pairMap[pair.toLowerCase() as keyof typeof pairMap];
              return types
                .map(type => `${number} ${count} ${type}`)
                .join('\n');
            }
            */
            const pairMap: Record<string, string[]> = {
              ab: ['A', 'B'],
              bc: ['B', 'C'],
              ac: ['A', 'C'],
            };

            const pairFlexibleMatch = line.match(/(ab|bc|ac)\s*[^\w\d]{1,}\s*(\d{1,2})\s*[^\w\d]{1,}\s*(\d{1,3})/i);
            if (pairFlexibleMatch) {
              const [, pair, number, count] = pairFlexibleMatch;
              const types = pairMap[pair.toLowerCase() as keyof typeof pairMap];

              // Output in "AB. 45. 5" style
              return types.map(type => `${pair.toUpperCase()}. ${number}. ${count}`).join('\n');
            }
            // Flexible pair parser


            const pairEqualsMatch = line.match(/(ab|bc|ac)\s*=\s*(\d{1,2})\s*=\s*(\d{1,3})/i);
            if (pairEqualsMatch) {
              const [, pair, number, count] = pairEqualsMatch;
              const types = pairMap[pair.toLowerCase() as keyof typeof pairMap];
              return types.map(type => `${number} ${count} ${type}`).join('\n');
            }


            // Handle single letter type with equals: A=9=10 (A type, number 9, count 10)
            const singleTypeEqualsMatch = line.match(/([ABC])\s*=\s*(\d)\s*=\s*(\d+)/i);
            if (singleTypeEqualsMatch) {
              const [, type, number, count] = singleTypeEqualsMatch;
              return `${number} ${count} ${type.toUpperCase()}`;
            }

            // Handle single letter type with any symbol (A.4.5, A-4-5, A@4@5, A/4/5, etc.)
            const singleTypeMatch = line.match(/([ABC])\s*[^\w\s]\s*(\d)\s*[^\w\s]\s*(\d+)/i);
            if (singleTypeMatch) {
              const [, type, number, count] = singleTypeMatch;
              return `${number} ${count} ${type.toUpperCase()}`;
            }

            // Enhanced single letter type with MULTIPLE SYMBOLS (A...4...5, A@@@4@@@5, etc.)
            const singleTypeMultiMatch = line.match(/([ABC])\s*[^\w\s]{2,}\s*(\d)\s*[^\w\s]{2,}\s*(\d+)/i);
            if (singleTypeMultiMatch) {
              const [, type, number, count] = singleTypeMultiMatch;
              return `${number} ${count} ${type.toUpperCase()}`;
            }

            // Handle format: 212+3+2 (212 with 3 super, 2 box) - ENHANCED for all digit lengths
            const numberPlusPlusMatch = line.match(/(\d{1,3})\s*\+\s*(\d+)\s*\+\s*(\d+)/);
            if (numberPlusPlusMatch) {
              const [, number, superCount, boxCount] = numberPlusPlusMatch;
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // Handle new format: 646=4.1 or 646 =4.1 (646 with 4 super, 1 box) - ENHANCED for all digit lengths
            const equalDotMatch = line.match(/(\d{1,3})\s*=\s*(\d+)\.(\d+)/);
            if (equalDotMatch) {
              const [, number, superCount, boxCount] = equalDotMatch;
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // ENHANCED DOT FORMAT: Handle 664.5.3 with flexible spacing and symbols (2+ digit numbers only)
            // Matches: 664.5.3, 12.5.3, 664 . 5 . 3, etc. (excludes single digits like 7.4.2)
            const enhancedDotFormat = line.match(/(\d{2,4})\s*\.\s*(\d{1,3})\s*\.\s*(\d{1,3})/);
            if (enhancedDotFormat) {
              const [, number, superCount, boxCount] = enhancedDotFormat;
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // FLEXIBLE TRIPLE DOT FORMAT: Any symbols as dots (2+ digit numbers only)
            // Matches: 664@5@3, 12#5#3, 664*5*3, etc. (excludes 7@4@2)
            const flexibleTripleDot = line.match(/(\d{2,4})\s*([^\w\s])\s*(\d{1,3})\s*\2\s*(\d{1,3})/);
            if (flexibleTripleDot) {
              const [, number, , superCount, boxCount] = flexibleTripleDot;
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // MIXED SYMBOL TRIPLE: Different symbols (2+ digit numbers only)
            // Matches: 664.5@3, 12-5*3, 664#5.3, etc. (excludes 7.4@2)
            const mixedSymbolTriple = line.match(/(\d{2,4})\s*[^\w\s]\s*(\d{1,3})\s*[^\w\s]\s*(\d{1,3})/);
            if (mixedSymbolTriple) {
              const [, number, superCount, boxCount] = mixedSymbolTriple;
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // SPACED DOT FORMAT: Lots of spaces around dots (2+ digit numbers only)
            // Matches: 664   .   5   .   3, 12   .   4   .   2, etc. (excludes 7   .   4   .   2)
            const spacedDotFormat = line.match(/(\d{2,4})\s+\.\s+(\d{1,3})\s+\.\s+(\d{1,3})/);
            if (spacedDotFormat) {
              const [, number, superCount, boxCount] = spacedDotFormat;
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // ULTRA SPACED TRIPLE: Extreme spacing (2+ digit numbers only)
            // Matches: 664     5     3, 12     4     2, etc. (excludes 7     4     2)
            const ultraSpacedTriple = line.match(/^(\d{2,4})\s{3,}(\d{1,3})\s{3,}(\d{1,3})$/);
            if (ultraSpacedTriple) {
              const [, number, superCount, boxCount] = ultraSpacedTriple;
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // SUPER+BOX FORMAT: Handle 631. .1+5, 123..2+3, 456...4+1, etc.
            // Matches: number + multiple symbols + digit + plus + digit
            const superBoxPlusFormat = line.match(/(\d{2,4})[^\w\d]*(\d{1,3})\+(\d{1,3})/);
            if (superBoxPlusFormat) {
              const [, number, superCount, boxCount] = superBoxPlusFormat;
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // FLEXIBLE SUPER+BOX: Handle multiple symbols with various formats
            // Matches: 631...1=5, 123@@2*3, 456##4-1, etc.
            const flexibleSuperBox = line.match(/(\d{2,4})[^\w\d]{2,}(\d{1,3})[^\w\d]+(\d{1,3})/);
            if (flexibleSuperBox) {
              const [, number, superCount, boxCount] = flexibleSuperBox;
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // SPACED SUPER+BOX: Handle with spaces mixed in
            // Matches: 631 . . 1 + 5, 123 @ @ 2 * 3, etc.
            const spacedSuperBox = line.match(/(\d{2,4})\s*[^\w\d]+\s*(\d{1,3})\s*[^\w\d]+\s*(\d{1,3})/);
            if (spacedSuperBox) {
              const [, number, superCount, boxCount] = spacedSuperBox;
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // Handle new format: 646=-1.1 (646 with 1 super, 1 box) - leading minus means invert? (kept for backward compat)
            const negativeMatch = line.match(/(\d{3})\s*=\s*-(\d+)\.(\d+)/);
            if (negativeMatch) {
              const [, number, superCount, boxCount] = negativeMatch;
              return `${number} ${superCount}\\n${number} ${boxCount} BOX`;
            }

            // Handle new format: 737=5+1 (737 with 5 super, 1 box) - ENHANCED for all digit lengths
            const equalPlusMatch = line.match(/(\d{1,3})\s*=\s*(\d+)\+(\d+)/);
            if (equalPlusMatch) {
              const [, number, superCount, boxCount] = equalPlusMatch;
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // Handle super+box format with flexible symbols (896.2+2, 896-2+2, 896@2#2, etc.)
            const superBoxMatch = line.match(/(\d{1,4})\s*[^\w\s]\s*(\d+)\s*[^\w\s]\s*(\d+)/);
            if (superBoxMatch) {
              const [, number, superCount, boxCount] = superBoxMatch;
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // Enhanced super+box with MULTIPLE SYMBOLS (896...2...2, 896@@@2@@@2, etc.)
            const superBoxMultiMatch = line.match(/(\d{1,4})\s*[^\w\s]{2,}\s*(\d+)\s*[^\w\s]{2,}\s*(\d+)/);
            if (superBoxMultiMatch) {
              const [, number, superCount, boxCount] = superBoxMultiMatch;
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // Super+box with spaced multiple symbols: 896 ... 2 ... 2, 896 @@@ 2 @@@ 2, etc.
            const superBoxSpacedMultiMatch = line.match(/(\d{1,4})\s+[^\w\s]{2,}\s+(\d+)\s+[^\w\s]{2,}\s+(\d+)/);
            if (superBoxSpacedMultiMatch) {
              const [, number, superCount, boxCount] = superBoxSpacedMultiMatch;
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // Handle ANY digit number with single symbol separator (632.5, 12-5, 1234@5, 015,1box, etc.)
            const singleSeparatorMatch = line.match(/(\d{1,4})\s*[^\w\s]\s*(\d+)\s*[^\w\s]{0,}\s*(box|b)?/i);
            if (singleSeparatorMatch) {
              const [, number, count, isBox] = singleSeparatorMatch;
              return `${number} ${count}${isBox ? ' BOX' : ''}`;
            }

            // Handle patterns like 357. .1 (number + symbol + space + symbol + number)
            const dotSpaceDotMatch = line.match(/(\d{1,4})\s*\.\s*\.\s*(\d+)/);
            if (dotSpaceDotMatch) {
              const [, number, count] = dotSpaceDotMatch;
              return `${number} ${count}`;
            }

            // Handle patterns with multiple separators but only 2 numbers (not triple format)
            const dualSeparatorMatch = line.match(/^(\d{1,4})\s*[^\w\s]\s*[^\w\s]\s*(\d+)$/);
            if (dualSeparatorMatch) {
              const [, number, count] = dualSeparatorMatch;
              return `${number} ${count}`;
            }

            // Handle ANY digit number with MULTIPLE SYMBOLS separator (632......5, 12---5, 1234###5, 138-10-box, etc.)
            const multipleSeparatorMatch = line.match(/(\d{1,4})\s*[^\w\s]{1,}\s*(\d+)\s*[^\w\s]{0,}\s*(box|b)?/i);
            if (multipleSeparatorMatch) {
              const [, number, count, isBox] = multipleSeparatorMatch;
              return `${number} ${count}${isBox ? ' BOX' : ''}`;
            }

            // Enhanced MULTI-SYMBOL with spaces: 632 ... 5, 12 --- 5, 1234 ### 5, etc.
            const spacedMultiSeparatorMatch = line.match(/(\d{1,4})\s+[^\w\s]{1,}\s+(\d+)\s*[^\w\s]{0,}\s*(box|b)?/i);
            if (spacedMultiSeparatorMatch) {
              const [, number, count, isBox] = spacedMultiSeparatorMatch;
              return `${number} ${count}${isBox ? ' BOX' : ''}`;
            }

            // Handle spaced numbers with ANY digit length (632 5, 12  5, 1234   5, etc.)
            const spacedMatch = line.match(/(\d{1,4})\s+(\d+)/);
            if (spacedMatch) {
              const [, number, count] = spacedMatch;
              return `${number} ${count}`;
            }

            // Handle EXTREME spacing with multiple spaces: 632     5, 12        5, etc.
            const extremeSpacedMatch = line.match(/(\d{1,4})\s{3,}(\d+)/);
            if (extremeSpacedMatch) {
              const [, number, count] = extremeSpacedMatch;
              return `${number} ${count}`;
            }

            // === DISABLED ALL MEGA PATTERNS - TOO AGGRESSIVE ===
            // These patterns were causing issues like 357. .1 -> 35 7 instead of 357 1
            // The existing specific patterns (ABC, equals, dot, etc.) handle most cases correctly

            /*
            ALL MEGA PATTERNS DISABLED TO PREVENT INCORRECT PARSING
            - megaPattern1: was breaking up numbers like 357 -> 35 7
            - megaTypeFirst: too aggressive with type detection
            - megaTypeLast: too aggressive with type detection  
            - megaTripleFormat: was matching single numbers incorrectly
            - megaSpacing: conflicting with spaced patterns
            - megaMixed: too broad matching
            - megaUnicode: too broad matching
            - megaRepeating: too broad matching
            - megaInvisible: too broad matching
            - megaUltimate: extremely aggressive
            - megaComma/Period/Dash: handled by specific patterns
            - megaSingleDigit: too broad for single digits
            - megaMalformed: breaking up valid numbers
            - lastResort: breaking up valid numbers
            */

            return null;
          })
          .filter(Boolean)
          .join('\n');

        console.log('Formatted data:', extractedLines);
        setText(extractedLines);
      }
    } catch (error) {
      console.error('Paste error:', error);
    }
  };

  // Paste and clean up the text (original behavior)
  const handleCleanPaste = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (clipboardContent) {
        // Clean up by removing empty lines and trimming each line
        const cleaned = clipboardContent
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line)
          .join('\n');

        setText(cleaned);
        Alert.alert('Clean Paste', 'Content pasted with empty lines removed.');
      } else {
        Alert.alert('Paste', 'Clipboard is empty.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access clipboard.');
    }
  };

  const handleSubmit = () => {
    if (!text) return;

    const selectedTime = route.params?.selectedTime || 'LSK 3 PM';
    const shortCode = TIME_SHORTCODES[selectedTime] || 'LSK3';

    const entries: any[] = [];
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const pairMap: Record<string, string[]> = {
      ab: ['A', 'B'],
      bc: ['B', 'C'],
      ac: ['A', 'C'],
    };

    for (let line of lines) {
      // Strip WhatsApp header again in case it wasn't normalized (e.g. from manual entry)
      line = line.replace(/^\[\d{2}\/\d{2},\s*\d{1,2}:\d{2}\s*(?:am|pm)\]\s*[^:]+:\s*/i, '').trim();
      if (!line) continue;

      console.log(`🔍 Processing line: "${line}"`);

      // Common separator regex: includes space, dot, @, #, hyphen, underscore, star, plus, equals, comma
      const sep = '[\\s\\.@#\\-_\\*\\+=,]*';
      const sepAtLeastOne = '[\\s\\.@#\\-_\\*\\+=,]+';

      // ------------- ABC pattern (abc.2.15, abc-4=50 → Number 4, Count 50 for A, B, C each) -------------
      const abcMatch = line.match(new RegExp(`^([a-zA-Z]{3})${sep}(\\d{1,3})${sep}(\\d+)$`, 'i'));
      if (abcMatch) {
        const [, letters, num, cnt] = abcMatch;
        for (const letter of letters.toUpperCase()) {
          entries.push({ number: num, count: parseInt(cnt), type: letter, timeLabel: selectedTime, shortCode });
        }
        continue;
      }

      // ------------- Single type pattern (A.4.5, A=9=10 → Number 4 or 9, Count 5 or 10 A) -------------
      const singleMatch = line.match(new RegExp(`^([ABC])${sep}(\\d{1,3})${sep}(\\d+)$`, 'i'));
      if (singleMatch) {
        const [, letter, num, cnt] = singleMatch;
        entries.push({ number: num, count: parseInt(cnt), type: letter.toUpperCase(), timeLabel: selectedTime, shortCode });
        continue;
      }

      // ------------- Dot pattern (664.5.3 → 664 5 SUPER, 664 3 BOX) -------------
      const dotMatch = line.match(new RegExp(`^(\\d{2,3})${sepAtLeastOne}(\\d+)${sepAtLeastOne}(\\d+)$`));
      if (dotMatch) {
        const [, number, superCount, boxCount] = dotMatch;
        entries.push({ number, count: parseInt(superCount), type: 'SUPER', timeLabel: selectedTime, shortCode });
        entries.push({ number, count: parseInt(boxCount), type: 'BOX', timeLabel: selectedTime, shortCode });
        continue;
      }

      // ------------- Plus pattern (212+3+2 → 212 3 SUPER, 212 2 BOX) -------------
      const plusMatch = line.match(/^(\d{2,3})\+(\d+)\+(\d+)$/);
      if (plusMatch) {
        const [, number, count1, count2] = plusMatch;
        entries.push({ number, count: parseInt(count1), type: 'SUPER', timeLabel: selectedTime, shortCode });
        entries.push({ number, count: parseInt(count2), type: 'BOX', timeLabel: selectedTime, shortCode });
        continue;
      }

      // ------------- Equals pattern (646=4.1 → 646 4 SUPER, 646 1 BOX) -------------
      const equalsMatch = line.match(/^(\d{2,3})=(\d+)\.(\d+)$/);
      if (equalsMatch) {
        const [, number, count1, count2] = equalsMatch;
        entries.push({ number, count: parseInt(count1), type: 'SUPER', timeLabel: selectedTime, shortCode });
        entries.push({ number, count: parseInt(count2), type: 'BOX', timeLabel: selectedTime, shortCode });
        continue;
      }

      // ------------- Robust Generic Parser (Handles 015,1box, 138-10-box, 123 10, etc.) -------------
      const genericMatch = line.match(new RegExp(`^(\\d{1,4})${sepAtLeastOne}(\\d+)\\s*${sep}(box|b)?$`, 'i'));
      if (genericMatch) {
        const [, number, count, typeSuffix] = genericMatch;
        const isBox = !!typeSuffix;

        if (number.length === 1 && !isBox) {
          // Single digit defaults to A if no type specified
          entries.push({ number, count: parseInt(count), type: 'A', timeLabel: selectedTime, shortCode });
        } else if (number.length >= 2) {
          const finalType = isBox ? 'BOX' : 'SUPER';
          entries.push({ number, count: parseInt(count), type: finalType, timeLabel: selectedTime, shortCode });
        } else if (isBox) {
          // Even single digit can be BOX if explicitly mentioned
          entries.push({ number, count: parseInt(count), type: 'BOX', timeLabel: selectedTime, shortCode });
        }
        continue;
      }

      // ------------- Standard space-separated patterns (Fallback) -------------
      const parts = line.split(/\s+/).filter((p) => p.length > 0);
      if (parts.length >= 2) {
        const number = parts[0];
        const count = parseInt(parts[1]);
        let type = (parts[2] || '').toUpperCase();

        // Handle 1-digit types
        if (number.length === 1 && ['A', 'B', 'C'].includes(type)) {
          entries.push({ number, count, type, timeLabel: selectedTime, shortCode });
          continue;
        }

        // Handle 2-digit pair types
        const pairKey = type.toLowerCase();
        if (number.length === 2 && pairMap[pairKey]) {
          const rateTypes = pairMap[pairKey];
          for (const t of rateTypes) {
            entries.push({ number, count, type: t, timeLabel: selectedTime, shortCode });
          }
          continue;
        }

        // Handle 2/3-digit SUPER/BOX or default
        if (number.length >= 2 && number.length <= 3) {
          if (type === 'BOX') {
            entries.push({ number, count, type: 'BOX', timeLabel: selectedTime, shortCode });
          } else {
            entries.push({ number, count, type: 'SUPER', timeLabel: selectedTime, shortCode });
          }
          continue;
        }
      }

      console.warn('❌ Could not parse line:', line);
    }

    console.log('Processed entries:', entries);

    if (entries.length > 0) {
      navigation.navigate('Add', {
        pastedText: JSON.stringify(entries),
        selectedTime: route.params?.selectedTime,
      });
      setText('');
    } else {
      console.log('No valid entries to submit');
    }
  };

  const handleCancel = () => {
    setText('');
    navigation.navigate('Add', { selectedTime: route.params?.selectedTime });
  };

  const handleCameraScan = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera permission is needed to scan.');
      return;
    }

    // Compress image to stay under 1MB limit
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7, // Reduce quality to 70%
      allowsEditing: true,
      aspect: [4, 3],
      base64: false
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      console.log('📸 Original image URI:', uri);

      // Check file size before processing
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const sizeInKB = Math.round(blob.size / 1024);
        console.log(`📏 Image size: ${sizeInKB} KB`);

        if (sizeInKB > 1024) {
          Alert.alert('Image Too Large',
            `Image size: ${sizeInKB} KB\nMax allowed: 1024 KB\n\nTry taking a new photo with better compression.`
          );
          return;
        }

        await uploadToOcrSpace(uri);
      } catch (error) {
        console.error('Error checking file size:', error);
        // Proceed anyway if we can't check size
        await uploadToOcrSpace(uri);
      }
    }
  };

  const uploadToOcrSpace = async (imageUri: string) => {
    try {
      const formData = new FormData();
      // Get a free API key from https://ocr.space/ocrapi
      formData.append('apikey', 'K87899142388957'); // Free tier API key
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // Use engine 2 for better accuracy

      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      // @ts-ignore
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      });

      console.log('🔄 Sending OCR request...');
      const res = await axios.post('https://api.ocr.space/parse/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000, // 30 second timeout
      });

      console.log('📊 OCR Response Status:', res.status);
      console.log('📊 OCR Full Response:', JSON.stringify(res.data, null, 2));

      // Check for API errors
      if (res.data?.IsErroredOnProcessing) {
        console.error('❌ OCR API Error:', res.data?.ErrorMessage);
        Alert.alert('OCR Error', res.data?.ErrorMessage?.[0] || 'API processing error');
        return;
      }

      const parsedText = res.data?.ParsedResults?.[0]?.ParsedText || '';
      console.log('📝 OCR Raw Text:', parsedText);

      if (parsedText) {
        // Process the OCR text using same logic as handlePaste
        const extractedLines = parsedText
          .split('\n')
          .map((line: string) => {
            // Remove WhatsApp header if present
            line = line.replace(/^\[\d{2}\/\d{2},\s*\d{1,2}:\d{2}\s*(?:am|pm)\]\s*[^:]+:\s*/i, '');

            if (!line.trim()) return null;

            // Clean up common OCR errors
            const originalLine = line;
            line = line
              // Fix common character recognition errors
              .replace(/tl/gi, '+1')  // 138-2tl → 138-2+1
              .replace(/t\|/gi, '+1') // 138-2t| → 138-2+1
              .replace(/[|l]$/gi, '1') // trailing | or l → 1
              .replace(/(\d)-(\d)\+$/gi, '$1-$2+1') // 314-4+ → 314-4+1
              .replace(/(\d)-(\d)$/gi, '$1-$2+1') // 314-4 → 314-4+1 (if missing +1)
              .replace(/[|]/g, '1') // any | → 1
              .replace(/[O]/g, '0') // O → 0
              .replace(/[l]/g, '1') // l → 1
              .trim();

            if (originalLine !== line) {
              console.log(`🔧 OCR correction: "${originalLine}" → "${line}"`);
            }

            console.log('🔍 Processing OCR line:', line);

            // Skip if line contains 'set'
            if (line.toLowerCase().includes('set')) {
              console.log('  ⏭️ Skipping line with "set"');
              return null;
            }

            // Handle ABC format with any symbol (Abc.2.15, Abc-2-15, Abc@2@15, etc.)
            const abcMatch = line.match(/abc\s*[^\w\s]\s*(\d)\s*[^\w\s]\s*(\d+)/i);
            if (abcMatch) {
              const [, number, count] = abcMatch;
              console.log('  ✅ ABC format match:', { number, count });
              return ['A', 'B', 'C']
                .map(type => `${number} ${count} ${type}`)
                .join('\n');
            }

            // Enhanced OCR ABC with MULTIPLE SYMBOLS: Abc...2...15, Abc@@@2@@@15, etc.
            const ocrAbcMultiMatch = line.match(/abc\s*[^\w\s]{2,}\s*(\d)\s*[^\w\s]{2,}\s*(\d+)/i);
            if (ocrAbcMultiMatch) {
              const [, number, count] = ocrAbcMultiMatch;
              console.log('  ✅ OCR ABC Multi-Symbol match:', { number, count });
              return ['A', 'B', 'C']
                .map(type => `${number} ${count} ${type}`)
                .join('\n');
            }

            // DISABLED: OCR Pair combinations (ab, bc, ac) - User doesn't want these patterns
            /*
            const pairSymbolMatch = line.match(/(ab|bc|ac)\s*[^\w\s]\s*(\d{2})\s*[^\w\s]\s*(\d+)/i);
            if (pairSymbolMatch) {
              const [, pair, number, count] = pairSymbolMatch;
              const pairMap = {
                'ab': ['A', 'B'],
                'bc': ['B', 'C'], 
                'ac': ['A', 'C']
              };
              const types = pairMap[pair.toLowerCase() as keyof typeof pairMap];
              console.log('  ✅ Pair symbol format match:', { pair, number, count });
              return types
                .map(type => `${number} ${count} ${type}`)
                .join('\n');
            }

            const ocrPairMultiMatch = line.match(/(ab|bc|ac)\s*[^\w\s]{2,}\s*(\d{2})\s*[^\w\s]{2,}\s*(\d+)/i);
            if (ocrPairMultiMatch) {
              const [, pair, number, count] = ocrPairMultiMatch;
              const pairMap = {
                'ab': ['A', 'B'],
                'bc': ['B', 'C'], 
                'ac': ['A', 'C']
              };
              const types = pairMap[pair.toLowerCase() as keyof typeof pairMap];
              console.log('  ✅ OCR Pair Multi-Symbol match:', { pair, number, count });
              return types
                .map(type => `${number} ${count} ${type}`)
                .join('\n');
            }
            */

            // Handle "Abc" equals format: Abc=9=10 (all A, B, C types with number 9, count 10)
            const abcEqualsMatch = line.match(/abc\s*=\s*(\d)\s*=\s*(\d+)/i);
            if (abcEqualsMatch) {
              const [, number, count] = abcEqualsMatch;
              console.log('  ✅ ABC equals format match:', { number, count });
              return ['A', 'B', 'C']
                .map(type => `${number} ${count} ${type}`)
                .join('\n');
            }

            // DISABLED: OCR Pair equals combinations (ab=23=5, bc=23=5, ac=23=5) - User doesn't want these
            /*
            const pairEqualsMatch = line.match(/(ab|bc|ac)\s*=\s*(\d{2})\s*=\s*(\d+)/i);
            if (pairEqualsMatch) {
              const [, pair, number, count] = pairEqualsMatch;
              const pairMap = {
                'ab': ['A', 'B'],
                'bc': ['B', 'C'], 
                'ac': ['A', 'C']
              };
              const types = pairMap[pair.toLowerCase() as keyof typeof pairMap];
              console.log('  ✅ Pair equals format match:', { pair, number, count });
              return types
                .map(type => `${number} ${count} ${type}`)
                .join('\n');
            }
            */

            // Handle single letter type with equals: A=9=10 (A type, number 9, count 10)
            const singleTypeEqualsMatch = line.match(/([ABC])\s*=\s*(\d)\s*=\s*(\d+)/i);
            if (singleTypeEqualsMatch) {
              const [, type, number, count] = singleTypeEqualsMatch;
              console.log('  ✅ Single type equals match:', { type, number, count });
              return `${number} ${count} ${type.toUpperCase()}`;
            }

            // Handle single letter type with any symbol (A.4.5, A-4-5, A@4@5, A/4/5, etc.)
            const singleTypeMatch = line.match(/([ABC])\s*[^\w\s]\s*(\d)\s*[^\w\s]\s*(\d+)/i);
            if (singleTypeMatch) {
              const [, type, number, count] = singleTypeMatch;
              console.log('  ✅ Single type symbol match:', { type, number, count });
              return `${number} ${count} ${type.toUpperCase()}`;
            }

            // Enhanced OCR single letter type with MULTIPLE SYMBOLS (A...4...5, A@@@4@@@5, etc.)
            const ocrSingleTypeMultiMatch = line.match(/([ABC])\s*[^\w\s]{2,}\s*(\d)\s*[^\w\s]{2,}\s*(\d+)/i);
            if (ocrSingleTypeMultiMatch) {
              const [, type, number, count] = ocrSingleTypeMultiMatch;
              console.log('  ✅ OCR Single Type Multi-Symbol match:', { type, number, count });
              return `${number} ${count} ${type.toUpperCase()}`;
            }

            // Handle format: 212+3+2 (212 with 3 super, 2 box) - ENHANCED for all digit lengths
            const numberPlusPlusMatch = line.match(/(\d{1,3})\+(\d+)\+(\d+)/);
            if (numberPlusPlusMatch) {
              const [, number, superCount, boxCount] = numberPlusPlusMatch;
              console.log('  ✅ Plus-plus format match:', { number, superCount, boxCount });
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // Handle new format: 646=4.1 or 646 =4.1 (646 with 4 super, 1 box) - ENHANCED for all digit lengths
            const equalDotMatch = line.match(/(\d{1,3})\s*=\s*(\d+)\.(\d+)/);
            if (equalDotMatch) {
              const [, number, superCount, boxCount] = equalDotMatch;
              console.log('  ✅ Equals-dot format match:', { number, superCount, boxCount });
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // OCR ENHANCED DOT FORMAT: Handle 664.5.3 with flexible spacing and symbols (2+ digit numbers only)
            // Matches: 664.5.3, 12.5.3, 664 . 5 . 3, etc. (excludes single digits like 7.4.2)
            const ocrEnhancedDotFormat = line.match(/(\d{2,4})\s*\.\s*(\d{1,3})\s*\.\s*(\d{1,3})/);
            if (ocrEnhancedDotFormat) {
              const [, number, superCount, boxCount] = ocrEnhancedDotFormat;
              console.log('  ✅ OCR Enhanced Dot Format match:', { number, superCount, boxCount });
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // OCR FLEXIBLE TRIPLE DOT FORMAT: Any symbols as dots (2+ digit numbers only)
            // Matches: 664@5@3, 12#5#3, 664*5*3, etc. (excludes 7@4@2)
            const ocrFlexibleTripleDot = line.match(/(\d{2,4})\s*([^\w\s])\s*(\d{1,3})\s*\2\s*(\d{1,3})/);
            if (ocrFlexibleTripleDot) {
              const [, number, , superCount, boxCount] = ocrFlexibleTripleDot;
              console.log('  ✅ OCR Flexible Triple Dot match:', { number, superCount, boxCount });
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // OCR MIXED SYMBOL TRIPLE: Different symbols (2+ digit numbers only)
            // Matches: 664.5@3, 12-5*3, 664#5.3, etc. (excludes 7.4@2)
            const ocrMixedSymbolTriple = line.match(/(\d{2,4})\s*[^\w\s]\s*(\d{1,3})\s*[^\w\s]\s*(\d{1,3})/);
            if (ocrMixedSymbolTriple) {
              const [, number, superCount, boxCount] = ocrMixedSymbolTriple;
              console.log('  ✅ OCR Mixed Symbol Triple match:', { number, superCount, boxCount });
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // OCR SPACED DOT FORMAT: Lots of spaces around dots (2+ digit numbers only)
            // Matches: 664   .   5   .   3, 12   .   4   .   2, etc. (excludes 7   .   4   .   2)
            const ocrSpacedDotFormat = line.match(/(\d{2,4})\s+\.\s+(\d{1,3})\s+\.\s+(\d{1,3})/);
            if (ocrSpacedDotFormat) {
              const [, number, superCount, boxCount] = ocrSpacedDotFormat;
              console.log('  ✅ OCR Spaced Dot Format match:', { number, superCount, boxCount });
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // OCR ULTRA SPACED TRIPLE: Extreme spacing (2+ digit numbers only)
            // Matches: 664     5     3, 12     4     2, etc. (excludes 7     4     2)
            const ocrUltraSpacedTriple = line.match(/^(\d{2,4})\s{3,}(\d{1,3})\s{3,}(\d{1,3})$/);
            if (ocrUltraSpacedTriple) {
              const [, number, superCount, boxCount] = ocrUltraSpacedTriple;
              console.log('  ✅ OCR Ultra Spaced Triple match:', { number, superCount, boxCount });
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // OCR SUPER+BOX FORMAT: Handle 631. .1+5, 123..2+3, 456...4+1, etc.
            // Matches: number + multiple symbols + digit + plus + digit
            const ocrSuperBoxPlusFormat = line.match(/(\d{2,4})[^\w\d]*(\d{1,3})\+(\d{1,3})/);
            if (ocrSuperBoxPlusFormat) {
              const [, number, superCount, boxCount] = ocrSuperBoxPlusFormat;
              console.log('  ✅ OCR Super+Box Plus Format match:', { number, superCount, boxCount });
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // OCR FLEXIBLE SUPER+BOX: Handle multiple symbols with various formats
            // Matches: 631...1=5, 123@@2*3, 456##4-1, etc.
            const ocrFlexibleSuperBox = line.match(/(\d{2,4})[^\w\d]{2,}(\d{1,3})[^\w\d]+(\d{1,3})/);
            if (ocrFlexibleSuperBox) {
              const [, number, superCount, boxCount] = ocrFlexibleSuperBox;
              console.log('  ✅ OCR Flexible Super+Box match:', { number, superCount, boxCount });
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // OCR SPACED SUPER+BOX: Handle with spaces mixed in
            // Matches: 631 . . 1 + 5, 123 @ @ 2 * 3, etc.
            const ocrSpacedSuperBox = line.match(/(\d{2,4})\s*[^\w\d]+\s*(\d{1,3})\s*[^\w\d]+\s*(\d{1,3})/);
            if (ocrSpacedSuperBox) {
              const [, number, superCount, boxCount] = ocrSpacedSuperBox;
              console.log('  ✅ OCR Spaced Super+Box match:', { number, superCount, boxCount });
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // OCR DOT CONFUSION FIX: Handle OCR misreading dots as other symbols
            const dotConfusionFixed = line
              .replace(/[,;]/g, '.')    // , ; → .
              .replace(/[°º]/g, '.')    // ° º → .
              .replace(/[·•]/g, '.');   // · • → .

            if (dotConfusionFixed !== line) {
              console.log(`  🔧 OCR dot correction: "${line}" → "${dotConfusionFixed}"`);
              // Try dot pattern again with corrected line
              const correctedDotMatch = dotConfusionFixed.match(/(\d{1,4})\s*\.\s*(\d{1,3})\s*\.\s*(\d{1,3})/);
              if (correctedDotMatch) {
                const [, number, superCount, boxCount] = correctedDotMatch;
                console.log('  ✅ OCR Corrected Dot Pattern match:', { number, superCount, boxCount });
                return `${number} ${superCount}\n${number} ${boxCount} BOX`;
              }
            }

            // Handle new format: 646=-1.1 (646 with 1 super, 1 box)
            const negativeMatch = line.match(/(\d{3})\s*=\s*-(\d+)\.(\d+)/);
            if (negativeMatch) {
              const [, number, superCount, boxCount] = negativeMatch;
              console.log('  ✅ Negative format match:', { number, superCount, boxCount });
              return `${number} ${superCount}\\n${number} ${boxCount} BOX`;
            }

            // Handle new format: 737=5+1 (737 with 5 super, 1 box) - ENHANCED for all digit lengths
            const equalPlusMatch = line.match(/(\d{1,3})\s*=\s*(\d+)\+(\d+)/);
            if (equalPlusMatch) {
              const [, number, superCount, boxCount] = equalPlusMatch;
              console.log('  ✅ Equals-plus format match:', { number, superCount, boxCount });
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // Handle super+box format with flexible symbols (896.2+2, 896-2+2, 896@2#2, etc.)
            const superBoxMatch = line.match(/(\d{1,4})\s*[^\w\s]\s*(\d+)\s*[^\w\s]\s*(\d+)/);
            if (superBoxMatch) {
              const [, number, superCount, boxCount] = superBoxMatch;
              console.log('  ✅ Super-box flexible format match:', { number, superCount, boxCount });
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // Enhanced OCR super+box with MULTIPLE SYMBOLS (896...2...2, 896@@@2@@@2, etc.)
            const ocrSuperBoxMultiMatch = line.match(/(\d{1,4})\s*[^\w\s]{2,}\s*(\d+)\s*[^\w\s]{2,}\s*(\d+)/);
            if (ocrSuperBoxMultiMatch) {
              const [, number, superCount, boxCount] = ocrSuperBoxMultiMatch;
              console.log('  ✅ OCR Super-box Multi-Symbol match:', { number, superCount, boxCount });
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // OCR Super+box with spaced multiple symbols: 896 ... 2 ... 2, 896 @@@ 2 @@@ 2, etc.
            const ocrSuperBoxSpacedMultiMatch = line.match(/(\d{1,4})\s+[^\w\s]{2,}\s+(\d+)\s+[^\w\s]{2,}\s+(\d+)/);
            if (ocrSuperBoxSpacedMultiMatch) {
              const [, number, superCount, boxCount] = ocrSuperBoxSpacedMultiMatch;
              console.log('  ✅ OCR Super-box Spaced Multi-Symbol match:', { number, superCount, boxCount });
              return `${number} ${superCount}\n${number} ${boxCount} BOX`;
            }

            // Handle dash format specifically for BOX: 775-3, 646-5, 747-7 
            const dashBoxMatch = line.match(/(\d{3})\s*-\s*(\d+)(?:\s+box)?/i);
            if (dashBoxMatch) {
              const [, number, count] = dashBoxMatch;
              console.log('  ✅ Dash BOX format match:', { number, count, type: 'BOX' });
              return `${number} ${count} BOX`;
            }

            // Handle ANY digit number with single symbol separator (632.5, 12@5, 1234#5, etc.)
            const singleSeparatorMatch = line.match(/(\d{1,4})\s*[^\w\s]\s*(\d+)/);
            if (singleSeparatorMatch) {
              const [, number, count] = singleSeparatorMatch;
              console.log('  ✅ Single separator match:', { number, count });
              return `${number} ${count}`;
            }

            // Handle OCR patterns like 357. .1 (number + symbol + space + symbol + number)
            const ocrDotSpaceDotMatch = line.match(/(\d{1,4})\s*\.\s*\.\s*(\d+)/);
            if (ocrDotSpaceDotMatch) {
              const [, number, count] = ocrDotSpaceDotMatch;
              console.log('  ✅ OCR Dot-Space-Dot match:', { number, count });
              return `${number} ${count}`;
            }

            // Handle OCR patterns with multiple separators but only 2 numbers (not triple format)
            const ocrDualSeparatorMatch = line.match(/^(\d{1,4})\s*[^\w\s]\s*[^\w\s]\s*(\d+)$/);
            if (ocrDualSeparatorMatch) {
              const [, number, count] = ocrDualSeparatorMatch;
              console.log('  ✅ OCR Dual Separator match:', { number, count });
              return `${number} ${count}`;
            }

            // Handle ANY digit number with MULTIPLE SYMBOLS (632......5, 12---5, 1234###5, etc.)
            const multipleSeparatorMatch = line.match(/(\d{1,4})\s*[^\w\s]{2,}\s*(\d+)/);
            if (multipleSeparatorMatch) {
              const [, number, count] = multipleSeparatorMatch;
              console.log('  ✅ Multiple separator match:', { number, count });
              return `${number} ${count}`;
            }

            // Enhanced OCR MULTI-SYMBOL with spaces: 632 ... 5, 12 --- 5, 1234 ### 5, etc.
            const ocrSpacedMultiSeparatorMatch = line.match(/(\d{1,4})\s+[^\w\s]{2,}\s+(\d+)/);
            if (ocrSpacedMultiSeparatorMatch) {
              const [, number, count] = ocrSpacedMultiSeparatorMatch;
              console.log('  ✅ OCR Spaced Multi-Separator match:', { number, count });
              return `${number} ${count}`;
            }

            // Handle spaced numbers with ANY digit length (632 5, 12  5, 1234   5, etc.)
            const spacedMatch = line.match(/(\d{1,4})\s+(\d+)/);
            if (spacedMatch) {
              const [, number, count] = spacedMatch;
              console.log('  ✅ Spaced numbers match:', { number, count });
              return `${number} ${count}`;
            }

            // Handle OCR EXTREME spacing: 632     5, 12        5, etc.
            const ocrExtremeSpacedMatch = line.match(/(\d{1,4})\s{3,}(\d+)/);
            if (ocrExtremeSpacedMatch) {
              const [, number, count] = ocrExtremeSpacedMatch;
              console.log('  ✅ OCR Extreme Spaced match:', { number, count });
              return `${number} ${count}`;
            }

            // === DISABLED ALL OCR MEGA PATTERNS - TOO AGGRESSIVE ===
            // These patterns were causing issues like 357. .1 -> 35 7 instead of 357 1
            // The existing specific OCR patterns handle most cases correctly

            /*
            ALL OCR MEGA PATTERNS DISABLED TO PREVENT INCORRECT PARSING
            - ocrMegaPattern1: was breaking up numbers like 357 -> 35 7
            - ocrMegaTypeFirst: too aggressive with type detection
            - ocrMegaTypeLast: too aggressive with type detection  
            - ocrMegaTripleFormat: was matching single numbers incorrectly
            - ocrMegaSpacing: conflicting with spaced patterns
            - ocrMegaMixed: too broad matching
            - ocrConfusionFixed: too broad symbol replacement
            - ocrMegaUnicode: too broad matching
            - ocrArtifactMatch: too broad matching  
            - ocrMalformed: breaking up valid numbers
            - ocrNoisyTriple: too aggressive pattern
            - ocrLastResort: breaking up valid numbers
            */

            console.log('  ❌ No patterns matched');
            return null;
          })
          .filter(Boolean)
          .join('\n');

        const entryCount = extractedLines ? extractedLines.split('\n').filter((line: string) => line.trim()).length : 0;
        console.log(`🎯 Final extracted entries (${entryCount}):`, extractedLines);
        console.log('📋 Formatted for text area:', extractedLines);

        if (extractedLines && entryCount > 0) {
          setText(extractedLines);
          Alert.alert('OCR Success! 🎉',
            `Found ${entryCount} entries from scan. Check text area for details.`
          );
        } else {
          setText(parsedText); // Show original text if no patterns found
          Alert.alert('OCR Success', 'Text extracted but no number patterns found. Check the text area for raw text.');
        }
      } else {
        console.warn('⚠️ No text extracted from OCR');
        Alert.alert('OCR Failed', 'No text recognized from the image. Try:\n• Better lighting\n• Clearer image\n• Closer to text');
      }
    } catch (err: any) {
      console.error('OCR Error:', err);

      // Check for specific error types
      if (err.response?.status === 413 || err.message?.includes('size')) {
        Alert.alert('File Too Large',
          'Image exceeds 1024 KB limit.\n\nTips:\n• Take photo in better lighting\n• Avoid high resolution\n• Crop to text area only'
        );
      } else if (err.response?.status === 400) {
        Alert.alert('Invalid Image', 'Image format not supported or corrupted.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        Alert.alert('Network Error', 'Check your internet connection and try again.');
      } else {
        Alert.alert('OCR Error', `Request failed: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const handleGalleryScan = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Gallery permission is needed to select images.');
      return;
    }

    // Select and compress image from gallery
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7, // Reduce quality to 70%
      allowsEditing: true,
      aspect: [4, 3],
      base64: false
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      console.log('🖼️ Selected image URI:', uri);

      // Check file size before processing
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const sizeInKB = Math.round(blob.size / 1024);
        console.log(`📏 Image size: ${sizeInKB} KB`);

        if (sizeInKB > 1024) {
          Alert.alert('Image Too Large',
            `Image size: ${sizeInKB} KB\nMax allowed: 1024 KB\n\nTry selecting a smaller image or compress it first.`
          );
          return;
        }

        await uploadToOcrSpace(uri);
      } catch (error) {
        console.error('Error checking file size:', error);
        // Proceed anyway if we can't check size
        await uploadToOcrSpace(uri);
      }
    }
  };

  const handleClearText = () => {
    setText('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.textArea}
        placeholder="Paste your result here..."
        value={text}
        onChangeText={setText}
        multiline
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.pasteButton]} onPress={handlePaste}>
          <Text style={styles.buttonText}>Paste All</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.cleanButton]} onPress={handleCleanPaste}>
          <Text style={styles.buttonText}>Clean Paste</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.cameraButton]} onPress={handleCameraScan}>
          <Text style={styles.buttonText}>Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.galleryButton]} onPress={handleGalleryScan}>
          <Text style={styles.buttonText}>Gallery</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClearText}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default PasteScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 30,
  },
  textArea: {
    height: 300,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
    color: '#000', // 🔥 Fix for Dark Mode
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  pasteButton: {
    backgroundColor: '#00897B',
  },
  cleanButton: {
    backgroundColor: '#4CAF50',
  },
  cameraButton: {
    backgroundColor: '#9C27B0',
  },
  galleryButton: {
    backgroundColor: '#FF9800',
  },
  clearButton: {
    backgroundColor: '#FF5722',
  },
  submitButton: {
    backgroundColor: '#1976D2',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#BDBDBD',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});