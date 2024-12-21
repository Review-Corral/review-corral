import Link from "next/link";
import { FC } from "react";
import { LogoWithText } from "./LogoWithText";
import { Button } from "@/components/shadcn/button";
import { GithubIcon } from "lucide-react";

export const Navbar: FC = () => {
  return (
    <nav className="container mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        <Link href="/">
          <LogoWithText />
        </Link>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="text-black gap-2">
            <GithubIcon className="w-4 h-4" />
            Source Code
          </Button>
          <Link href="/app">
            <Button className="text-white">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
