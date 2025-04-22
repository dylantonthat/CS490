import { motion } from "framer-motion";
import { useRouter } from "next/router";

function CalltoAction() {
  const router = useRouter();

  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Optimize Your Resume & Land More Interviews
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Upload your resume and let our AI analyze it for improvements. Get actionable insights to stand out and pass ATS screenings.
          </p>
        </motion.div>

        <motion.button
          onClick={() => router.push("/api/auth/login?returnTo=/home")}
          className="mt-10 px-6 py-3 text-lg font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          Get Started
        </motion.button>
      </div>
    </section>
  );
}

export default CalltoAction;
