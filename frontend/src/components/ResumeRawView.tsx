import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useEffect, useState } from "react";
import { useResume } from "../pages/home";

export default function ResumeRawView() {
  const { user, isLoading } = useUser();
  const { resumeId } = useResume();

  const [resumeJson, setResumeJson] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!user || !resumeId) return;

    const fetchGeneratedResume = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/status/${resumeId}`,
          { headers: { Email: user.email! } }
        );
        if (res.data.status === "completed") {
          const doc = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/raw/${resumeId}`, {
            headers: { Email: user.email! }
          });
          setResumeJson(JSON.stringify(doc.data, null, 2));
        } else {
          setStatus("Resume is still being processed...");
        }
      } catch {
        setStatus("Error retrieving generated resume.");
      }
    };

    fetchGeneratedResume();
  }, [user, resumeId]);

  if (isLoading || !user || !resumeId) return null;

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        View Generated Resume
      </h2>

      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-300 mb-2">
        resume.json
      </h3>

      {status && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{status}</p>
      )}

      <pre className="text-sm whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 rounded-md overflow-x-auto">
        {resumeJson || "{}"}
      </pre>
    </div>
  );
}
