"use client";

import Link from "next/link";
import { FC } from "react";
import { LogoWithText } from "./LogoWithText";
import { Button } from "@/components/shadcn/button";
import { GithubIcon, Menu, X } from "lucide-react";
import { useState } from "react";

export const Navbar: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="container mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        <Link href="/">
          <LogoWithText />
        </Link>

        {/* Desktop Menu (md and above) */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="https://github.com/Review-Corral/review-corral"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="text-black gap-2">
              <GithubIcon className="w-4 h-4" />
              Source Code
            </Button>
          </Link>
          <Link href="/app">
            <Button className="text-white">Get Started</Button>
          </Link>
        </div>

        {/* Hamburger Menu Button (mobile only) */}
        <button
          type="button"
          className="md:hidden p-2"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-3 bg-white shadow-lg rounded-lg mt-2">
            <Link
              href="https://github.com/Review-Corral/review-corral"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" className="text-black gap-2 w-full">
                <GithubIcon className="w-4 h-4" />
                Source Code
              </Button>
            </Link>
            <Link href="/app" className="block">
              <Button className="text-white w-full">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
