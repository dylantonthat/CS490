import axios from "axios";
import { useState } from "react";

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setStatus("Uploading...");
      await axios.post("/api/resumes/upload", formData);
      setStatus("Upload successful");
    } catch (err) {
      setStatus("Upload failed. Please try again.");
    }
  };

  return (
    <div className="w-full h-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Upload Resume
      </h2>

      <div className="space-y-5">
        <label className="block w-full cursor-pointer">
          <div className="flex items-center justify-center h-40 px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <span className="text-gray-800 dark:text-gray-200 truncate max-w-full text-sm">
                {file.name}
              </span>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Click to select a PDF or DOCX resume
              </span>
            )}
          </div>
        </label>

        <div className="flex items-center gap-4">
          <button
            onClick={handleUpload}
            disabled={!file}
            className="px-5 py-2 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload
          </button>
          {status && (
            <p
              className={`text-sm ${
                status.includes("successful")
                  ? "text-green-600 dark:text-green-400"
                  : status.includes("failed")
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
