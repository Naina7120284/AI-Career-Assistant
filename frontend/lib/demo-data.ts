/** In-app fallbacks when Supabase tables/RLS are not set up yet. */

export type DemoJob = {
  id: string
  title: string
  company: string
  location: string
  type: string
  experience: string
  posted_at: string
  logo: string
}

export const DEMO_JOBS: DemoJob[] = [
  {
    id: 'demo-1',
    title: 'Senior Software Engineer',
    company: 'TechCorp',
    location: 'Remote',
    type: 'Full Time',
    experience: '5+ Yrs',
    posted_at: new Date().toISOString(),
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
  },
  {
    id: 'demo-2',
    title: 'Product Manager',
    company: 'Notion',
    location: 'Bangalore',
    type: 'Full Time',
    experience: '3+ Yrs',
    posted_at: new Date().toISOString(),
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
  },
  {
    id: 'demo-3',
    title: 'Frontend Developer (React)',
    company: 'Vercel',
    location: 'Remote',
    type: 'Full Time',
    experience: '2+ Yrs',
    posted_at: new Date().toISOString(),
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
  },
  {
    id: 'demo-4',
    title: 'Data Analyst',
    company: 'Databricks',
    location: 'Delhi',
    type: 'Full Time',
    experience: '1+ Yrs',
    posted_at: new Date().toISOString(),
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
  },
  {
    id: 'demo-5',
    title: 'ML Engineer Intern',
    company: 'OpenAI',
    location: 'Remote',
    type: 'Internship',
    experience: '0+ Yrs',
    posted_at: new Date().toISOString(),
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg',
  },
]

export function filterDemoJobs(params: {
  search?: string
  location?: string
  jobType?: string
  experience?: string
}): DemoJob[] {
  let list = [...DEMO_JOBS]
  const s = (params.search || '').trim().toLowerCase()
  if (s) {
    list = list.filter(
      (j) =>
        j.title.toLowerCase().includes(s) ||
        j.company.toLowerCase().includes(s)
    )
  }
  if (params.location) {
    list = list.filter((j) => j.location === params.location)
  }
  if (params.jobType) {
    list = list.filter((j) => j.type === params.jobType)
  }
  if (params.experience) {
    list = list.filter((j) => j.experience === params.experience)
  }
  return list
}

export const DEFAULT_SKILLS = {
  communication: 72,
  problem_solving: 78,
  leadership: 65,
  technical_skills: 84,
  overall_score: 75,
}

export const DEFAULT_COURSES = [
  {
    id: 'c1',
    title: 'System Design Fundamentals',
    type: 'technical',
    progress: 40,
    provider: 'Self-paced',
  },
  {
    id: 'c2',
    title: 'Effective Communication at Work',
    type: 'communication',
    progress: 60,
    provider: 'Video',
  },
]

export const DEFAULT_RECOMMENDATIONS = [
  {
    id: 'r1',
    title: 'Practice behavioral stories (STAR)',
    priority: 'high',
    icon: 'communication',
  },
  {
    id: 'r2',
    title: 'Ship one portfolio project with metrics',
    priority: 'medium',
    icon: 'management',
  },
]

export const DEMO_SAVED_ITEMS = [
  {
    id: 'demo-s1',
    title: 'Product Manager',
    company: 'Google',
    location: 'Bangalore, India',
    type: 'Full Time',
    work_mode: 'Remote',
    experience: '5+ Yrs Exp',
    category: 'jobs',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg',
    saved_date: 'May 10, 2026',
  },
  {
    id: 'demo-s2',
    title: 'Senior UX Designer',
    company: 'Microsoft',
    location: 'Hyderabad, India',
    type: 'Full Time',
    work_mode: 'On-site',
    experience: '3-5 Yrs Exp',
    category: 'jobs',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows8/windows8-original.svg',
    saved_date: 'May 08, 2026',
  },
]

export const DEMO_ROADMAP = {
  id: 'demo-roadmap',
  target_role: 'Senior Product Manager',
  target_date: 'Dec 2026',
}

export const DEMO_ROADMAP_STEPS = [
  {
    id: 'demo-step-1',
    title: 'Build Foundation',
    description:
      'Strengthen your core skills and gain relevant experience.',
    stage: 'Current Stage',
    progress: 3,
    total: 5,
  },
  {
    id: 'demo-step-2',
    title: 'Gain Experience',
    description: 'Work on real projects and build your portfolio.',
    stage: 'In Progress',
    progress: 2,
    total: 4,
  },
  {
    id: 'demo-step-3',
    title: 'Upskill & Specialize',
    description: 'Learn advanced skills and industry best practices.',
    stage: 'Next Stage',
    progress: 1,
    total: 4,
  },
  {
    id: 'demo-step-4',
    title: 'Achieve Your Goal',
    description: 'Position yourself for the target role and grow.',
    stage: 'Final Stage',
    progress: 0,
    total: 3,
  },
]
