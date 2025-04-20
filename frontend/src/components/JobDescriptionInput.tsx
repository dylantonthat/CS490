import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useState } from "react";

export default function JobDescriptionInput() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!user) return;

    try {
      setStatus("Submitting...");
      const res = await axios.post("/api/jobs/submit", { text });
      setStatus(`Job description saved (ID: ${res.data.jobId})`);
      setText("");
    } catch (err) {
      setStatus("Submission failed.");
    }
  };

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Paste Job Description</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Paste the job description you're applying to..."
          className="w-full p-4 text-sm border rounded-md resize-none text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
        />
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all"
          >
            Submit
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-400">{status}</p>
        </div>
      </form>
    </div>
  );
}
