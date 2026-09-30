import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const httpLink = createHttpLink({ uri: `${API_URL}/graphql` });

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: { ...headers, ...(token ? { authorization: `Bearer ${token}` } : {}) },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});