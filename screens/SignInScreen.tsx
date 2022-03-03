import React, { useContext, useState } from "react";
import { Button, TextInput, View, StyleSheet, ImageBackground } from "react-native";
import useColorScheme from "../hooks/useColorScheme";
import AuthContext from "../src/contexts/AuthContext";
import { Asset } from "expo-asset";


const darkStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    image: {
        flex: 1,
        justifyContent: "center",
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    separator: {
        marginVertical: 15,
        height: 1,
        width: '80%',
    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        color: '#fff',
        borderColor: '#ccc',
        // width: '80%'
    },
    text: {
        color: '#fff'
    },
    placeholder: {
        color: '#777777'
    },
    card: {
        backgroundColor: '#000000',
        opacity: 0.6,
        borderRadius: 5
    }
});

const whiteStyles = {
    ...darkStyles,
    text: {
        ...darkStyles.text,
        color: '#000000'
    },
    input: {
        ...darkStyles.input,
        color: '#000000',
        borderColor: '#CCCCCC',
    }
}

const image = { uri: Asset.fromModule(require("../assets/images/splash-horizon.png")).uri }

export default function SignInScreen() {
    const colorScheme = useColorScheme();
    const styles = colorScheme === 'dark' ? darkStyles : whiteStyles;

    const [password, setPasswordField] = useState('');

    const { setPassword } = useContext(AuthContext);

    return (
        <View style={styles.container}>
            <ImageBackground source={image} resizeMode="cover" style={styles.image}>
                <View style={{ marginTop: '50%', paddingHorizontal: 10 }}>
                    <View style={styles.card}>
                        <TextInput
                            placeholder="Password"
                            value={password}
                            onChangeText={setPasswordField}
                            secureTextEntry
                            style={styles.input}
                            placeholderTextColor={styles.placeholder.color}
                        />
                        <Button title="Sign in" onPress={() => {
                            setPassword(password)
                        }} />
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
}