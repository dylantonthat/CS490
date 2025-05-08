import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useEffect, useState } from "react";

export default function Settings() {
  const { user, isLoading, error } = useUser();

  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [status, setStatus] = useState("");
  const [theme, setTheme] = useState("system");

  // Load contact info
  useEffect(() => {
    const fetchContact = async () => {
      if (!user) return;
      try {
        const res = await axios.get("/api/resumes/contact", {
          headers: { Email: user.email },
        });
        if (res.data.contact) {
          setContact(res.data.contact);
        }
      } catch {
        console.error("Failed to fetch contact info");
      }
    };
    fetchContact();
  }, [user]);

  // Save contact info
  const handleSaveContact = async () => {
    try {
      await axios.put("/api/resumes/contact", { contact }, {
        headers: { Email: user?.email },
      });
      setStatus("Saved successfully");
    } catch {
      setStatus("Failed to save");
    }
  };

  // Theme logic
  useEffect(() => {
    const localTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const applied = localTheme || (prefersDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", applied === "dark");
    setTheme(localTheme || "system");
  }, []);

  const handleThemeChange = (value: string) => {
    setTheme(value);
    localStorage.setItem("theme", value);
    if (value === "dark") {
      document.documentElement.classList.add("dark");
    } else if (value === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  };

  if (isLoading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">Error: {error.message}</p>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-4 md:px-16 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-6">Settings & Preferences</h1>

        {/* Contact Info */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 space-y-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold">Contact Information</h2>

          <div className="grid gap-4">
            <input
              type="text"
              placeholder="Full Name"
              className="p-3 rounded-md border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={contact.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              className="p-3 rounded-md border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
            />
            <input
              type="tel"
              placeholder="Phone"
              className="p-3 rounded-md border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            />
          </div>

          <button
            onClick={handleSaveContact}
            className="px-5 py-2 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700"
          >
            Save Contact Info
          </button>
          {status && <p className="text-sm text-gray-600 dark:text-gray-400">{status}</p>}
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 space-y-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold">Appearance</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1">Choose Theme</label>
            <select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="w-full p-2 rounded-md border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="system">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
