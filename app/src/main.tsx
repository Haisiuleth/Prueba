import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'tachyons/css/tachyons.min.css';
import './index.css';
import { client } from './api/apollo';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Products from './pages/Products';
import Profile from './pages/Profile';
import ProductDetail from './pages/ProductDetail';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/products" element={<Products />} />
               <Route path="/products/:id" element={<ProductDetail />} />
               <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ApolloProvider>
  </React.StrictMode>
);