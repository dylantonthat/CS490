import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useEffect, useState } from "react";

export default function JobDescriptionHistory({
  reload,
  onReloadComplete,
}: {
  reload: boolean;
  onReloadComplete: () => void;
}) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useUser();

  const fetchJobs = async () => {
    if (!user) return;

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/jobs/history`, {
        headers: { Email: user.email! }
      });
      const jobList = res.data.jobs || [];
      setJobs(jobList);
      setError(jobList.length === 0 ? "No job description history available." : "");
    } catch (err) {
      setError("No job description history available.");
    } finally {
      setLoading(false);
      onReloadComplete();
    }
  };

  // Load on first render
  useEffect(() => {
    if (user) fetchJobs();
  }, [user]);

  // Refresh when reload is triggered
  useEffect(() => {
    if (user && reload) fetchJobs();
  }, [user, reload]);

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Job Description History
      </h2>

      {loading ? (
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <ul className="space-y-4">
          {jobs.map((job) => (
            <li
              key={job.jobId}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800"
            >
              <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">
                <strong>Submitted:</strong>{" "}
                {new Date(job.submittedAt).toLocaleString()}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                {job.text.slice(0, 200)}...
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
