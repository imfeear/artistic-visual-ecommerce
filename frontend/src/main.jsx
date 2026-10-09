import React, { lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import '@fontsource-variable/manrope';
import './index.css';
import { AuthProvider } from './auth/AuthContext.jsx';
import { CartProvider } from './cart/CartContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import { RouteFrame, NotFound, RouteError } from './components/RouteFrame';

const App = lazy(() => import('./App.jsx'));
const Catalog = lazy(() => import('./pages/Catalog.jsx'));
const ProductDetails = lazy(() => import('./pages/ProductDetails.jsx'));
const AdminProducts = lazy(() => import('./pages/AdminProducts.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));

const router = createBrowserRouter([
  {
    element: <RouteFrame />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <App /> },
      { path: '/catalogo', element: <Catalog /> },
      { path: '/carrinho', element: <Cart /> },
      { path: '/produto/:id', element: <ProductDetails /> },
      { path: '/login', element: <Login /> },
      {
        path: '/admin',
        element: <ProtectedRoute />,
        children: [{ index: true, element: <AdminProducts /> }],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>,
);
