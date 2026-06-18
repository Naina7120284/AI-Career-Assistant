'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/api';
import { useUser } from '@/hooks/useUser';

interface ResumeUploaderProps {
  onUploadComplete: (data: any) => void;
}

export function ResumeUploader({ onUploadComplete }: ResumeUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const { user } = useUser();

  const handleUpload = async (file: File) => {

  if (!file) return;

  if (!user?.id) {

    alert('Please login first')

    return
  }

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const response = await fetch(
        apiUrl(`/api/v1/resume/upload?user_id=${user?.id}`),
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();

      clearInterval(interval);
      setProgress(100);

      if (response.ok) {

  // =========================
  // SAVE SKILLS DATA
  // =========================
await fetch('/api/skills-growth', {
  method: 'POST',

  headers: {
    'Content-Type': 'application/json',
  },

  body: JSON.stringify({

    communication:
      result.ats_score >= 80 ? 85 : 70,

    problem_solving:
      result.extracted_skills?.length >= 8
        ? 88
        : 72,

    leadership:
      result.extracted_skills?.some(
        (skill: string) =>
          skill.toLowerCase().includes('lead')
      )
        ? 82
        : 68,

    technical_skills:
      result.extracted_skills?.length >= 10
        ? 90
        : 75,
  }),
})

  setTimeout(() => {
    onUploadComplete(result);
  }, 500);

} else {

  alert(result.detail || "Upload failed");

}

    } catch (error) {
      console.error('Upload failed:', error);
      clearInterval(interval);
      alert("Upload failed");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
      }, 500);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndUpload = (file: File) => {
    // FILE SIZE CHECK
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large! Please upload a PDF under 5MB.");
      return;
    }

    // FILE TYPE CHECK
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }

    handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[24px] shadow-[0_15px_40px_rgba(170,180,220,0.10)] overflow-hidden">

      <div className="p-6 md:p-8">

        {/* TOP */}
        <div className="text-center mb-7">

          <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-[#EEF4FF] to-[#F6F0FF] flex items-center justify-center mx-auto mb-6 shadow-sm border border-white">

            <span className="text-3xl">
              📄
            </span>
          </div>

          <h2 className="text-[26px] md:text-[30px] font-black text-[#14213D] tracking-[-0.03em]">
            Upload Your Resume
          </h2>

          <p className="text-[#64748B] mt-2 text-[14px]">
            Let AI analyze your skills and find your dream job
          </p>
        </div>

        {/* DROP AREA */}
        <div
          className={`relative border-2 border-dashed rounded-[18px] p-6 text-center transition-all duration-300 cursor-pointer bg-white/50 backdrop-blur-sm ${
            dragActive
              ? 'border-[#7C9DFF] bg-[#F4F7FF]'
              : 'border-[#D7E2F3] hover:border-[#9AB6FF]'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >

          <input
            type="file"
            accept=".pdf"
            onChange={handleChange}
            disabled={isUploading}
            className="hidden"
            id="resume-upload"
          />

          <label
            htmlFor="resume-upload"
            className="cursor-pointer block"
          >

            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#E8EEFF] to-[#FFF7D6] flex items-center justify-center mx-auto mb-6 shadow-sm">

              <span className="text-2xl">
                📁
              </span>
            </div>

            {isUploading ? (

              <div>

                <div className="w-full max-w-[300px] h-2 bg-[#E6ECF8] rounded-full mx-auto overflow-hidden">

                  <div
                    className="h-full bg-gradient-to-r from-[#7C9DFF] to-[#A855F7] rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="mt-4 text-sm text-[#475569] font-medium">
                  {progress < 100
                    ? 'Analyzing your resume...'
                    : 'Complete! Redirecting...'}
                </p>
              </div>

            ) : (

              <>
                <p className="text-[#475569] text-[14px]">

                  <span className="font-bold text-[#5B7CFA]">
                    Click to upload
                  </span>

                  {' '}or drag and drop
                </p>

                <p className="text-xs text-[#94A3B8] mt-2">
                  PDF files only (Max 5MB)
                </p>
              </>
            )}
          </label>
        </div>

        {/* FEATURES */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">

          <div className="bg-white/70 rounded-xl p-3 border border-[#EEF2FF] text-center shadow-sm">

            <div className="w-10 h-10 rounded-lg bg-[#ECFDF3] flex items-center justify-center mx-auto mb-3 text-base">
              🔒
            </div>

            <p className="text-xs font-semibold text-[#475569]">
              Secure Upload
            </p>
          </div>

          <div className="bg-white/70 rounded-xl p-3 border border-[#EEF2FF] text-center shadow-sm">

            <div className="w-10 h-10 rounded-lg bg-[#F3E8FF] flex items-center justify-center mx-auto mb-3 text-base">
              🤖
            </div>

            <p className="text-xs font-semibold text-[#475569]">
              AI Analysis
            </p>
          </div>

          <div className="bg-white/70 rounded-xl p-3 border border-[#EEF2FF] text-center shadow-sm">

            <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center mx-auto mb-3 text-base">
              ⚡
            </div>

            <p className="text-xs font-semibold text-[#475569]">
              Instant Results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}