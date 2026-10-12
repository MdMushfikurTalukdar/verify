import React from "react";

const defaultContact = {
  helpline: "+000 000 000 000",
  pabx: "+00 000 000 000",
  fax: "000-0-0000000",
  email: "info@example.com",
  address: "Your Office Address, City, Country",
};

export default function Footer({ contact = defaultContact }) {
  const c = { ...defaultContact, ...contact };

  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-600 py-6 px-4 md:px-12 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {/* Left column */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-phone text-emerald-700 w-4 text-center"></i>
            <span><strong>Helpline:</strong> {c.helpline}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-tty text-emerald-700 w-4 text-center"></i>
            <span><strong>PABX Number:</strong> {c.pabx}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-fax text-emerald-700 w-4 text-center"></i>
            <span><strong>Fax:</strong> {c.fax}</span>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-2 md:text-left">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-envelope text-emerald-700 w-4 text-center"></i>
            <span>
              <strong>Mail:</strong>{" "}
              <a href={`mailto:${c.email}`} className="hover:underline text-slate-700">
                {c.email}
              </a>
            </span>
          </div>
          <div className="flex items-start gap-2">
            <i className="fa-solid fa-location-dot text-emerald-700 w-4 text-center mt-0.5"></i>
            <span><strong>Address:</strong> {c.address}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}