import { NextResponse } from 'next/server'
import { groq } from '@/lib/groq'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json()

    const {
      jobTitle,
      companyName,
      jobDescription,
      tone,
    } = body

    // Validation
    if (!jobTitle || !companyName) {
      return NextResponse.json(
        {
          error: 'Job title and company name are required',
        },
        {
          status: 400,
        }
      )
    }

    // Supabase client
    const supabase = await createServerSupabaseClient()

    // Get logged in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    // AI Prompt
    const prompt = `
You are an expert AI career assistant.

Write a highly professional, ATS-friendly, modern cover letter.

Job Title:
${jobTitle}

Company Name:
${companyName}

Tone:
${tone}

Job Description:
${jobDescription || 'Not provided'}

Requirements:
- Make it impressive and realistic
- Keep it concise but strong
- Use modern professional language
- Make it sound human
- Avoid generic filler
- Make it suitable for top companies
`

    // Generate using Groq
    const completion =
      await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',

        messages: [
          {
            role: 'system',
            content:
              'You are a world-class AI career coach and professional recruiter.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],

        temperature: 0.8,

        max_tokens: 1200,
      })

    // Extract response
    const generatedLetter =
      completion.choices?.[0]?.message?.content || ''

    if (!generatedLetter) {
      return NextResponse.json(
        {
          error: 'Failed to generate cover letter',
        },
        {
          status: 500,
        }
      )
    }

    // Save to Supabase
    const { error: saveError } = await supabase
      .from('cover_letters')
      .insert({
        user_id: user.id,

        job_title: jobTitle,

        company_name: companyName,

        job_description: jobDescription,

        tone,

        generated_letter: generatedLetter,
      })

    if (saveError) {
      console.error(
        'Supabase save error:',
        saveError
      )

      return NextResponse.json({
        success: true,
        coverLetter: generatedLetter,
        saveFailed: true,
        saveError: saveError.message,
      })
    }

    // Success response
    return NextResponse.json({
      success: true,

      coverLetter: generatedLetter,
    })

  } catch (error) {
    console.error(
      'Cover letter generation error:',
      error
    )

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      {
        status: 500,
      }
    )
  }
}