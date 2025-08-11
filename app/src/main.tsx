import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import StepperLayout from './routes/Stepper';
import UploadPage from './pages/Upload';
import StructurePage from './pages/Structure';
import EditPage from './pages/Edit';
import TailorPage from './pages/Tailor';
import ExportPage from './pages/Export';
import './index.css';
import './styles/print.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <StepperLayout />,
    children: [
      { index: true, element: <UploadPage /> },
      { path: 'structure', element: <StructurePage /> },
      { path: 'edit', element: <EditPage /> },
      { path: 'tailor', element: <TailorPage /> },
      { path: 'export', element: <ExportPage /> },
    ],
  },
]);

const el = document.getElementById('root');
if (el) {
  const root = createRoot(el);
  root.render(<RouterProvider router={router} />);
}


