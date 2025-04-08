import CareerForm from "@/components/CareerForm";
import ResumeUpload from "@/components/ResumeUpload";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-4 md:px-16 py-10 space-y-12">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Welcome to Your <span className="text-blue-500">Resume Dashboard</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          Upload, organize, and optimize your career history and education seamlessly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
        <ResumeUpload />
        <CareerForm />
      </div>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
export default Home;
