import { useUser } from '@auth0/nextjs-auth0/client';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface FreeformEntry {
  history_id: string;
  text: string;
}

export default function FreeformComponent() {
  const { user } = useUser();
  const [entries, setEntries] = useState<FreeformEntry[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    axios
      .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/freeform`, {
        headers: { Email: user.email! },
      })
      .then((res) => setEntries(res.data))
      .catch((err) => console.error("Failed to load freeform entries:", err));
  }, [user]);

  const handleEdit = (index: number) => {
    setFormData(entries[index].text);
    setEditingIndex(index);
  };

  const handleCancel = () => {
    setFormData("");
    setEditingIndex(null);
  };

  const handleSave = async () => {
    if (editingIndex === null || !user) return;
    const history_id = entries[editingIndex].history_id;

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/freeform/${history_id}`,
        { text: formData },
        { headers: { Email: user.email! } }
      );
      const updated = [...entries];
      updated[editingIndex].text = formData;
      setEntries(updated);
      setMessage("Entry updated successfully.");
    } catch {
      setMessage("Failed to update entry.");
    } finally {
      handleCancel();
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Freeform Submissions
      </h2>

      {message && (
        <div className="mb-4 text-sm text-center text-blue-700 dark:text-blue-300">
          {message}
        </div>
      )}

      <div className="space-y-6">
        {entries.map((entry, index) => (
          <div
            key={entry.history_id}
            className="p-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
          >
            {editingIndex === index ? (
              <>
                <textarea
                  value={formData}
                  onChange={(e) => setFormData(e.target.value)}
                  className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  rows={6}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-1 text-sm rounded-full bg-green-600 text-white hover:bg-green-700 transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-1 text-sm rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {entry.text}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(index)}
                    className="px-4 py-1 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all"
                  >
                    Edit
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}