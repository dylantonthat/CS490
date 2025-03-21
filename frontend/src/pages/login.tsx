import Image from "next/image";

function Login() {
  return (
    <section className="text-gray-600 body-font flex justify-center items-center min-h-screen">
      <div className="container px-5 py-24 mx-auto flex justify-center">
        <div className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col w-full max-w-md">
          <h2 className="text-gray-900 text-lg font-medium title-font mb-5 text-center">
            Log In
          </h2>

          {/* Email Input */}
          <div className="relative mb-4">
            <label className="leading-7 text-sm text-gray-600">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
            />
          </div>

          {/* Password Input */}
          <div className="relative mb-4">
            <label className="leading-7 text-sm text-gray-600">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
            />
          </div>

          {/* Login Button */}
          <button className="text-white bg-blue-500 border-0 py-2 px-8 focus:outline-none hover:bg-blue-600 rounded text-lg">
            Log In
          </button>

          {/* OR Separator */}
          <div className="flex items-center my-4">
            <hr className="flex-grow border-gray-300" />
            <span className="px-2 text-gray-500 text-sm">OR</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          {/* Sign in with Google Button */}
          <button className="flex items-center justify-center w-full bg-white border border-gray-300 py-2 px-4 rounded-lg shadow-md hover:bg-gray-200 transition">
            <Image
              src="/google.png"
              alt="Google Logo"
              width={20}
              height={20}
              className="mr-2"
            />
            <span className="text-gray-700 font-medium">Sign in with Google</span>
          </button>

          {/* Forgot Password */}
          <p className="text-xs text-gray-500 mt-3 text-center">
            Don't have an account? <a href="/register" className="text-blue-500 hover:underline">Register here</a>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Login;
