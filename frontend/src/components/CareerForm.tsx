import axios from "axios";
import { useState } from "react";

export default function CareerForm() {
  const [entry, setEntry] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry.trim()) return;

    try {
      setStatus("Submitting...");
      await axios.post("/api/resumes/history", { raw: entry });
      setStatus("Entry saved");
      setEntry("");
    } catch {
      setStatus("Error saving entry");
    }
  };

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Freeform Career Entry
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          name="career"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Write anything about your job history, skills, role summaries..."
          rows={6}
          className="w-full p-4 text-sm border rounded-md resize-none text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
        />

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 hover:shadow transition-all"
          >
            Save Entry
          </button>
          {status && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{status}</p>
          )}
        </div>
      </form>
    </div>
  );
}
