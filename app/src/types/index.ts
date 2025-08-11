export type Suggestion = {
  id: string;
  path: string;
  kind: 'replace' | 'insert' | 'delete';
  oldValue?: any;
  newValue?: any;
  rationale: string;
  provenance: 'from_resume' | 'from_jd' | 'from_user';
  confidence?: number;
  priority?: 1 | 2 | 3;
  section?: 'summary' | 'skills' | 'work' | 'projects' | 'education' | 'certs';
};

export type Resume = {
  basics: {
    name: string;
    label: string;
    email: string;
    phone: string;
    location?: string;
    links?: string[];
  };
  summary?: string;
  skills?: string[];
  work?: Array<{
    position: string;
    company: string;
    location: string;
    startDate: string; // YYYY-MM | Present
    endDate: string;   // YYYY-MM | Present
    bullets: string[];
  }>;
  projects?: Array<{
    name: string;
    startDate: string;
    endDate?: string;
    link?: string;
    bullets: string[];
  }>;
  education?: Array<{
    institution: string;
    studyType: string;
    area: string;
    startDate: string;
    endDate: string;
    notes?: string;
  }>;
  certs?: string[];
};


