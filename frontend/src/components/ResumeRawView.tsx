import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useEffect, useState } from "react";

export default function ResumeRawView() {
  const { user, isLoading } = useUser();
  const [resumes, setResumes] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!user) return;
    axios
      .get("/api/resumes/upload", { headers: { Email: user.email! } })
      .then((res) => setResumes(res.data.raw || []));
  }, [user]);

  if (isLoading || !user) return null;

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Parsed Resume Text
      </h2>
      {resumes.length > 1 && (
        <select
          className="mb-4 p-2 text-sm border rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
        >
          {resumes.map((_, i) => (
            <option key={i} value={i}>
              Resume {i + 1}
            </option>
          ))}
        </select>
      )}
      <pre className="text-sm whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 rounded-md overflow-x-auto">
        {resumes[selectedIndex]}
      </pre>
    </div>
  );
}
