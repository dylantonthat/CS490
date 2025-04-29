import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useEffect, useState } from "react";
import { useResume } from "../pages/home";

export default function ResumeTrigger() {
  const { user } = useUser();
  const { jobId, setJobId, setResumeId, setHistoryId, reset } = useResume();

  const [jobOptions, setJobOptions] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/jobs/history`, {
          headers: { Email: user?.email! }
        });
        setJobOptions(res.data.jobs || []);
      } catch {
        setStatus("");
      }
    };
    fetchJobs();
  }, [user]);

  const handleGenerate = async () => {
    if (!jobId) return;
    try {
      setStatus("Generating...");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/generate`,
        { jobId },
        { headers: { Email: user?.email! } }
      );
      setResumeId(res.data.resumeId);
      setHistoryId(jobId);
      setStatus("Resume generated.");
    } catch {
      setStatus("Error during generation.");
    }
  };

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Generate Resume</h2>
      <div className="space-y-4">
        <select
          className="w-full p-2 text-sm italic border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          value={jobId ?? ""}
          onChange={(e) => setJobId(e.target.value)}
        >
          <option value="">Select Job Description</option>
          {jobOptions.map((job) => (
            <option key={job.jobId} value={job.jobId} className="italic text-sm">
              {job.text.slice(0, 60)}...
            </option>
          ))}
        </select>

        <button
          onClick={handleGenerate}
          disabled={!jobId}
          className="w-full px-5 py-2 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          Generate Resume
        </button>

        {status && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{status}</p>
        )}

        <button
          onClick={reset}
          className="w-full text-sm text-blue-500 hover:underline pt-1"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
