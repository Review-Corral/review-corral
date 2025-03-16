import Link from "next/link";
import { Navbar } from "./Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] flex flex-col">
      <Navbar />
      <div className="flex-grow flex flex-col">
        <main className="flex-grow">{children}</main>
        <footer className="text-xs md:text-sm container mx-auto px-4 py-8 text-center text-gray-600">
          <div className="flex justify-center items-center gap-4">
            <p>&copy; {new Date().getFullYear()} Review Corral. All rights reserved.</p>
            <p className="text-gray-300"> | </p>
            <p>
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
            </p>
            <p className="text-gray-300"> | </p>
            <p>
              <a href="mailto:alex.mclean25+rc@gmail.com" className="underline">
                Contact
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
