import axios from "axios";
import { useEffect, useState } from "react";
import { useResume } from "../pages/home"; // adjust path if needed

export default function ResumeStatus() {
  const { resumeId } = useResume();
  const [status, setStatus] = useState("processing");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!resumeId) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/status/${resumeId}`);
        setStatus(res.data.status);
        if (res.data.status !== "processing") clearInterval(interval);
        if (res.data.status === "failed") setError(res.data.error || "Unknown error.");
      } catch {
        setError("Error polling status.");
        clearInterval(interval);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [resumeId]);

  if (!resumeId) return null;

  return (
    <div className="w-full p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 mt-4">
      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Resume Status</h3>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {status === "processing" && "Processing your resume..."}
        {status === "completed" && "✅ Resume generation completed!"}
        {status === "failed" && `❌ Generation failed: ${error}`}
      </p>
    </div>
  );
}
