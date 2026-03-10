"use client";

export default function ScanningOverlay({
  active,
  label = "AI判定中...",
}: {
  active: boolean;
  label?: string;
}) {
  if (!active) return null;

  return (
    <div className="scanOverlay" role="status" aria-live="polite">
      <div className="scanTint" />
      <div className="scanLine" />

      <div className="scanLabel">
        <div className="scanDot" />
        <span>{label}</span>
      </div>

      <style jsx>{`
        .scanOverlay {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          overflow: hidden;
          pointer-events: none;
          z-index: 30;
        }

        .scanTint {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at 50% 30%,
            rgba(0, 255, 255, 0.14),
            rgba(0, 0, 0, 0.35) 70%,
            rgba(0, 0, 0, 0.55) 100%
          );
          mix-blend-mode: screen;
          opacity: 0.9;
        }

        .scanLine {
          position: absolute;
          left: -10%;
          width: 120%;
          height: 60%;
          top: -40%;
          background-image: url("/scanline.png");
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          filter: drop-shadow(0 10px 25px rgba(0, 255, 255, 0.35));
          opacity: 0.95;
          animation: scanMove 1.25s linear infinite;
        }

        @keyframes scanMove {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(220%);
            opacity: 0;
          }
        }

        .scanLabel {
          position: absolute;
          left: 50%;
          top: 14px;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.55);
          border: 1px solid rgba(0, 255, 255, 0.25);
          color: rgba(255, 255, 255, 0.92);
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.2px;
          backdrop-filter: blur(8px);
          white-space: nowrap;
        }

        .scanDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(0, 255, 255, 0.9);
          box-shadow: 0 0 18px rgba(0, 255, 255, 0.9);
          animation: blink 0.8s ease-in-out infinite;
        }

        @keyframes blink {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
      `}</style>
    </div>
  );
}