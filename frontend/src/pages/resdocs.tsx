import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ResumeMeta {
  resumeId: string;
  filename: string;
}

export default function DocumentsPage() {
  const { user, isLoading } = useUser();
  const [resumes, setResumes] = useState<ResumeMeta[]>([]);

  useEffect(() => {
    if (!user) return;

    axios
      .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/upload`, {
        headers: { Email: user.email! }
      })
      .then((res) => {
        setResumes(res.data.resumes || []);
      });
  }, [user]);

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-4 md:px-16 py-12">
      <h1 className="text-4xl font-bold mb-10 text-center">Uploaded Resume Files</h1>

      <div className="flex flex-col items-center space-y-16">
        {resumes.length === 0 && (
          <p className="text-gray-600 dark:text-gray-400 text-center">No uploaded resumes found.</p>
        )}

        {resumes.map((resume, index) => (
          <motion.div
            key={resume.resumeId}
            className="w-full max-w-4xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
          >
            <h2 className="text-xl font-semibold mb-2 text-center">{resume.filename}</h2>
            <iframe
              src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resumes/view/${resume.resumeId}`}
              width="100%"
              height="600px"
              className="rounded-xl border border-gray-300 dark:border-gray-700 shadow-lg"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}