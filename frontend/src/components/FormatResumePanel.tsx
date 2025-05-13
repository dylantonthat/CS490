import axios from "axios";
import { useState } from "react";
import { useResume } from "../pages/home";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function FormatResumePanel({ templateId }: { templateId: string }) {
  const { resumeId } = useResume();
  const { user } = useUser();
  const [status, setStatus] = useState("");
  const [downloadReady, setDownloadReady] = useState(false);

  const handleFormat = async () => {
    if (!resumeId || !user?.email) {
      setStatus("❌ Missing resume ID or user email.");
      console.log("Missing:", { resumeId, user });
      return;
    }

    try {
      setStatus("⚙️ Formatting resume...");
      setDownloadReady(false);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/format`,
        {
          resumeId,
          templateId,
          formatType: "pdf",
          styleId: null,
        },
        {
          headers: {
            Email: user.email,
          },
        }
      );

      console.log("🚀 Format API response:", res.data);
      const formattedId = res.data.formattedResumeId || res.data["formattedResumeId "] || null;

      if (!formattedId) {
        setStatus("❌ Error: No formattedResumeId returned.");
        return;
      }

      const downloadUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/download/${formattedId}`;
      console.log("📄 Constructed download URL:", downloadUrl);

      // Manual Axios PDF download
      const fileRes = await axios.get(downloadUrl, {
        headers: { Email: user.email },
        responseType: "blob",
      });

      console.log("✅ Downloaded PDF blob:", fileRes.data);

      const blob = new Blob([fileRes.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "resume.pdf";
      link.click();

      setStatus("✅ Resume formatted and download started.");
      setDownloadReady(true);
    } catch (err: any) {
      console.error("❌ Formatting failed:", err.response?.data || err.message);
      setStatus("❌ Formatting failed. Check console.");
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

      {status && <p className="text-sm text-gray-400 dark:text-gray-300 whitespace-pre-line">{status}</p>}
    </div>
  );
}
