import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ChatEditor from './pages/ChatEditor';
import './index.css';
import './styles/print.css';

const router = createBrowserRouter([
  { path: '/', element: <ChatEditor /> },
]);

const el = document.getElementById('root');
if (el) {
  const root = createRoot(el);
  root.render(<RouterProvider router={router} />);
}


