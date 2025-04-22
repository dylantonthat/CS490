import { useUser } from "@auth0/nextjs-auth0/client";
import { motion } from "framer-motion";

function Home() {
  const { user } = useUser();

  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-24 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <h2 className="text-xs text-blue-500 tracking-widest font-medium mb-2">
            Ying Wu Warriors Present
          </h2>
          <h1 className="text-3xl md:text-4xl font-bold">
            {user ? "WELCOME TO YOUR RESUME TOOL" : "AI-POWERED RESUME TOOL"}
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <img
                src={feature.image}
                alt={feature.subtitle}
                className="w-full h-40 object-cover"
              />
              <div className="p-6">
                <h4 className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
                  {feature.title}
                </h4>
                <h3 className="text-lg font-semibold mb-2">{feature.subtitle}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    title: "AI-Powered Analysis",
    subtitle: "Get Instant Feedback",
    description: "Receive AI-powered insights on your resume within seconds.",
    image: "/ai.png",
  },
  {
    title: "ATS Optimization",
    subtitle: "Pass Resume Screenings",
    description: "Ensure your resume is formatted to pass Applicant Tracking Systems.",
    image: "/ats.png",
  },
  {
    title: "Actionable Insights",
    subtitle: "Receive Personalized Suggestions",
    description: "Get job-specific resume recommendations to boost your chances.",
    image: "/suggestion.PNG",
  },
];

export default Home;
