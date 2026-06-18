const getATSMessage = (score: number) => {

  if (score >= 85) {
    return "Excellent ATS optimization. Your resume is highly competitive."
  }

  if (score >= 70) {
    return "Good resume structure, but some ATS improvements are still needed."
  }

  if (score >= 50) {
    return "Your resume needs better formatting, keywords, and measurable achievements."
  }

  return "Your resume is weak for ATS systems. Major improvements are recommended."
}

export function ResumeDashboard({ data }: { data: any }) {

  // =========================
  // ATS SCORE
  // =========================
  const displayScore =
    data.ats_score ?? data.score ?? 0

  return (

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ========================= */}
      {/* ATS SCORECARD */}
      {/* ========================= */}
      <div className="lg:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-slate-100">

        <h3 className="font-semibold text-[15px] mb-3">
          ATS Scorecard
        </h3>

        <div className="flex flex-col items-center justify-center p-4">

          <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-6 border-indigo-600">

            <span className="text-2xl font-bold">
              {displayScore}%
            </span>

          </div>

          <p className="mt-3 text-[13px] text-slate-500 text-center leading-relaxed">

            {getATSMessage(displayScore)}

          </p>

        </div>

      </div>

      {/* ========================= */}
      {/* RIGHT SIDE */}
      {/* ========================= */}
      <div className="lg:col-span-2 space-y-5">

        {/* ========================= */}
        {/* SKILLS */}
        {/* ========================= */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">

          <h3 className="font-semibold text-[15px] mb-3 text-indigo-600">
            Extracted Skills
          </h3>

          <div className="flex flex-wrap gap-2">

            {data.extracted_skills?.length > 0 ? (

              data.extracted_skills.map(
                (
                  skill: string,
                  index: number
                ) => (

                  <span
                    key={`${skill}-${index}`}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                )
              )

            ) : (

              <p className="text-slate-400 italic text-xs">
                No skills detected yet...
              </p>

            )}

          </div>

        </div>

        {/* ========================= */}
        {/* RECOMMENDED ROLES */}
        {/* ========================= */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">

          <h3 className="font-semibold text-[15px] mb-2">
            Recommended Roles
          </h3>

          <ul className="space-y-1.5 text-[13px] text-slate-600">

            {data.recommendations?.length > 0 ? (

              data.recommendations.map(
                (
                  role: string,
                  i: number
                ) => (

                  <li key={i}>
                    • {role}
                  </li>
                )
              )

            ) : (

              <li>
                Analyzing best career matches...
              </li>

            )}

          </ul>

        </div>

      </div>

    </div>
  )
}