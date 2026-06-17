"use client";

import { Button } from "@components/shadcn/button";
import { Link } from "@tanstack/react-router";
import { GithubIcon, Menu, X } from "lucide-react";
import { FC } from "react";
import { useState } from "react";
import { LogoWithText } from "./LogoWithText";

interface NavbarProps {
  dark?: boolean;
}

export const Navbar: FC<NavbarProps> = ({ dark = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="container mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        <Link to="/">
          <LogoWithText dark={dark} />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="https://github.com/Review-Corral/review-corral"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className={
                dark
                  ? "text-stone-300 border-stone-600 bg-transparent hover:bg-stone-800 hover:text-white gap-2"
                  : "text-black gap-2"
              }
            >
              <GithubIcon className="w-4 h-4" />
              Source Code
            </Button>
          </a>
          <Link to="/app">
            <Button
              className={
                dark
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "text-white"
              }
            >
              Get Started
            </Button>
          </Link>
        </div>

        {/* Hamburger Menu Button (mobile only) */}
        <button
          type="button"
          className={`md:hidden p-2 ${dark ? "text-white" : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div
            className={`px-2 pt-2 pb-3 space-y-3 shadow-lg rounded-lg mt-2 ${
              dark ? "bg-stone-900" : "bg-white"
            }`}
          >
            <a
              href="https://github.com/Review-Corral/review-corral"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                className={`w-full ${
                  dark
                    ? "text-stone-300 border-stone-600 bg-transparent hover:bg-stone-800 gap-2"
                    : "text-black gap-2"
                }`}
              >
                <GithubIcon className="w-4 h-4" />
                Source Code
              </Button>
            </a>
            <Link to="/app" className="block">
              <Button
                className={`w-full ${
                  dark
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "text-white"
                }`}
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
