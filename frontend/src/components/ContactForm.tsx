import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useEffect, useState } from "react";

export default function ContactForm() {
  const { user, isLoading } = useUser();
  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
  });

  useEffect(() => {
    if (!user) return;
    axios
      .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/contact`, { headers: { Email: user.email! } })
      .then((res) => setContact(res.data))
      .catch(() => {});
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContact((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/resumes/contact:${user.email!}`, contact, {
      headers: { Email: user.email! },
    });
  };

  if (isLoading || !user) return null;

  return (
    <div className="w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Contact Information
      </h2>
      <div className="space-y-4">
        {(["name", "email", "phone", "location"] as const).map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={contact[field]}
            onChange={handleChange}
            className="w-full p-2 text-sm border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          />
        ))}
        <button
          onClick={handleSubmit}
          className="px-4 py-2 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all"
        >
          Save Contact Info
        </button>
      </div>
    </div>
  );
}