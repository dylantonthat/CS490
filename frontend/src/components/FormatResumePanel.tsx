import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useEffect, useState } from "react";
import { useResume } from "../pages/home";

export default function FormatResumePanel({ templateId }: { templateId: string }) {
  const { resumeId } = useResume();
  const { user } = useUser();

  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [resumes, setResumes] = useState<string[]>([]);
  const [fileType, setFileType] = useState("md");
  const [status, setStatus] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  useEffect(() => {
    if (resumeId) setResumes([resumeId]);
  }, [resumeId]);

  const handleFormat = async () => {
    if (!selectedResumeId || !fileType) return setStatus("Missing required fields.");
    try {
      setStatus("Formatting...");
      const body: { resumeId: string; formatType: string; templateId?: string } = { resumeId: selectedResumeId, formatType: fileType };
      if (templateId) body.templateId = templateId;

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/format`, body);
      setDownloadUrl(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/download/${res.data.formattedResumeId}`);
      setStatus("Formatting complete.");
    } catch {
      setStatus("Formatting failed.");
    }
  };

  return (
    <div className="w-full p-6 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Download Formatted Resume</h2>

      <select
        value={selectedResumeId}
        onChange={(e) => setSelectedResumeId(e.target.value)}
        className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        <option value="">Select Resume</option>
        {resumes.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <select
        value={fileType}
        onChange={(e) => setFileType(e.target.value)}
        className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        <option value="md">Markdown (.md)</option>
        <option value="txt">Text (.txt)</option>
        <option value="html">HTML (.html)</option>
        <option value="pdf">PDF (.pdf)</option>
        <option value="docx">DOCX (.docx)</option>
        {templateId && <option value="latex">LaTeX (.tex)</option>}
      </select>

      <button
        onClick={handleFormat}
        disabled={!selectedResumeId}
        className="px-5 py-2 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Format Resume
      </button>
      {status && <p className="text-sm text-gray-600 dark:text-gray-400">{status}</p>}
      {downloadUrl && (
        <a href={downloadUrl} download className="inline-block mt-2 text-blue-600 hover:underline text-sm">
          Click here to download
        </a>
      )}
    </div>
  );
}
