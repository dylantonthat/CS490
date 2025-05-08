import axios from "axios";
import { useEffect, useState } from "react";

export default function TemplateSelector({ onSelect }: { onSelect: (id: string) => void }) {
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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelected(val);
    onSelect(val);
  };

  return (
    <div className="w-full p-6 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a Resume Template</h2>
      <select
        value={selected}
        onChange={handleChange}
        className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        <option value="">Default Template</option>
        {templates.map((t) => (
          <option key={t.templateId} value={t.templateId}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
