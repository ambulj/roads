import React from "react";

interface CivicCopilotLogoProps {
  className?: string;
  size?: number;
  variant?: "icon" | "mark" | "badge";
}

/**
 * Authentic Civic Copilot Insignia
 * 
 * Specifically designed to avoid generic "AI generator" tropes (no 4-pointed sparkles,
 * no cartoon robot heads, no pastel rainbow gradients).
 * 
 * Visual Architecture:
 * - Geometric municipal crest / shield silhouette representing public infrastructure stewardship.
 * - Converging roadway meridian lines (/ | \) symbolizing civil highway engineering and transit flow.
 * - Navigational civic beacon / apex compass node representing precise deterministic intelligence.
 * - Heavy, authoritative vector strokes matching Ministry of Road Transport & Highways and PWD heraldry.
 */
export const CivicCopilotLogo: React.FC<CivicCopilotLogoProps> = ({
  className = "w-5 h-5",
  size = 20,
  variant = "mark"
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer Geometric Civic Shield / Crest */}
      <path
        d="M12 2L4 5.5V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V5.5L12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.12"
      />

      {/* Converging Roadway Perspective - Left Shoulder */}
      <path
        d="M8.2 18L10.5 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Converging Roadway Perspective - Right Shoulder */}
      <path
        d="M15.8 18L13.5 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Dashed Center Meridian Line */}
      <path
        d="M12 17V15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 13V11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Horizon Horizon Transverse Line */}
      <path
        d="M9.5 10H14.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Navigational Apex Civic Node (Deterministic Guidance Beacon) */}
      <circle
        cx="12"
        cy="7"
        r="1.75"
        fill="currentColor"
      />
    </svg>
  );
};

export default CivicCopilotLogo;
