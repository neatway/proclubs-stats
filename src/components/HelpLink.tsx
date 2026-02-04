"use client"

import Link from "next/link";

export default function HelpLink() {
  return (
    <div
      style={{
        textAlign: "center",
        marginBottom: "48px"
      }}
    >
      <Link
        href="/help"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "#9CA3AF",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
          padding: "8px 16px",
          borderRadius: "8px",
          border: "1px solid rgba(156, 163, 175, 0.3)",
          background: "rgba(255, 255, 255, 0.02)",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#C9A84C";
          e.currentTarget.style.borderColor = "#C9A84C";
          e.currentTarget.style.background = "rgba(201, 168, 76, 0.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#9CA3AF";
          e.currentTarget.style.borderColor = "rgba(156, 163, 175, 0.3)";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        How does this work?
      </Link>
    </div>
  );
}
