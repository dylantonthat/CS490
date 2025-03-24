import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/router";

export default function Navbar() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="text-gray-600 body-font">
      <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
        <button className="flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0">
          <span className="ml-3 text-xl">RESUME SCANNER</span>
        </button>

        {/* Navigation Buttons - text conditionally shown */}
        <nav className="md:ml-auto md:mr-auto flex flex-wrap items-center text-base justify-center">
          <button
            onClick={() => scrollToSection("home")}
            className="mr-5 hover:text-gray-900"
          >
            {!user ? "Home" : ""}
          </button>
          <button
            onClick={() => scrollToSection("feature")}
            className="mr-5 hover:text-gray-900"
          >
            {!user ? "Features" : ""}
          </button>
        </nav>

        <div className="flex space-x-4">
          {isLoading ? (
            <span>Loading...</span>
          ) : user ? (
            <button
              onClick={() =>
                router.push("/api/auth/logout?returnTo=" + window.location.origin)
              }
              className="px-6 py-2 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-300 hover:text-white transition"
            >
              Log Out
            </button>
          ) : (
            <button
              onClick={() => router.push("/api/auth/login?returnTo=/home")}
              className="px-6 py-2 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-300 hover:text-white transition"
            >
              Log In/Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
