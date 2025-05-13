import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useEffect, useState } from "react";

export default function ApplicationHistory() {
  const [apps, setApps] = useState<any[]>([]);
  const [status, setStatus] = useState("loading");
  const { user } = useUser();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/job-applications`, {
          headers: { Email: user?.email || "" },
        });
        setApps(res.data.applications || []);
        setStatus("done");
      } catch {
        setStatus("error");
      }
    };
    if (user) fetchApplications();
  }, [user]);

  if (status === "loading") return <p className="text-sm">Loading application history...</p>;
  if (status === "error") return <p className="text-red-500 text-sm">Failed to load application history.</p>;
  if (apps.length === 0) return <p className="text-sm text-gray-600">No job applications submitted yet.</p>;

  return (
    <div className="w-full p-6 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Application History</h2>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
        {apps.map((app, idx) => (
          <li key={idx} className="py-2">
            <p><strong>Application ID:</strong> {app.applicationId}</p>
            <p><strong>Resume ID:</strong> {app.resumeId}</p>
            <p><strong>Job ID:</strong> {app.jobId}</p>
            <p><strong>Applied At:</strong> {new Date(app.appliedAt).toLocaleString()}</p>
            <p><strong>Job Text:</strong> {app.jobText}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
