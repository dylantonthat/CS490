function Register() {
  return (
    <section className="text-gray-600 body-font flex justify-center items-center min-h-screen">
      <div className="container px-5 py-24 mx-auto flex justify-center">
        <div className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col w-full max-w-md">
          <h2 className="text-gray-900 text-lg font-medium title-font mb-5 text-center">
            Sign Up
          </h2>
          <div className="relative mb-4">
            <label className="leading-7 text-sm text-gray-600">Full Name</label>
            <input
              type="text"
              id="full-name"
              name="full-name"
              className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
            />
          </div>
          <div className="relative mb-4">
            <label className="leading-7 text-sm text-gray-600">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
            />
          </div>
          <button className="text-white bg-blue-500 border-0 py-2 px-8 focus:outline-none hover:bg-blue-600 rounded text-lg">
            Sign Up
          </button>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Join now to get resume optimization insights instantly!
          </p>
        </div>
      </div>
    </section>
  );
}

export default Register;
