import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();


  // Simulate checking authentication
  // Need to replace with real auth logic
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track authentication state
  useEffect(() => {
    const user = localStorage.getItem("user");
    setIsAuthenticated(!!user); // Convert value to boolean
  }, []);



  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.removeItem("user"); // Clear user session (Replace with actual logout logic)
    setIsAuthenticated(false);
    router.push("/"); // Redirect to home after logout
  };

  return (
    <header className="text-gray-600 body-font">
      <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
        <button className="flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0">
          <span className="ml-3 text-xl">RESUME SCANNER</span>
        </button>

        <nav className="md:ml-auto md:mr-auto flex flex-wrap items-center text-base justify-center">
          <button onClick={() => scrollToSection("home")} className="mr-5 hover:text-gray-900">
            Home
          </button>
          <button onClick={() => scrollToSection("feature")} className="mr-5 hover:text-gray-900">
            Features
          </button>
        </nav>

        <div className="flex space-x-4">
          {isAuthenticated ? (
            // Show Log Out button when authenticated
            <button
              onClick={handleLogout}
              className="px-6 py-2 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-300 hover:text-white transition"
            >
              Log Out
            </button>
          ) : (
            // Show Log In & Register buttons when NOT authenticated
            <>
              <button
                onClick={() => router.push("/login")}
                className="px-6 py-2 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-300 hover:text-white transition"
              >
                Log In
              </button>
              <button
                onClick={() => router.push("/register")}
                className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
