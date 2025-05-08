import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useEffect, useState } from "react";
import { useResume } from "../pages/home";

export default function AdvicePanel() {
  const { resumeId } = useResume();
  const [jobId, setJobId] = useState("");
  const [jobOptions, setJobOptions] = useState<any[]>([]);
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    const fetchJobs = async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/jobs/history`, {
        headers: { Email: user?.email! },
      });
      setJobOptions(res.data.jobs || []);
    };
    if (user) fetchJobs();
  }, [user]);

  const getAdvice = async () => {
    if (!resumeId || !jobId) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/jobs/advice`,
        { resumeId, jobId },
        { headers: { Email: user?.email! } }
      );
      setAdvice(res.data.advice);
    } catch {
      setAdvice("Failed to retrieve advice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Get Job-Seeking Advice</h2>
      <select
        value={jobId}
        onChange={(e) => setJobId(e.target.value)}
        className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        <option value="">Select Job</option>
        {jobOptions.map((job) => (
          <option key={job.jobId} value={job.jobId}>
            {job.text.slice(0, 60)}...
          </option>
        ))}
      </select>

      <button
        onClick={getAdvice}
        disabled={!resumeId || !jobId}
        className="px-5 py-2 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Get Advice
      </button>

      {loading ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading advice...</p>
      ) : advice ? (
        <div className="mt-2 text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded text-gray-900 dark:text-gray-100">
          {advice}
        </div>
      ) : null}
    </div>
  );
}
