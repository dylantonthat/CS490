import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useEffect, useState } from "react";

export default function ApplicationHistory({
  reload,
  onReloadComplete,
}: {
  reload: boolean;
  onReloadComplete: () => void;
}) {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useUser();

  const fetchApplications = async () => {
    if (!user) return;

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/job-applications`, {
        headers: { Email: user.email! }
      });
      const applicationList = res.data.applications || [];
      setApplications(applicationList);
      setError(applicationList.length === 0 ? "No application history available." : "");
    } catch (err) {
      setError("No application history available.");
    } finally {
      setLoading(false);
      onReloadComplete();
    }
  };

  // Load on first render
  useEffect(() => {
    if (user) fetchApplications();
  }, [user]);

  // Refresh when reload is triggered
  useEffect(() => {
    if (user && reload) fetchApplications();
  }, [user, reload]);

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Application History
      </h2>

      {loading ? (
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <ul className="space-y-4">
          {applications.map((application) => (
            <li
              key={application.applicationId}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800"
            >
              <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">
                <strong>Submitted:</strong>{" "}
                {new Date(application.appliedAt).toLocaleString()}
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                <strong>Resume:</strong> {application.resumeTitle.slice(0, 200)}
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                <strong>Job Description: </strong>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                {application.jobText.slice(0, 200)}...
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
