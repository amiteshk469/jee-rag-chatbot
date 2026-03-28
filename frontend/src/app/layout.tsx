import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JEE Physics Tutor — RAG Chatbot",
  description:
    "AI-powered JEE Physics tutor using Retrieval-Augmented Generation. Get grounded answers from Kinematics and Laws of Motion study material with cited sources.",
  keywords: [
    "JEE Physics",
    "RAG chatbot",
    "Kinematics",
    "Laws of Motion",
    "Physics tutor",
    "AI tutor",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
