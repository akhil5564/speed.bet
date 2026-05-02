// import React, { useEffect } from 'react';
// import { Appearance } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';


// import ViewBillScreen from './src/screens/ViewBillScreen';

// import SplashScreen from './src/screens/SplashScreen';
// import LoginScreen from './src/screens/LoginScreen';
// import MainScreen from './src/screens/MainScreen';
// import AddScreen from './src/screens/AddScreen';
// import EditDeleteBillScreen from './src/screens/EditDeleteBillScreen';
// import ReportsScreen from './src/screens/ReportsScreen';
// import ManageSalesScreen from './src/screens/ManageSalesScreen';
// import ResultScreen from './src/screens/ResultScreen';
// import SalesReportScreen from './src/screens/SalesReportScreen';
// import WinningReportScreen from './src/screens/WinningReportScreen';
// import NumberWiseReportScreen from './src/screens/NumberWiseReportScreen';
// import NetpayScreen from './src/screens/NetPayScreen';
// import AccountSummary from './src/screens/AccountSummary';
// import UsersScreen from './src/screens/UsersScreen';
// import CreateUserScreen from './src/screens/CreateUserScreen';
// import ListUserScreen from './src/screens/ListUserScreen';
// import RateMasterScreen from './src/screens/RateMasterScreen';
// import SelectResultScreen from './src/screens/SelectResultScreen';
// import BlockUser from './src/screens/BlockUser';
// import EditUserScreen from './src/screens/EditUserScreen';
// import BlockNumberScreen from './src/screens/BlockNumberScreen';
// import ResultEntryScreen from './src/screens/ResultEntryScreen';
// import PasteScreen from './src/screens/PasteScreen';
// import SalesReportSummery from './src/screens/SalesReportSummery';
// import SalesReportDetailed from './src/screens/SalesDetailed';
// import TicketLimitScreen from './src/screens/TicketLimitScreen';
// import NumberWiseReportResult from './src/screens/NumberWiseReportResult'
// import Schemes from './src/screens/Schemes'
// import WinningDetailed from './src/screens/WinningDetailed'
// import MORE from './src/screens/MORE'
// import TimeBlockSettingsScreen from './src/screens/TimeBlockSettingsScreen';
// import NetPaySummary from './src/screens/NetPaySummary';
// import BlockDate from './src/screens/BlockDate';
// import Usernumberblock from './src/screens/Usernumberblock';
// import Usercreditlimit from './src/screens/Usercreditlimit';


// // Define the WinningReport interface
// interface WinningReport {
//   fromDate: string;
//   toDate: string;
//   time: string;
//   agent: string;
//   grandTotal: number;
//   bills: Array<{
//     billNo: string;
//     createdBy: string;
//     scheme: string;
//     winnings?: Array<{
//       number: string;
//       type: string;
//       winType?: string;
//       count: number;
//       winAmount: number;
//     }>;
//   }>;
//   usersList: string[];
// }

// export type RootStackParamList = {
//   Splash: undefined;
//   Login: undefined;
//   Main: undefined;
//   Add: undefined;
//   Edit: undefined;
//   Reports: undefined;
//   ManageSales: undefined;
//   Result: undefined;
//   SalesReportScreen: undefined;
//   WinningReportScreen: undefined;
//   NumberWiseReportScreen: undefined;
//   NetPayScreen: undefined;
//   AccountSummary: undefined;
//   UsersScreen: undefined;
//   CreateUser: undefined;
//   ListUsers: undefined;
//   RateMaster: undefined;
//   SelectResultScreen: undefined;
//   BlockUser: undefined;
//   EditUserScreen: undefined;
//   BlockNumberScreen: undefined;
//   ResultEntry: undefined;
//   SalesReportSummery: undefined;
//   SalesReportDetailed: { date: string };
//   Paste: undefined;
//   TicketLimit: undefined;
//   ViewBill: undefined;
//   NumberWiseReportResult: undefined;
//   winningdetailed: { report: WinningReport };
//   MORE: undefined;
//   Schemes: undefined;
//   netdetailed: {
//     fromDate: string;
//     toDate: string;
//     matchedEntries: any[];
//     usersList: string[];
//     loggedInUser: any;
//     selectedTime?: string;
//     time: string;
//     fromAccountSummary: boolean;
    
//     userRates: { [username: string]: any };
//   };
//   timeset: undefined;
// };


// const Stack = createNativeStackNavigator<RootStackParamList>();

// export default function App() {
//   useEffect(() => {
//     if (Appearance.setColorScheme) {
//       Appearance.setColorScheme('light');
//     }
//   }, []);
//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <NavigationContainer>
//         <Stack.Navigator screenOptions={{ headerShown: false }}>
//           <Stack.Screen name="Splash" component={SplashScreen} />
//           <Stack.Screen name="Login" component={LoginScreen} />
//           <Stack.Screen name="Main" component={MainScreen} />
//           <Stack.Screen name="Add" component={AddScreen} />
//           <Stack.Screen name="Edit" component={EditDeleteBillScreen} />
//           <Stack.Screen name="Reports" component={ReportsScreen} />
//           <Stack.Screen name="ManageSales" component={ManageSalesScreen} />
//           <Stack.Screen name="Result" component={ResultScreen} />
//           <Stack.Screen name="SalesReportScreen" component={SalesReportScreen} />
//           <Stack.Screen name="WinningReportScreen" component={WinningReportScreen} />
//           <Stack.Screen name="NumberWiseReportScreen" component={NumberWiseReportScreen} />
//           <Stack.Screen name="NetPayScreen" component={NetpayScreen} />
//           <Stack.Screen name="AccountSummary" component={AccountSummary} />
//           <Stack.Screen name="UsersScreen" component={UsersScreen} />
//           <Stack.Screen name="CreateUser" component={CreateUserScreen} />
//           <Stack.Screen name="ListUsers" component={ListUserScreen} />
//           <Stack.Screen name="RateMaster" component={RateMasterScreen} />
//           <Stack.Screen name="SelectResultScreen" component={SelectResultScreen} />
//           <Stack.Screen name="BlockUser" component={BlockUser} />
//           <Stack.Screen name="Usernumberblock" component={Usernumberblock} />

//           <Stack.Screen name="EditUserScreen" component={EditUserScreen} />
//           <Stack.Screen name="BlockNumberScreen" component={BlockNumberScreen} />
//           <Stack.Screen name="ResultEntry" component={ResultEntryScreen} />
//           <Stack.Screen name="SalesReportSummery" component={SalesReportSummery} />
//           <Stack.Screen name="SalesReportDetailed" component={SalesReportDetailed} />
//           <Stack.Screen name="TicketLimit" component={TicketLimitScreen} />
//           <Stack.Screen name="Paste" component={PasteScreen} />
//             <Stack.Screen name="ViewBill" component={ViewBillScreen} />
// <Stack.Screen name="NumberWiseReportResult" component={NumberWiseReportResult} />
// <Stack.Screen name="winningdetailed" component={WinningDetailed} />
// <Stack.Screen name="MORE" component={MORE} />
// <Stack.Screen name="netdetailed" component={NetPaySummary} />

// <Stack.Screen name="Schemes" component={Schemes} />
// <Stack.Screen name="timeset" component={TimeBlockSettingsScreen} />
// <Stack.Screen name="blockdate" component={BlockDate} />
// <Stack.Screen name="usercreditlimit" component={Usercreditlimit} />


//         </Stack.Navigator>
//       </NavigationContainer>
//     </GestureHandlerRootView>
//   );
// }
