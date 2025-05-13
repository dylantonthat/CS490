import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useEffect, useState } from "react";

interface TemplateSelectorProps {
  onSelect: (templateId: string) => void;
}

export default function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [fileType, setFileType] = useState("md");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedResume, setSelectedResume] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const { user, error, isLoading } = useUser();

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
    if (!selectedResume || !fileType) return;
    if (!!selectedTemplate && ["md", "txt", "html"].includes(fileType)) return;
    if (!selectedTemplate) setSelectedTemplate("");

    try {
      setStatus("Formatting...");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/format`,
        {
          resumeId: selectedResume,
          formatType: fileType,
          templateId: selectedTemplate,
        },
        {
          headers: {
            Email: user?.email || "",
          },
        }
      );
      setStatus("Formatting successful. Now Downloading.");
      const res2 = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/download/${res.data.formattedResumeId}`,
        {
          headers: {
            Email: user?.email || "",
          },
          responseType: 'blob',
        },
      );

      const href = URL.createObjectURL(res2.data);
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', `resume.${fileType}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      setStatus("Downloaded!");
    } catch (err) {
      setStatus("Formatting failed. Please try again.");
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
        onChange={(e) => {
          setSelectedTemplate(e.target.value);
          onSelect(e.target.value);
        }}
        className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        <option value="">Default Template</option>
        {templates.map((t) => (
          <option key={t.templateId} value={t.templateId}>
            {t.name}
          </option>
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
      </select>

      <button
        onClick={handleSubmit}
        disabled={!selectedResume || !fileType || (!!selectedTemplate && ["md", "txt", "html"].includes(fileType))}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Generate Formatted Resume
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

      {(
        !selectedResume ||
        !fileType ||
        (!!selectedTemplate && ["md", "txt", "html"].includes(fileType))
      ) && (
        <p className="mt-2 text-sm text-red-600">
          Please select a resume and file type. Template must be empty for plaintext formats (md, txt, html).
        </p>
      )}
    </div>
  );
}
