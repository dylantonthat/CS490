import axios from "axios";
import { useResume } from "../pages/home";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";

export default function FormatResumePanel({ templateId }: { templateId: string }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/templates`);
        setTemplates(res.data.templates || []);
      } catch {
        console.error("Failed to fetch templates");
      }
    };
    fetchTemplates();
  }, []);

  return (
    <div className="w-full p-6 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Resume Template Display</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {templates.map((t) => (
          <div key={t.templateId} className="border rounded p-3 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <img src={t.previewUrl} alt={t.name} className="w-full h-40 object-cover rounded mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">{t.name}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">{t.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
