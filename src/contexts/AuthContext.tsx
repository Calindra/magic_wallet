import React from "react";

export interface Authenticator {
    password: string;

    setPassword(code: string): void;
}

const AuthContext = React.createContext({ password: '', setPassword: () => { } } as Authenticator);

export default AuthContext;
