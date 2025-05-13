import axios from "axios";
import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function TemplateSelector() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedResume, setSelectedResume] = useState<string>("");
  const { user } = useUser();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/templates`
        );
        setTemplates(res.data.templates || []);
      } catch (error) {
        console.error("Failed to fetch templates", error);
      }
    };

    const fetchResumes = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/generated`,
          {
            headers: { Email: user?.email || "" },
          }
        );
        setResumes(res.data.resumes || []);
      } catch (error) {
        console.error("Failed to fetch resumes:", error);
      }
    };

    fetchTemplates();
    if (user?.email) {
      fetchResumes();
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!selectedTemplate || !selectedResume) return;
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/format`,
        {
          resumeId: selectedResume,
          formatType: "pdf",
          templateId: selectedTemplate,
        },
        {
          headers: {
            Email: user?.email || "",
          },
        }
      );
      alert("Resume formatting complete!");
      console.log("Formatted Resume ID:", res.data.formattedResumeId);
    } catch (err) {
      console.error("Formatting failed", err);
      alert("Error formatting resume");
    }
  };

  return (
    <div className="w-full p-6 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Resume and Template</h2>

      <select
        value={selectedResume}
        onChange={(e) => setSelectedResume(e.target.value)}
        className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        <option value="">Select Resume</option>
        {resumes.map((r) => (
          <option key={r.resume_id} value={r.resume_id}>
            {r.resume_title || "Untitled Resume"}
          </option>
        ))}
      </select>

      <select
        value={selectedTemplate}
        onChange={(e) => setSelectedTemplate(e.target.value)}
        className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        <option value="">Default Template</option>
        {templates.map((t) => (
          <option key={t.templateId} value={t.templateId}>
            {t.name}
          </option>
        ))}
      </select>

      <button
        onClick={handleSubmit}
        disabled={!selectedResume || !selectedTemplate}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Generate Formatted Resume
      </button>
    </div>
  );
}
