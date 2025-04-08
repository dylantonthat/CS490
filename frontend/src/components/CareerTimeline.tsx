import axios from "axios";
import { useEffect, useState } from "react";
import { useUser } from '@auth0/nextjs-auth0/client';

interface Job {
  id: number;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
}

export default function CareerTimeline() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Job>>({});
  const [message, setMessage] = useState<string | null>(null);

  const [status, setStatus] = useState<string>("");
  const { user, error, isLoading } = useUser()

  useEffect(() => {
    if (!user) return;
    const user_email = user.email;
    console.log(user_email);

    axios.get("http://localhost:5000/api/resumes/history", {
      headers: {
        Email: `${user_email}`,
      },
    })
    .then((res) => {
      setJobs(res.data.jobs || []);
    })
    .catch((err) => {
      console.error("Error fetching job history:", err);
    });
  }, [user]);

  const handleEditClick = (job: Job) => {
    setEditingJobId(job.id);
    setFormData(job);
  };

  const handleCancelClick = () => {
    setEditingJobId(null);
    setFormData({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = async () => {
    try {
      await axios.put(`http://localhost:5000/api/resumes/history/${editingJobId}`, formData);
      setJobs((prev) =>
        prev.map((job) => (job.id === editingJobId ? { ...job, ...formData } : job))
      );
      setMessage("Job updated successfully.");
    } catch {
      setMessage("Failed to update job.");
    } finally {
      setEditingJobId(null);
      setFormData({});
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Career History
      </h2>

      {message && (
        <div className="mb-4 text-sm text-center text-blue-700 dark:text-blue-300">
          {message}
        </div>
      )}

      {jobs.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No career history available.</p>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              {editingJobId === job.id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ""}
                    onChange={handleChange}
                    placeholder="Title"
                    className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  />
                  <input
                    type="text"
                    name="company"
                    value={formData.company || ""}
                    onChange={handleChange}
                    placeholder="Company"
                    className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="startDate"
                      value={formData.startDate || ""}
                      onChange={handleChange}
                      placeholder="Start Date"
                      className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    />
                    <input
                      type="text"
                      name="endDate"
                      value={formData.endDate || ""}
                      onChange={handleChange}
                      placeholder="End Date"
                      className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    />
                  </div>
                  <textarea
                    name="responsibilities"
                    value={formData.responsibilities || ""}
                    onChange={handleChange}
                    placeholder="Responsibilities"
                    rows={4}
                    className="w-full p-2 text-sm border rounded-md resize-none text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveClick}
                      className="px-4 py-1 text-sm rounded-full bg-green-600 text-white hover:bg-green-700 transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelClick}
                      className="px-4 py-1 text-sm rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-base font-semibold text-gray-800 dark:text-white">
                    {job.title} <span className="text-gray-500">@ {job.company}</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {job.startDate} – {job.endDate}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {job.responsibilities}
                  </div>
                  <button
                    onClick={() => handleEditClick(job)}
                    className="mt-2 px-4 py-1 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
