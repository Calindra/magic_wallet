/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ColorSchemeName, Pressable } from 'react-native';

import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';
import ModalScreen from '../screens/ModalScreen';
import NotFoundScreen from '../screens/NotFoundScreen';
import SolanaWallet from '../screens/SolanaWallet';
import { RootStackParamList, RootTabParamList } from '../types';
import LinkingConfiguration from './LinkingConfiguration';
import SolanaStatementScreen from '../screens/SolanaStatement';
import SolanaDapp from '../screens/SolanaDapp';
import SolanaCameraScreen from '../screens/SolanaCameraScreen';
import SolanaQRCodeScreen from '../screens/SolanaQRCodeScreen';
import SolanaTransferScreen from '../screens/SolanaTransferScreen';
import AuthContext from '../src/contexts/AuthContext';
import SignInScreen from '../screens/SignInScreen';

export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
    const [password, setPassword] = useState('')
    return (
        <AuthContext.Provider value={{
            password, setPassword
        }}>
            <NavigationContainer
                linking={LinkingConfiguration}
                theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <RootNavigator />
            </NavigationContainer>
        </AuthContext.Provider>
    );
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
    return (
        <AuthContext.Consumer>{({ password }) =>
            <Stack.Navigator>
                {password ? (
                    <>
                        <Stack.Screen name="Root" component={BottomTabNavigator} options={{ headerShown: false }} />
                        <Stack.Screen name="StackTransfer" component={SolanaTransferScreen} options={{ title: 'Enviar' }} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
                    </>
                )}
                <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
                <Stack.Group screenOptions={{ presentation: 'modal' }}>
                    <Stack.Screen name="Modal" component={ModalScreen} />
                </Stack.Group>
            </Stack.Navigator>
        }
        </AuthContext.Consumer>
    );
}

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */
const BottomTab = createBottomTabNavigator<RootTabParamList>();

function BottomTabNavigator() {
    const colorScheme = useColorScheme();

    return (
        <BottomTab.Navigator
            initialRouteName="Solana"
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme].tint,
            }}>
            <BottomTab.Screen
                name="Extrato"
                component={SolanaStatementScreen}
                options={{
                    // headerShown: false,
                    title: 'História',
                    // database?
                    // tabBarIcon: ({ color }) => <TabBarIcon name="folder-open-o" color={color} />,

                    // somente pq tem relacao com Japao e Historia
                    tabBarIcon: ({ color }) => <FontAwesome5 name="torii-gate" size={21} style={{ marginBottom: -3 }} color={color} />,


                    // tabBarIcon: ({ color }) => <Ionicons name="file-tray-full" size={24} style={{ marginBottom: -3 }} color={color} />,
                    
                }}
            />
            <BottomTab.Screen
                name="QRCodeReader"
                component={SolanaCameraScreen}
                options={{
                    title: 'Enviar',

                    // paw like pay :-D
                    // tabBarIcon: ({ color }) => <TabBarIcon name="paw" color={color} />,
                    // tabBarIcon: ({ color }) => <TabBarIcon name="credit-card" color={color} />,
                    // tabBarIcon: ({ color }) => <TabBarIcon name="leaf" color={color} />,
                    tabBarIcon: ({ color }) => <FontAwesome5 name="people-arrows" size={24} style={{ marginBottom: -3 }} color={color} />,
                }}
            />
            <BottomTab.Screen
                name="Solana"
                component={SolanaWallet}

                options={{
                    headerShown: false,
                    title: 'Wallet',
                    // tabBarIcon: ({ color }) => <SimpleLineIcons name="wallet" size={24} style={{ marginBottom: -3 }} color={color} />,

                    // Para passar a ideia de inventario
                    tabBarIcon: ({ color }) => <FontAwesome5 name="icons" size={24} style={{ marginBottom: -3 }} color={color} />,
                }}
            />
            <BottomTab.Screen
                name="QRCode"
                component={SolanaQRCodeScreen}
                options={{
                    title: 'Receber',
                    tabBarIcon: ({ color }) => <FontAwesome5 name="hand-holding-heart" size={24} style={{ marginBottom: -3 }} color={color} />,
                }}
            />
            <BottomTab.Screen
                name="Transfer"
                component={SolanaDapp}
                options={{
                    title: 'Game',
                    tabBarIcon: ({ color }) => <TabBarIcon name="gamepad" color={color} />,
                }}
            />
        </BottomTab.Navigator>
    );
}

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
    name: React.ComponentProps<typeof FontAwesome>['name'];
    color: string;
}) {
    return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}
