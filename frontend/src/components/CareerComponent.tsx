import { useUser } from '@auth0/nextjs-auth0/client';
import axios from "axios";
import { useEffect, useState } from "react";

interface Job {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
}

export default function CareerComponent() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [formData, setFormData] = useState<Partial<Job>>({
    title: "",
    company: "",
    startDate: "",
    endDate: "",
    responsibilities: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    axios.get("http://localhost:5000/api/resumes/history", {
      headers: { Email: `${user.email}` },
    })
      .then((res) => setJobs(res.data.jobs || []))
      .catch((err) => console.error("Error fetching job history:", err));
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData({
      title: "",
      company: "",
      startDate: "",
      endDate: "",
      responsibilities: "",
    });
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const res = await axios.post("http://localhost:5000/api/resumes/history", formData, {
        headers: { Email: `${user.email}` },
      });
      setJobs((prev) => [...prev, res.data]);
      setMessage("Career entry added successfully.");
      handleCancel();
    } catch {
      setMessage("Failed to add entry.");
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Career History</h2>

      {message && (
        <div className="mb-4 text-sm text-center text-blue-700 dark:text-blue-300">
          {message}
        </div>
      )}

      {/* Career entries */}
      {jobs.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No career history available.</p>
      ) : (
        <div className="space-y-6 mb-12">
          {jobs.map((job, index) => (
            <div
              key={index}
              className="p-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="text-base font-semibold text-gray-800 dark:text-white">
                {job.title} <span className="text-gray-500">@ {job.company}</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {job.startDate} – {job.endDate}
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {job.responsibilities}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new entry */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Add New Career Entry
        </h3>
        <div className="space-y-2">
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={formData.title || ""}
            onChange={handleChange}
            className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
          />
          <input
            type="text"
            name="company"
            placeholder="Company"
            value={formData.company || ""}
            onChange={handleChange}
            className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="startDate"
              placeholder="Start Date"
              value={formData.startDate || ""}
              onChange={handleChange}
              className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            />
            <input
              type="text"
              name="endDate"
              placeholder="End Date"
              value={formData.endDate || ""}
              onChange={handleChange}
              className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            />
          </div>
          <textarea
            name="responsibilities"
            placeholder="Responsibilities"
            rows={4}
            value={formData.responsibilities || ""}
            onChange={handleChange}
            className="w-full p-2 text-sm border rounded-md resize-none text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              className="px-4 py-1 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all"
            >
              Add
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-1 text-sm rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-all"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
