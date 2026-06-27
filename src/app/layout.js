import { Inter } from "next/font/google";
import "./globals.css";
import { Agentation } from "agentation";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata = {
  title: "Admission Compass Pakistan - Your University Admission Partner",
  description: "Admission Compass Pakistan helps intermediate students choose the best university and program using AI-powered recommendations. Calculate your admission chances and get personalized guidance.",
  keywords: "university admission, Pakistan universities, admission calculator, FSc, A-Levels, intermediate, merit calculator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Toaster position="top-right" richColors closeButton />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
