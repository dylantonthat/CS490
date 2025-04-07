import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (stored === "dark" || (!stored && prefersDark)) {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

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
          <span className="flex title-font font-medium items-center md:justify-start justify-center text-gray-900 dark:text-white">
            Resume Scanner
          </span>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="px-4 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>

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
