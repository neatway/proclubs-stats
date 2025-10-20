"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";

interface ClaimPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  personaId: string;
  clubId: string;
  clubName: string;
  platform: string;
  onClaimSuccess: () => void;
}

export default function ClaimPlayerModal({
  isOpen,
  onClose,
  playerName,
  personaId,
  clubId,
  clubName,
  platform,
  onClaimSuccess,
}: ClaimPlayerModalProps): React.JSX.Element | null {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClaim = async () => {
    if (!session?.user) {
      setError("You must be logged in to claim a player profile.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/player/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName,
          personaId,
          clubId,
          clubName,
          platform,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim player profile");
      }

      // Success!
      onClaimSuccess();
      onClose();
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the console username based on platform
  const getConsoleUsername = () => {
    if (platform === "common-gen5" || platform === "common-gen4") {
      // Try to match console usernames from session
      return session?.user?.psnUsername || session?.user?.xboxUsername || session?.user?.pcUsername || "No console account linked";
    }
    return "Unknown platform";
  };

  const consoleUsername = getConsoleUsername();
  const canClaim = consoleUsername.toLowerCase() === playerName.toLowerCase();

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          zIndex: 9998,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#1D1D1D",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "500px",
          width: "90%",
          zIndex: 9999,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#FFFFFF",
            marginBottom: "24px",
            fontFamily: "Work Sans, sans-serif",
            textAlign: "center",
          }}
        >
          Claim Player Profile
        </h2>

        {/* Content */}
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              background: "#2A2A2A",
              padding: "16px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#9CA3AF",
                marginBottom: "4px",
              }}
            >
              Player Name (from EA)
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#FFFFFF",
                fontFamily: "IBM Plex Mono, monospace",
              }}
            >
              {playerName}
            </div>
          </div>

          <div
            style={{
              background: "#2A2A2A",
              padding: "16px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#9CA3AF",
                marginBottom: "4px",
              }}
            >
              Your Console Username
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#FFFFFF",
                fontFamily: "IBM Plex Mono, monospace",
              }}
            >
              {consoleUsername}
            </div>
          </div>

          {/* Verification Status */}
          <div
            style={{
              background: canClaim
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(220, 38, 38, 0.1)",
              border: `1px solid ${canClaim ? "#10B981" : "#DC2626"}`,
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: canClaim ? "#10B981" : "#DC2626",
              }}
            >
              {canClaim ? (
                <>✓ Names Match - You can claim this profile!</>
              ) : (
                <>✗ Names Don't Match - Cannot claim this profile</>
              )}
            </div>
            {!canClaim && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#9CA3AF",
                  marginTop: "8px",
                }}
              >
                Your console username must match the player name to claim this
                profile.
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                background: "rgba(220, 38, 38, 0.1)",
                border: "1px solid #DC2626",
                borderRadius: "8px",
                padding: "12px",
                color: "#DC2626",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "2px solid rgba(255, 255, 255, 0.1)",
              background: "transparent",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "Work Sans, sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleClaim}
            disabled={!canClaim || isLoading}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              background: canClaim && !isLoading ? "#00D9FF" : "#6B7280",
              color: canClaim && !isLoading ? "#0A0A0A" : "#FFFFFF",
              fontSize: "14px",
              fontWeight: 600,
              cursor: canClaim && !isLoading ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              fontFamily: "Work Sans, sans-serif",
              opacity: canClaim && !isLoading ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (canClaim && !isLoading) {
                e.currentTarget.style.background = "#33E3FF";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (canClaim && !isLoading) {
                e.currentTarget.style.background = "#00D9FF";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {isLoading ? "Claiming..." : "Claim Profile"}
          </button>
        </div>
      </div>
    </>
  );
}
