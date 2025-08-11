import React from 'react';
import { useAppState } from '../store/appState';

export default function PDFPreview() {
  const { resume } = useAppState();
  return (
    <div className="print-resume max-w-[700px] mx-auto bg-white text-black p-6">
      <header className="mb-2">
        <div className="text-2xl font-bold">{resume.basics?.name || ''}</div>
        <div className="text-sm opacity-80">{resume.basics?.label || ''}</div>
        <div className="text-xs opacity-80">{resume.basics?.email} · {resume.basics?.phone}</div>
      </header>
      {resume.summary && (
        <section className="mb-3">
          <div className="font-semibold text-sm uppercase tracking-wide">Summary</div>
          <div className="text-sm leading-tight whitespace-pre-line">{resume.summary}</div>
        </section>
      )}
      {Array.isArray(resume.skills) && resume.skills.length > 0 && (
        <section className="mb-3">
          <div className="font-semibold text-sm uppercase tracking-wide">Skills</div>
          <div className="text-sm leading-tight">{resume.skills.join(', ')}</div>
        </section>
      )}
      {Array.isArray(resume.work) && resume.work.length > 0 && (
        <section className="mb-3">
          <div className="font-semibold text-sm uppercase tracking-wide">Experience</div>
          <div className="space-y-2">
            {resume.work.map((w, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm font-semibold">
                  <div>{w.position} — {w.company}</div>
                  <div className="opacity-80">{w.startDate} – {w.endDate}</div>
                </div>
                <div className="text-xs opacity-80">{w.location}</div>
                <ul className="list-disc pl-4 text-sm leading-tight">
                  {w.bullets?.map((b, bi) => <li key={bi}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      {Array.isArray(resume.projects) && resume.projects.length > 0 && (
        <section className="mb-3">
          <div className="font-semibold text-sm uppercase tracking-wide">Projects</div>
          <div className="space-y-2">
            {resume.projects.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm font-semibold">
                  <div>{p.name}</div>
                  <div className="opacity-80">{p.startDate}{p.endDate ? ` – ${p.endDate}` : ''}</div>
                </div>
                <ul className="list-disc pl-4 text-sm leading-tight">
                  {p.bullets?.map((b, bi) => <li key={bi}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      {Array.isArray(resume.education) && resume.education.length > 0 && (
        <section className="mb-3">
          <div className="font-semibold text-sm uppercase tracking-wide">Education</div>
          <div className="space-y-2">
            {resume.education.map((e, i) => (
              <div key={i} className="text-sm">
                <div className="flex justify-between font-semibold">
                  <div>{e.institution} — {e.studyType} {e.area ? `(${e.area})` : ''}</div>
                  <div className="opacity-80">{e.startDate} – {e.endDate}</div>
                </div>
                {e.notes && <div className="text-xs opacity-80">{e.notes}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
      {Array.isArray(resume.certs) && resume.certs.length > 0 && (
        <section className="mb-3">
          <div className="font-semibold text-sm uppercase tracking-wide">Certifications</div>
          <ul className="list-disc pl-4 text-sm leading-tight">
            {resume.certs.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}


