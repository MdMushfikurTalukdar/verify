import React from "react";

export default function Navbar({ title = "Your App Name", websiteUrl = "#" }) {
  return (
    <header className="bg-[#035938] text-white px-4 md:px-12 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left side title */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/10 rounded-lg hidden sm:block">
            <i className="fa-solid fa-file-circle-check text-xl text-emerald-300"></i>
          </div>
          <div className="border-l-0 sm:border-l sm:border-emerald-600 sm:pl-3">
            <span className="text-lg md:text-xl font-semibold tracking-wide">
              {title}
            </span>
          </div>
        </div>

        {/* Right side button */}
        <a
          href={websiteUrl}
          className="bg-emerald-800/60 hover:bg-emerald-800 text-white border border-emerald-500/40 px-5 py-1.5 rounded-full text-xs md:text-sm font-medium transition duration-200 shadow-sm flex items-center gap-2"
        >
          <span>Visit Website</span>
          <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
        </a>
      </div>
    </header>
  );
}