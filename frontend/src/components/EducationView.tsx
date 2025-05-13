import { useUser } from '@auth0/nextjs-auth0/client';
import axios from "axios";
import { useEffect, useState } from "react";

interface Education {
  degree: string;
  institution: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

const isValidMonthYearFormat = (date: string) => {
  return /^(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/.test(date);
};

const parseMonthYear = (monthYear: string): Date => {
  const [month, year] = monthYear.split(" ");
  return new Date(`${month} 01, ${year}`);
};

export default function EducationView() {
  const [education, setEducation] = useState<Education[]>([]);
  const [formData, setFormData] = useState<Partial<Education>>({
    degree: "",
    institution: "",
    startDate: "",
    endDate: "",
    gpa: "",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/education`, {
      headers: { Email: `${user.email}` },
    })
      .then((res) => setEducation(res.data.education || []))
      .catch((err) => console.error("Error fetching education:", err));
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (index: number) => {
    setFormData(education[index]);
    setEditingIndex(index);
    setError(null);
  };

  const handleCancel = () => {
    setFormData({ degree: "", institution: "", startDate: "", endDate: "", gpa: "" });
    setEditingIndex(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!user) return;

    const { startDate, endDate } = formData;

    if (!startDate || !endDate) {
      setError("Start date and end date are required.");
      return;
    }

    if (!isValidMonthYearFormat(startDate) || !isValidMonthYearFormat(endDate)) {
      setError("Dates must be in 'Month YYYY' format.");
      return;
    }

    const start = parseMonthYear(startDate);
    const end = parseMonthYear(endDate);

    if (start > end) {
      setError("Start date must be before end date.");
      return;
    }

    try {
      if (editingIndex !== null) {
        const updated = [...education];
        updated[editingIndex] = formData as Education;
        await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/education/${editingIndex}`,
          formData,
          { headers: { Email: `${user.email}` } }
        );
        setEducation(updated);
        setMessage("Education updated successfully.");
      } else {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/education`,
          formData,
          { headers: { Email: `${user.email}` } }
        );
        setEducation((prev) => [...prev, res.data]);
        setMessage("Education added successfully.");
      }
      handleCancel();
    } catch {
      setMessage("Failed to save education.");
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRemove = async (index: number) => {
    if (!user) return;

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/education`, {
        data: { index },
        headers: { Email: `${user.email}` }
      });
      setEducation((prev) => prev.filter((_, i) => i !== index));
      setMessage("Entry removed.");
    } catch {
      setMessage("Failed to remove entry.");
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Education</h2>

      {message && (
        <div className="mb-4 text-sm text-center text-blue-700 dark:text-blue-300">
          {message}
        </div>
      )}
      
      <div className="space-y-6 mb-12">
        {education.map((edu, index) => (
          <div key={index} className="p-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2">
            {editingIndex === index ? (
              <>
                <input type="text" name="degree" placeholder="Degree" value={formData.degree || ""} onChange={handleInputChange} className="w-full p-2 text-sm border rounded-md dark:bg-gray-900 dark:text-white" />
                <input type="text" name="institution" placeholder="Institution" value={formData.institution || ""} onChange={handleInputChange} className="w-full p-2 text-sm border rounded-md dark:bg-gray-900 dark:text-white" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="startDate" placeholder="Start Date (Month YYYY)" value={formData.startDate || ""} onChange={handleInputChange} className="w-full p-2 text-sm border rounded-md dark:bg-gray-900 dark:text-white" />
                  <input type="text" name="endDate" placeholder="End Date (Month YYYY)" value={formData.endDate || ""} onChange={handleInputChange} className="w-full p-2 text-sm border rounded-md dark:bg-gray-900 dark:text-white" />
                </div>
                <input type="text" name="gpa" placeholder="GPA" value={formData.gpa || ""} onChange={handleInputChange} className="w-full p-2 text-sm border rounded-md dark:bg-gray-900 dark:text-white" />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="px-4 py-1 text-sm rounded-full bg-green-600 text-white hover:bg-green-700 transition-all">Save</button>
                  <button onClick={handleCancel} className="px-4 py-1 text-sm rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-all">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="text-base font-semibold text-gray-800 dark:text-white">{edu.degree} at {edu.institution}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{edu.startDate} – {edu.endDate}</div>
                {edu.gpa && <div className="text-sm text-gray-600 dark:text-gray-300">GPA: {edu.gpa}</div>}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleEdit(index)} className="px-4 py-1 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all">Edit</button>
                  <button onClick={() => handleRemove(index)} className="px-4 py-1 text-sm rounded-full bg-red-600 text-white hover:bg-red-700 transition-all">Remove</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add New Education Entry */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Add New Education Entry
        </h3>
        <input type="text" name="degree" placeholder="Degree" value={editingIndex === null ? formData.degree || "" : ""} onChange={handleInputChange} className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:text-white" />
        <input type="text" name="institution" placeholder="Institution" value={editingIndex === null ? formData.institution || "" : ""} onChange={handleInputChange} className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:text-white" />
        <div className="grid grid-cols-2 gap-4">
          <input type="text" name="startDate" placeholder="Start Date (Month YYYY)" value={editingIndex === null ? formData.startDate || "" : ""} onChange={handleInputChange} className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:text-white" />
          <input type="text" name="endDate" placeholder="End Date (Month YYYY)" value={editingIndex === null ? formData.endDate || "" : ""} onChange={handleInputChange} className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:text-white" />
        </div>
        <input type="text" name="gpa" placeholder="GPA (optional)" value={editingIndex === null ? formData.gpa || "" : ""} onChange={handleInputChange} className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:text-white" />

        {error && (
          <div className="mb-4 text-sm text-center text-red-600 dark:text-red-400">{error}</div>
        )}

        <div className="flex gap-2 mt-2">
          <button onClick={handleSave} className="px-4 py-1 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all">Add</button>
          <button onClick={handleCancel} className="px-4 py-1 text-sm rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-all">Clear</button>
        </div>
      </div>
    </div>
  );
}
