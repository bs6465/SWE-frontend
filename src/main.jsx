import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx'; // 👈 1단계에서 만든 회원가입 페이지
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CreateTeamPage from './pages/CreateTeamPage.jsx';

import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <App />,
      },
      {
        path: '/create-team',
        element: <CreateTeamPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    // 👇 이 블록을 추가하세요
    path: '/register',
    element: <RegisterPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
