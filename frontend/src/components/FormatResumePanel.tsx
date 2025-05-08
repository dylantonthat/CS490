import axios from "axios";
import { useState } from "react";
import { useResume } from "../pages/home";

export default function FormatResumePanel({ templateId }: { templateId: string }) {
  const { resumeId } = useResume();
  const [status, setStatus] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const handleFormat = async () => {
    if (!resumeId) return setStatus("Missing resume ID.");
    try {
      setStatus("Formatting...");
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/format`, {
        resumeId,
        templateId: templateId || undefined,
      });
      setDownloadUrl(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/download/${res.data.formattedResumeId}`);
      setStatus("Formatting complete.");
    } catch {
      setStatus("Formatting failed.");
    }
  };

  return (
    <div className="w-full p-6 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Download Formatted Resume</h2>
      <button
        onClick={handleFormat}
        disabled={!resumeId}
        className="px-5 py-2 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Format Resume
      </button>
      {status && <p className="text-sm text-gray-600 dark:text-gray-400">{status}</p>}
      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className="inline-block mt-2 text-blue-600 hover:underline text-sm"
        >
          Click here to download
        </a>
      )}
    </div>
  );
}
