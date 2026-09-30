import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { gql, useMutation } from '@apollo/client';

const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
    }
  }
`;

interface AuthCtx {
  token: string | null;
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loginMutation] = useMutation(LOGIN);

  const login = async (username: string, password: string) => {
    const { data } = await loginMutation({ variables: { username, password } });
    localStorage.setItem('token', data.login.token);
    setToken(data.login.token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return <Ctx.Provider value={{ token, login, logout }}>{children}</Ctx.Provider>;
}