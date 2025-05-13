import AdvicePanel from "@/components/AdvicePanel";
import ApplicationPanel from "@/components/ApplicationPanel";
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
import { useRouter } from "next/router";

import { withPageAuthRequired } from "@auth0/nextjs-auth0";

import { useUser } from "@auth0/nextjs-auth0/client";


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
  const [reloadApplications, setReloadApplications] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const router = useRouter();

  const { user } = useUser();
  const isVerified = user?.email_verified;

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


      {/* Modal that blocks everything if email not verified */}
      {isVerified === false && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: '#000',
            padding: '2rem',
            borderRadius: '10px',
            textAlign: 'center',
            maxWidth: '400px',
            color: 'red'
          }}>
            <h2>Email Not Verified</h2>
            <p>Please check your email and verify your account to access this app.</p>
            <button
              onClick={() => router.push("/api/auth/logout?returnTo=" + window.location.origin)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                fontSize: '1rem',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      )}

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
          <ApplicationPanel onApplicationSubmitted={() => setReloadApplications(true)} />
          <ApplicationHistory
            reload={reloadApplications}
            onReloadComplete={() => setReloadApplications(false)}
          />
          <AdvicePanel />
        </div>
      </div>
    </ResumeProvider>
  );
}

export const getServerSideProps = withPageAuthRequired();
export default HomePage;
