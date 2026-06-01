import { NextResponse } from 'next/server'

function generateRoadmap(role: string) {
  const lower =
    role.toLowerCase()

  if (
    lower.includes('frontend')
  ) {
    return [
      {
        title:
          'Master HTML, CSS & JavaScript',
        description:
          'Build strong frontend fundamentals.',
        stage: 'Current Stage',
        progress: 2,
        total: 5,
      },

      {
        title:
          'Learn React & Next.js',
        description:
          'Create modern scalable frontend apps.',
        stage: 'In Progress',
        progress: 1,
        total: 4,
      },

      {
        title:
          'Build Real Projects',
        description:
          'Create portfolio projects.',
        stage: 'Next Stage',
        progress: 0,
        total: 4,
      },

      {
        title:
          'Prepare for Interviews',
        description:
          'Practice DSA and frontend interviews.',
        stage: 'Final Stage',
        progress: 0,
        total: 3,
      },
    ]
  }

  return [
    {
      title:
        'Build Technical Foundation',
      description:
        'Strengthen programming fundamentals and technical skills.',
      stage: 'Current Stage',
      progress: 2,
      total: 5,
    },

    {
      title:
        'Build Real Projects',
      description:
        'Create projects and improve practical experience.',
      stage: 'In Progress',
      progress: 1,
      total: 4,
    },

    {
      title:
        'Master System Design',
      description:
        'Learn scalable architecture and backend systems.',
      stage: 'Next Stage',
      progress: 0,
      total: 4,
    },

    {
      title:
        'Crack Product Interviews',
      description:
        'Prepare for top tech company interviews.',
      stage: 'Final Stage',
      progress: 0,
      total: 3,
    },
  ]
}

let roadmap = {
  id: '1',
  target_role:
    'Software Developer',
  target_date: '2026',
}

let steps =
  generateRoadmap(
    roadmap.target_role
  )

export async function GET() {
  return NextResponse.json({
    roadmap,
    steps,
  })
}

export async function POST(
  request: Request
) {
  const body =
    await request.json()

  roadmap = {
    id: '1',
    target_role:
      body.target_role,
    target_date:
      body.target_date,
  }

  steps = generateRoadmap(
    body.target_role
  )

  return NextResponse.json({
    roadmap,
    steps,
  })
}