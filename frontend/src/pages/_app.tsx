import type { AppProps } from "next/app";
import Footer from "../components/Footer";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Component {...pageProps} />
      <Footer />
    </div>
  );
}
