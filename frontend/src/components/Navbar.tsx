import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initialTheme =
      stored === "light" || stored === "dark"
        ? stored
        : prefersDark
        ? "dark"
        : "light";

    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  return (
    <header className="bg-white dark:bg-gray-800 shadow text-gray-800 dark:text-white body-font">
      <div className="container mx-auto flex flex-wrap p-4 flex-col md:flex-row items-center justify-between">
        {/* Logo & App Name */}
        <div className="flex items-center space-x-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={36}
            height={36}
            className="rounded"
            priority
          />
          <span className="text-xl font-medium text-gray-900 dark:text-white">
            Resume Scanner
          </span>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-6 relative">
          {/* Click-based Dropdown */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-1 text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 transition"
            >
              <span>Dashboard</span>
              <svg
                className="w-3 h-3 mt-0.5 text-current"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.294l3.71-4.065a.75.75 0 111.08 1.04l-4.24 4.65a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 z-20 mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg w-40">
                <button
                  onClick={() => {
                    router.push("/home");
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    router.push("/education");
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Education
                </button>
                <button
                  onClick={() => {
                    router.push("/career");
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Career
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="px-4 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>

          {/* Auth */}
          {isLoading ? (
            <span>Loading...</span>
          ) : user ? (
            <>
              <span className="text-sm font-medium">{user.name}</span>
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name || "User Avatar"}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              )}
              <button
                onClick={() =>
                  router.push("/api/auth/logout?returnTo=" + window.location.origin)
                }
                className="px-6 py-2 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-300 hover:text-white transition"
              >
                Log Out
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/api/auth/login?returnTo=/home")}
              className="px-6 py-2 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-300 hover:text-white transition"
            >
              Log In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
