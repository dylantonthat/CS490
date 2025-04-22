import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useEffect, useState } from "react";
import { useResume } from "../pages/home"; // adjust path if needed

export default function ResumeTrigger() {
  const { user } = useUser();
  const { jobId, setJobId, historyId, setResumeId, reset } = useResume();

  const [jobOptions, setJobOptions] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/jobs/history`);
        setJobOptions(res.data.jobs || []);
      } catch {
        setStatus("Could not load job history.");
      }
    };
    fetchJobs();
  }, []);

  const handleGenerate = async () => {
    if (!jobId || !historyId) return;

    try {
      setStatus("Generating...");
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/generate`, { jobId, historyId });
      setResumeId(res.data.resumeId);
      setStatus("Resume generation started.");
    } catch {
      setStatus("Error during generation.");
    }
  };

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Generate Resume</h2>
      <div className="space-y-4">
        <select
          className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          value={jobId ?? ""}
          onChange={(e) => setJobId(e.target.value)}
        >
          <option value="">Select Job Description</option>
          {jobOptions.map((job) => (
            <option key={job.jobId} value={job.jobId}>
              {job.text.slice(0, 60)}...
            </option>
          ))}
        </select>

        <button
          onClick={handleGenerate}
          disabled={!jobId}
          className="px-5 py-2 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          Generate Resume
        </button>

        <p className="text-sm text-gray-600 dark:text-gray-400">{status}</p>

        <button onClick={reset} className="text-sm text-blue-500 hover:underline mt-2">
          Start Over
        </button>
      </div>
    </div>
  );
}
