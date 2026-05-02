// import React from 'react';
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
// import CreateSchemeScreen from './src/screens/CreateSchemeScreen';

// import WinningReportSummary from './src/screens/WinningReportSummary';

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
//   Edit: { billId?: string; billNo?: string; loggedInUser?: string };
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
//   winningreportsummary: {
//     report: WinningReport;
//     totalPrize: number;
//     totalSuper: number;
//     totalAmount: number;
//   };
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
//   Usernumberblock: undefined;
//   blockdate: undefined;
//   usercreditlimit: undefined;
//   createscheme: undefined;
// };


// const Stack = createNativeStackNavigator<RootStackParamList>();

// export default function App() {
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
//           <Stack.Screen name="ViewBill" component={ViewBillScreen} />
//           <Stack.Screen name="NumberWiseReportResult" component={NumberWiseReportResult} />
//           <Stack.Screen name="winningdetailed" component={WinningDetailed} />
//           <Stack.Screen name="winningreportsummary" component={WinningReportSummary} />
//           <Stack.Screen name="MORE" component={MORE} />
//           <Stack.Screen name="netdetailed" component={NetPaySummary} />

//           <Stack.Screen name="Schemes" component={Schemes} />
//           <Stack.Screen name="timeset" component={TimeBlockSettingsScreen} />
//           <Stack.Screen name="blockdate" component={BlockDate} />
//           <Stack.Screen name="usercreditlimit" component={Usercreditlimit} />
//           <Stack.Screen name="createscheme" component={CreateSchemeScreen} />


//         </Stack.Navigator>
//       </NavigationContainer>
//     </GestureHandlerRootView>
//   );
// }


import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LoadingProvider } from './src/context/LoadingContext';
import Throbber from './src/components/Throbber';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global axios interceptor for authentication
axios.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


import ViewBillScreen from './src/screens/ViewBillScreen';
import OverflowScreen from './src/screens/OverflowScreen';
import Overflowresult from './src/screens/OverflowReportResult';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import AddScreen from './src/screens/AddScreen';
import EditDeleteBillScreen from './src/screens/EditDeleteBillScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ManageSalesScreen from './src/screens/ManageSalesScreen';
import ResultScreen from './src/screens/ResultScreen';
import SalesReportScreen from './src/screens/SalesReportScreen';
import WinningReportScreen from './src/screens/WinningReportScreen';
import NumberWiseReportScreen from './src/screens/NumberWiseReportScreen';
import NetpayScreen from './src/screens/NetPayScreen';
import AccountSummary from './src/screens/AccountSummary';
import UsersScreen from './src/screens/UsersScreen';
import CreateUserScreen from './src/screens/CreateUserScreen';
import ListUserScreen from './src/screens/ListUserScreen';
import RateMasterScreen from './src/screens/RateMasterScreen';
import SelectResultScreen from './src/screens/SelectResultScreen';
import OverflowReportScreen from './src/screens/OverflowReportScreen';

import BlockUser from './src/screens/BlockUser';
import EditUserScreen from './src/screens/EditUserScreen';
import BlockNumberScreen from './src/screens/BlockNumberScreen';
import ResultEntryScreen from './src/screens/ResultEntryScreen';
import PasteScreen from './src/screens/PasteScreen';
import SalesReportSummery from './src/screens/SalesReportSummery';
import SalesReportDetailed from './src/screens/SalesDetailed';
import TicketLimitScreen from './src/screens/TicketLimitScreen';
import NumberWiseReportResult from './src/screens/NumberWiseReportResult'
import Schemes from './src/screens/Schemes'
import WinningDetailed from './src/screens/WinningDetailed'
import MORE from './src/screens/MORE'
import TimeBlockSettingsScreen from './src/screens/TimeBlockSettingsScreen';
import NetPaySummary from './src/screens/NetPaySummary';
import BlockDate from './src/screens/BlockDate';
import Usernumberblock from './src/screens/Usernumberblock';
import Usercreditlimit from './src/screens/Usercreditlimit';


import WinningReportSummary from './src/screens/WinningReportSummary';
import OverflowReportResult from './src/screens/OverflowReportResult';
import OverflowLimitScreen from './src/screens/OverflowLimitScreen';
import CreateSchemeScreen from './src/screens/CreateSchemeScreen';
import CreditLimitScreen from './src/screens/CreditLimitScreen';

// Define the WinningReport interface
interface WinningReport {
  fromDate: string;
  toDate: string;
  time: string;
  agent: string;
  grandTotal: number;
  bills: Array<{
    billNo: string;
    createdBy: string;
    scheme: string;
    winnings?: Array<{
      number: string;
      type: string;
      winType?: string;
      count: number;
      winAmount: number;
    }>;
  }>;
  usersList: string[];
}

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: undefined;
  Add: undefined;
  Edit: { billId?: string; billNo?: string; loggedInUser?: string };
  Reports: undefined;
  ManageSales: undefined;
  Result: undefined;
  SalesReportScreen: undefined;
  WinningReportScreen: undefined;
  NumberWiseReportScreen: undefined;
  NetPayScreen: undefined;
  AccountSummary: undefined;
  UsersScreen: undefined;
  CreateUser: undefined;
  ListUsers: undefined;
  RateMaster: undefined;
  SelectResultScreen: undefined;
  BlockUser: undefined;
  EditUserScreen: undefined;
  BlockNumberScreen: undefined;
  ResultEntry: undefined;
  SalesReportSummery: undefined;
  SalesReportDetailed: { date: string };
  Paste: undefined;
  TicketLimit: undefined;
  ViewBill: undefined;
  NumberWiseReportResult: undefined;
  winningdetailed: { report: WinningReport };
  winningreportsummary: {
    report: any;
    totalPrize?: number;
    totalSuper?: number;
    totalAmount?: number;
    allUsersData?: any[];
    currentLevelUser?: string;
    loggedInUser?: string;
  };
  MORE: undefined;
  Schemes: undefined;
  netdetailed: {
    fromDate: string;
    toDate: string;
    matchedEntries: any[];
    usersList: string[];
    loggedInUser: any;
    selectedTime?: string;
    time: string;
    fromAccountSummary: boolean;

    userRates: { [username: string]: any };
  };
  timeset: undefined;
  Usernumberblock: undefined;
  blockdate: undefined;
  usercreditlimit: undefined;
  CreditLimitScreen: { user: any };
  overflowresult: any;
  overflowLimit: any;
  OverflowScreen: any;
  CreateScheme: any;
  OverflowReportScreen: any;
  OverflowReportSummary: any;
};


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LoadingProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen name="Add" component={AddScreen} />
            <Stack.Screen name="Edit" component={EditDeleteBillScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="ManageSales" component={ManageSalesScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="SalesReportScreen" component={SalesReportScreen} />
            <Stack.Screen name="WinningReportScreen" component={WinningReportScreen} />
            <Stack.Screen name="NumberWiseReportScreen" component={NumberWiseReportScreen} />
            <Stack.Screen name="NetPayScreen" component={NetpayScreen} />
            <Stack.Screen name="AccountSummary" component={AccountSummary} />
            <Stack.Screen name="UsersScreen" component={UsersScreen} />
            <Stack.Screen name="overflowresult" component={OverflowReportResult} />
            <Stack.Screen name="overflowLimit" component={OverflowLimitScreen} />
            <Stack.Screen name="CreateUser" component={CreateUserScreen} />
            <Stack.Screen name="ListUsers" component={ListUserScreen} />
            <Stack.Screen name="RateMaster" component={RateMasterScreen} />
            <Stack.Screen name="SelectResultScreen" component={SelectResultScreen} />
            <Stack.Screen name="BlockUser" component={BlockUser} />
            <Stack.Screen name="Usernumberblock" component={Usernumberblock} />
            <Stack.Screen name="OverflowScreen" component={OverflowScreen} />
            <Stack.Screen name="CreateScheme" component={CreateSchemeScreen} />

            <Stack.Screen name="EditUserScreen" component={EditUserScreen} />
            <Stack.Screen name="BlockNumberScreen" component={BlockNumberScreen} />
            <Stack.Screen name="ResultEntry" component={ResultEntryScreen} />
            <Stack.Screen name="SalesReportSummery" component={SalesReportSummery} />
            <Stack.Screen name="SalesReportDetailed" component={SalesReportDetailed} />
            <Stack.Screen name="OverflowReportScreen" component={OverflowReportScreen} />

            <Stack.Screen name="TicketLimit" component={TicketLimitScreen} />
            <Stack.Screen name="Paste" component={PasteScreen} />
            <Stack.Screen name="ViewBill" component={ViewBillScreen} />
            <Stack.Screen name="NumberWiseReportResult" component={NumberWiseReportResult} />
            <Stack.Screen name="winningdetailed" component={WinningDetailed} />
            <Stack.Screen name="winningreportsummary" component={WinningReportSummary} />
            <Stack.Screen name="MORE" component={MORE} />
            <Stack.Screen name="netdetailed" component={NetPaySummary} />

            <Stack.Screen name="Schemes" component={Schemes} />
            <Stack.Screen name="timeset" component={TimeBlockSettingsScreen} />
            <Stack.Screen name="blockdate" component={BlockDate} />
            <Stack.Screen name="usercreditlimit" component={Usercreditlimit} />
            <Stack.Screen name="CreditLimitScreen" component={CreditLimitScreen} />
            <Stack.Screen name="OverflowReportSummary" component={require('./src/screens/OverflowReportSummary').default} />


          </Stack.Navigator>
        </NavigationContainer>
        <Throbber />
      </LoadingProvider>
    </GestureHandlerRootView>
  );
}
