import CareerComponent from "@/components/CareerComponent";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

function CareerPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 md:px-16 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Your Career History
        </h1>
        <CareerComponent />
      </div>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
export default CareerPage;
