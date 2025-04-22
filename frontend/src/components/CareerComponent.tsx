import { useUser } from '@auth0/nextjs-auth0/client';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface Job {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
  accomplishments?: string[];
}

export default function CareerComponent() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [formData, setFormData] = useState<Partial<Job>>({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    responsibilities: '',
    accomplishments: ['']
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    axios
      .get('http://localhost:5000/api/resumes/history', {
        headers: { Email: `${user.email}` }
      })
      .then((res) => setJobs(res.data.career || []))
      .catch((err) => console.error('Error fetching career data:', err));
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccomplishmentChange = (i: number, value: string) => {
    setFormData((prev) => {
      const updated = prev.accomplishments ? [...prev.accomplishments] : [];
      updated[i] = value;
      return { ...prev, accomplishments: updated };
    });
  };

  const handleAddAccomplishment = () => {
    setFormData((prev) => ({
      ...prev,
      accomplishments: [...(prev.accomplishments || []), '']
    }));
  };

  const handleEdit = (index: number) => {
    setFormData(jobs[index]);
    setEditingIndex(index);
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      responsibilities: '',
      accomplishments: ['']
    });
    setEditingIndex(null);
  };

  const handleSave = async () => {
    try {
      if (!user) return;

      if (editingIndex !== null) {
        await axios.put(`http://localhost:5000/api/resumes/history/${editingIndex}`, 
          formData,
          {headers: { Email: `${user.email}` } }
        );
        const updated = [...jobs];
        updated[editingIndex] = formData as Job;
        setJobs(updated);
        setMessage('Job updated successfully.');
      } else {
        const res = await axios.post(
          'http://localhost:5000/api/resumes/history',
          formData,
          { headers: { Email: `${user.email}` } }
        );
        setJobs((prev) => [...prev, res.data]);
        setMessage('Job added successfully.');
      }

      handleCancel();
    } catch {
      setMessage('Failed to save job.');
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRemove = async (index: number) => {
    if (!user) return;

    try {
      await axios.delete('http://localhost:5000/api/resumes/history', {
        data: { index },
        headers: { Email: `${user.email}` }
      });
      setJobs((prev) => prev.filter((_, i) => i !== index));
      setMessage('Entry removed.');
    } catch {
      setMessage('Failed to remove entry.');
    } finally {
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

      <div className="space-y-6 mb-12">
        {jobs.map((job, index) => (
          <div
            key={index}
            className="p-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2"
          >
            {editingIndex === index ? (
              <>
                <input
                  type="text"
                  name="title"
                  placeholder="Title"
                  value={formData.title || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                />
                <input
                  type="text"
                  name="company"
                  placeholder="Company"
                  value={formData.company || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="startDate"
                    placeholder="Start Date"
                    value={formData.startDate || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  />
                  <input
                    type="text"
                    name="endDate"
                    placeholder="End Date"
                    value={formData.endDate || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  />
                </div>
                <textarea
                  name="responsibilities"
                  placeholder="Responsibilities"
                  value={formData.responsibilities || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  rows={3}
                />
                <div className="space-y-1">
                  {formData.accomplishments?.map((accomplishment, i) => (
                    <input
                      key={i}
                      type="text"
                      placeholder={`Accomplishment ${i + 1}`}
                      value={accomplishment}
                      onChange={(e) =>
                        handleAccomplishmentChange(i, e.target.value)
                      }
                      className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    />
                  ))}
                  <button
                    onClick={handleAddAccomplishment}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    + Add Accomplishment
                  </button>
                </div>
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
                <div className="text-base font-semibold text-gray-800 dark:text-white">
                  {job.title}{' '}
                  <span className="text-gray-500">@ {job.company}</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {job.startDate} – {job.endDate}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {job.responsibilities}
                </div>
                {job.accomplishments && job.accomplishments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Accomplishments:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {job.accomplishments.map((acc, i) => (
                        <li key={i}>{acc}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEdit(index)}
                    className="px-4 py-1 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemove(index)}
                    className="px-4 py-1 text-sm rounded-full bg-red-600 text-white hover:bg-red-700 transition-all"
                  >
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add New Career Entry */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Add New Career Entry
        </h3>
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={editingIndex === null ? formData.title || '' : ''}
          onChange={handleInputChange}
          className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
        />
        <input
          type="text"
          name="company"
          placeholder="Company"
          value={editingIndex === null ? formData.company || '' : ''}
          onChange={handleInputChange}
          className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="startDate"
            placeholder="Start Date"
            value={editingIndex === null ? formData.startDate || '' : ''}
            onChange={handleInputChange}
            className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
          />
          <input
            type="text"
            name="endDate"
            placeholder="End Date"
            value={editingIndex === null ? formData.endDate || '' : ''}
            onChange={handleInputChange}
            className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
          />
        </div>
        <textarea
          name="responsibilities"
          placeholder="Responsibilities"
          rows={3}
          value={editingIndex === null ? formData.responsibilities || '' : ''}
          onChange={handleInputChange}
          className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
        />
        <div className="space-y-1">
          {editingIndex === null &&
            formData.accomplishments?.map((acc, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Accomplishment ${i + 1}`}
                value={acc}
                onChange={(e) => handleAccomplishmentChange(i, e.target.value)}
                className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              />
            ))}
          {editingIndex === null && (
            <button
              onClick={handleAddAccomplishment}
              className="text-sm text-blue-500 hover:underline"
            >
              + Add Accomplishment
            </button>
          )}
        </div>
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
  );
}
