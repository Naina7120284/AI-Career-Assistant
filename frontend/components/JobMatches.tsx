'use client';

import { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/api';

interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  match_score: number;
  description: string;
}

interface JobMatchesProps {
  userId?: string;
}

export function JobMatches({ userId = 'user?.id' }: JobMatchesProps) {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchJobMatches = async () => {
    setIsLoading(true);
    try {
      // This calls your backend to get job matches based on resume
      const response = await fetch(apiUrl('/api/v1/chat/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Based on my resume, what are the top 5 job titles I'm qualified for? List them with match percentages.",
          user_id: userId
        }),
      });
      
      const data = await response.json();
      
      // Parse the AI response into job matches (simplified)
      const parsedMatches = parseJobMatches(data.response);
      setMatches(parsedMatches);
      setHasSearched(true);
    } catch (error) {
      console.error('Failed to fetch job matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseJobMatches = (aiResponse: string): JobMatch[] => {
    // Simple parsing of AI response into job objects
    // In production, you'd want a more robust parsing method
    const lines = aiResponse.split('\n');
    const jobs: JobMatch[] = [];
    
    lines.forEach((line, index) => {
      if (line.match(/\d+\./) || line.match(/•/)) {
        const match = line.match(/(\d+)%|\b(\d+)\s*%/);
        const score = match ? parseInt(match[1]) : 70 - (index * 5);
        
        jobs.push({
          id: `job-${index}`,
          title: line.replace(/^\d+\.|\•/g, '').split('-')[0].trim(),
          company: 'Based on your profile',
          location: 'Various locations',
          match_score: Math.min(score, 95),
          description: line
        });
      }
    });
    
    return jobs.slice(0, 5);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 mb-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">🎯 Recommended Jobs</h3>
          <p className="text-gray-500 text-xs">Based on your resume and skills</p>
        </div>
        <button
          onClick={fetchJobMatches}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1.5 rounded-md text-sm hover:opacity-90 transition disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : 'Find Matching Jobs'}
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Analyzing your resume...</p>
        </div>
      )}

      {!isLoading && hasSearched && matches.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <span className="text-3xl mb-2 block">🔍</span>
          <p>No specific job matches found. Try asking in the chat!</p>
        </div>
      )}

      {!isLoading && matches.length > 0 && (
        <div className="space-y-4">
          {matches.map((job) => (
            <div key={job.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-[15px] text-gray-800">{job.title}</h4>
                  <p className="text-xs text-gray-500">{job.company} • {job.location}</p>
                  <p className="text-[13px] text-gray-600 mt-1.5 leading-relaxed">{job.description}</p>
                </div>
                <div className="ml-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">{job.match_score}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Match</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasSearched && !isLoading && (
        <div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-lg">
          <span className="text-4xl mb-2 block">💼</span>
          <p>Click "Find Matching Jobs" to see personalized recommendations</p>
        </div>
      )}
    </div>
  );
}