import CalltoAction from "@/components/CalltoAction";
import Feature from "@/components/Feature";
import Home from "@/components/Home";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Index() {
  return (
    <div>
      <section id="home">
        <Home />
      </section>
      <section id="feature">
        <Feature />
      </section>
      <section id="calltoaction">
        <CalltoAction />
      </section>

    </div>
  );
}

