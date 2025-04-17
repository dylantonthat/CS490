import { motion } from "framer-motion";
import Image from "next/image";

function Feature() {
  return (
    <section className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white py-24">
      <div className="container mx-auto flex flex-wrap px-6">
        <motion.div
          className="lg:w-1/2 w-full flex justify-center mb-12 lg:mb-0"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src="/resume-photo.PNG"
            alt="Resume Scanning Process"
            width={460}
            height={500}
            className="rounded-xl shadow-md"
            priority
          />
        </motion.div>

        <div className="lg:w-1/2 w-full flex flex-col space-y-10 justify-center">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex items-start space-x-4"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
                {step.icon}
              </div>
              <div>
                <h4 className="text-lg font-semibold">{step.title}</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    title: "Upload Your Resume",
    description: "Easily upload your resume in seconds. We support PDF and DOCX formats.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "AI Scans & Processes",
    description: "Our AI analyzes key resume sections, ensuring it is ATS-friendly and well-structured.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "See Results & Improvements",
    description: "Get a detailed analysis of your resume with suggested improvements.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default Feature;
