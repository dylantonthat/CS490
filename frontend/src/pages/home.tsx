import { withPageAuthRequired } from "@auth0/nextjs-auth0";

function Home() {
  return (
    <section className="flex items-center justify-center h-screen text-gray-800">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">In Progress</h1>
        <p className="text-lg text-gray-600">
          This page is under construction. Check back soon!
        </p>
      </div>
    </section>
  );
}

// This will redirect to login and then back to '/' route if user is not authenticated
export const getServerSideProps = withPageAuthRequired();

export default Home;


