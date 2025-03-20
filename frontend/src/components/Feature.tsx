import { motion } from "framer-motion";
import Image from "next/image";

function Feature() {
  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-24 mx-auto flex flex-wrap">
        {/* Image Section with Fade-In Animation */}
        <motion.div
          className="lg:w-1/2 w-full mb-10 lg:mb-0 flex justify-center"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Image
            src="/resume-photo.PNG"
            alt="Resume Scanning Process"
            width={460}
            height={500}
            className="w-auto h-auto rounded-lg"
            priority
          />
        </motion.div>

        {/* Steps Section with Staggered Fade-In */}
        <div className="flex flex-col flex-wrap lg:py-6 -mb-10 lg:w-1/2 lg:pl-12 lg:text-left text-center">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex flex-col mb-10 lg:items-start items-center"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.2, ease: "easeOut" }}
            >
              <div className="w-12 h-12 inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-500 mb-5">
                {step.icon}
              </div>
              <div className="flex-grow">
                <h2 className="text-gray-900 text-lg title-font font-medium mb-3">
                  {step.title}
                </h2>
                <p className="leading-relaxed text-base">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Steps Data Array with Icons
const steps = [
  {
    title: "Upload Your Resume",
    description: "Easily upload your resume in seconds. We support PDF and DOCX formats.",
    icon: (
      <svg
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        className="w-6 h-6"
        viewBox="0 0 24 24"
      >
        <path d="M12 5v14M5 12h14"></path>
      </svg>
    ),
  },
  {
    title: "AI Scans & Processes",
    description:
      "Our AI analyzes key resume sections, ensuring it is ATS-friendly and well-structured.",
    icon: (
      <svg
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        className="w-6 h-6"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8v4l3 3"></path>
      </svg>
    ),
  },
  {
    title: "See Results & Improvements",
    description:
      "Get a detailed analysis of your resume with suggested improvements.",
    icon: (
      <svg
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        className="w-6 h-6"
        viewBox="0 0 24 24"
      >
        <path d="M5 12h14M12 5l7 7-7 7"></path>
      </svg>
    ),
  },
];

export default Feature;
