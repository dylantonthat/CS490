import { useUser } from "@auth0/nextjs-auth0/client";
import { motion } from "framer-motion";


function Home() {
  const { user , isLoading } = useUser(); 

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-24 mb-36 mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col text-center w-full mb-20"
        >
          <h2 className="text-xs text-blue-500 tracking-widest font-medium title-font mb-1">
            Ying Wu Warriors Present
          </h2>
          { user ? (
              <h1 className="sm:text-3xl text-2xl font-medium title-font text-gray-900">
                WELCOME TO YOUR RESUME TOOL
              </h1>
            ) : (
              <h1 className="sm:text-3xl text-2xl font-medium title-font text-gray-900">
                AI-POWERED RESUME TOOL
              </h1>
            )
          }

        </motion.div>

        {/* Features Section - With Scroll Animation */}
        <div className="flex flex-wrap -m-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="p-4 md:w-1/3"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="h-full border-2 border-gray-200 border-opacity-60 rounded-lg overflow-hidden">
                {/* Feature Image */}
                <img
                  className="lg:h-48 md:h-36 w-full object-cover object-center"
                  src={feature.image}
                  alt={feature.subtitle}
                />
                <div className="p-6">
                  <h2 className="tracking-widest text-xs title-font font-medium text-gray-400 mb-1">
                    {feature.title}
                  </h2>
                  {/* Feature Subtitle */}
                  <h1 className="title-font text-lg font-medium text-gray-900 mb-3">
                    {feature.subtitle}
                  </h1>
                  {/* Feature Description */}
                  <p className="leading-relaxed mb-3">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Feature Data Array
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
