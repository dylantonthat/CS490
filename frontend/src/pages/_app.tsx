import Navbar from "@/components/Navbar";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import type { AppProps } from "next/app";
import Footer from "../components/Footer";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <Component {...pageProps} />
        <Footer />
      </div>
    </UserProvider>
  );
}
