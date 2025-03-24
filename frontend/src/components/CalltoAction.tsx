import { motion } from "framer-motion";
import { useRouter } from "next/router";

function CalltoAction() {
  const router = useRouter();

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-48 mx-auto">
        {/* Header with Fade-In Animation */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <h1 className="sm:text-3xl text-2xl font-medium text-center title-font text-gray-900 mb-4">
            Optimize Your Resume & Land More Interviews
          </h1>
          <p className="text-base leading-relaxed xl:w-2/4 lg:w-3/4 mx-auto">
            Upload your resume and let our AI analyze it for improvements. Get actionable insights to make your resume stand out to recruiters and pass ATS screenings effortlessly.
          </p>
        </motion.div>

        {/* Call to Action Button - Auth0 login with redirect */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          className="flex mx-auto mt-16 text-white bg-blue-500 border-0 py-3 px-8 focus:outline-none hover:bg-blue-600 rounded text-lg"
          onClick={() => router.push(`/api/auth/login?returnTo=/home`)}
        >
          Get Started
        </motion.button>
      </div>
    </section>
  );
}

export default CalltoAction;
