import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useEffect, useState } from "react";

export default function SkillsForm() {
  const { user, isLoading } = useUser();
  const [skills, setSkills] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!user) return;

    axios
      .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/skills`, {
        headers: { Email: user.email! },
      })
      .then((res) => {
        console.log("Skills response:", res.data);
        const data = res.data;
        const fetchedSkills = Array.isArray(data)
          ? data
          : Array.isArray(data.skills)
          ? data.skills
          : [];
        setSkills(fetchedSkills);
      })
      .catch((err) =>
        console.error("Error fetching skills data:", err)
      );
  }, [user]);

  const handleAdd = async () => {
    if (!user) return;
    const cleaned = input.trim().toLowerCase();
    if (!cleaned || skills.map((s) => s.toLowerCase()).includes(cleaned)) return;
    const newSkills = [...skills, input.trim()];
    setSkills(newSkills);
    setInput("");
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/skills`,
      { skills: newSkills },
      { headers: { Email: user.email! } }
    );
  };

  if (isLoading || !user) return null;

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Skills
      </h2>
      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, i) => (
          <span
            key={i}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}