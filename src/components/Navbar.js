"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { IoClose, IoMenu } from "react-icons/io5";
import { FaIdCard, FaPlus } from "react-icons/fa";
import config from "@/lib/config";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const appName = config?.appName || "CardAI Creator";
  const logoLetter = appName.trim().charAt(0).toUpperCase();

  const navLinks = [
    { name: "Workspace", path: "/" },
    { name: "My Cards", path: "/my-cards" },
  ];

  // Hide navbar on public card view for a cleaner experience
  const isCardView = pathname?.startsWith("/card/");
  if (isCardView) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo and Brand Title */}
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-95">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-extrabold text-lg shadow-md shadow-violet-500/30">
            {logoLetter}
          </div>
          <span className="text-base sm:text-lg font-black tracking-tight text-gray-900 whitespace-nowrap">
            {appName}
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.path ||
              (link.path === "/" && pathname === "/");
            return (
              <Link
                key={link.name}
                href={link.path}
                className={`text-[13px] font-semibold transition-all relative py-1 ${
                  isActive
                    ? "text-violet-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {link.name}
                {isActive && (
                  <div className="absolute -bottom-[12px] left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/?new=1"
            className="flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition-all shadow-md shadow-violet-500/20"
          >
            <FaPlus className="text-[10px]" />
            <span>New Card</span>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/?new=1"
            className="flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-bold text-white"
          >
            <FaPlus className="text-[10px]" />
            <span>New</span>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hover:bg-gray-100 p-2 rounded-lg cursor-pointer transition-colors text-gray-700 border border-gray-200"
            aria-label="Toggle Menu"
          >
            {isOpen ? <IoClose size={20} /> : <IoMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-[200] bg-white border-b border-gray-200 shadow-xl py-4 px-6 md:hidden animate-fade-in">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-violet-50 text-violet-700 border border-violet-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FaIdCard className="mr-2 text-xs" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}