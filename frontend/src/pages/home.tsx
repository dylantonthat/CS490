import AdvicePanel from "@/components/AdvicePanel";
import ApplicationHistory from "@/components/ApplicationHistory";
import CareerForm from "@/components/CareerForm";
import ContactForm from "@/components/ContactForm";
import FormatResumePanel from "@/components/FormatResumePanel";
import JobDescriptionHistory from "@/components/JobDescriptionHistory";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import ResumeRawView from "@/components/ResumeRawView";
import ResumeTrigger from "@/components/ResumeTrigger";
import ResumeUpload from "@/components/ResumeUpload";
import SkillsForm from "@/components/SkillsForm";
import TemplateSelector from "@/components/TemplateSelector";

import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { createContext, ReactNode, useContext, useState } from "react";

// Embedded ResumeContext
const ResumeContext = createContext<any>(null);
export const useResume = () => useContext(ResumeContext);

function ResumeProvider({ children }: { children: ReactNode }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>("101");
  const [resumeId, setResumeId] = useState<string | null>(null);

  const reset = () => {
    setJobId(null);
    setHistoryId("101");
    setResumeId(null);
  };

  return (
    <ResumeContext.Provider
      value={{ jobId, setJobId, historyId, setHistoryId, resumeId, setResumeId, reset }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

function HomePage() {
  const [reloadJobs, setReloadJobs] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  return (
    <ResumeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-4 md:px-16 py-10 space-y-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Welcome to Your <span className="text-blue-500">Resume Dashboard</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            Upload, organize, and optimize your career history and education seamlessly.
          </p>
        </div>

        {/* Resume Upload and Career Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          <ResumeUpload />
          <CareerForm />
        </div>

        {/* Contact and Skills moved up */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          <SkillsForm />
          <ContactForm />
        </div>

        {/* Job Description Features (3-column layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <JobDescriptionInput onJobSubmitted={() => setReloadJobs(true)} />
          <JobDescriptionHistory
            reload={reloadJobs}
            onReloadComplete={() => setReloadJobs(false)}
          />
          <ResumeTrigger />
        </div>

        {/* Parsed Resume Text */}
        <div className="max-w-7xl mx-auto space-y-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4">View Generated Resume Text</h2>
            <ResumeRawView />
          </div>
        </div>

        {/*Formatted Resume and Application History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          <TemplateSelector onSelect={setSelectedTemplateId} />
          <FormatResumePanel templateId={selectedTemplateId} />
          <AdvicePanel />
          <ApplicationHistory />
        </div>
      </div>
    </ResumeProvider>
  );
}

export const getServerSideProps = withPageAuthRequired();
export default HomePage;
