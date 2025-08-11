import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import StatusStrip from '../components/StatusStrip';

const steps = [
  { path: '/', label: 'Upload' },
  { path: '/structure', label: 'Structure' },
  { path: '/edit', label: 'Edit' },
  { path: '/tailor', label: 'Tailor' },
  { path: '/export', label: 'Export' },
];

export default function StepperLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ rawTextLen: 0, ocrUsed: false, validateOk: false, appliedCount: 0 });

  useEffect(() => {
    // Restore last step on first mount
    const savedStep = localStorage.getItem('stepPath');
    if (savedStep && savedStep !== loc.pathname) {
      navigate(savedStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Persist current step
    localStorage.setItem('stepPath', loc.pathname);
  }, [loc.pathname]);

  useEffect(() => {
    function read() {
      const rawTextLen = Number(localStorage.getItem('rawTextLen') || '0');
      const ocrUsed = localStorage.getItem('ocr_used') === 'true';
      const validateOk = localStorage.getItem('validateOk') === 'true';
      const appliedCount = Number(localStorage.getItem('appliedCount') || '0');
      setStatus({ rawTextLen, ocrUsed, validateOk, appliedCount });
    }
    read();
    const onStorage = () => read();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return (
    <div className="min-h-screen p-4">
      <nav className="flex gap-3 mb-4">
        {steps.map((s) => {
          const active = loc.pathname === s.path || (s.path !== '/' && loc.pathname.startsWith(s.path));
          return (
            <Link key={s.path} to={s.path} className={`px-3 py-1 rounded ${active ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {s.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
      <StatusStrip rawTextLen={status.rawTextLen} ocrUsed={status.ocrUsed} validateOk={status.validateOk} appliedCount={status.appliedCount} />
    </div>
  );
}


