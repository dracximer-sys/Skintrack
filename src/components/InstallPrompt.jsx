import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Cek apakah sudah diinstall
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Tampilkan popup setelah 3 detik
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    handleClose();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowPrompt(false);
      setIsClosing(false);
    }, 400);
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(120%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(120%); opacity: 0; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }

        .ip-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 8, 20, 0.55);
          backdrop-filter: blur(4px);
          z-index: 9998;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .ip-card {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: min(420px, calc(100vw - 32px));
          background: linear-gradient(145deg, #1a1130 0%, #120d24 60%, #0d0a1e 100%);
          border: 1px solid rgba(167, 139, 250, 0.25);
          border-radius: 24px;
          padding: 24px;
          z-index: 9999;
          box-shadow:
            0 0 0 1px rgba(167,139,250,0.08),
            0 8px 32px rgba(0,0,0,0.6),
            0 0 80px rgba(167,139,250,0.08);
          animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .ip-card.closing {
          animation: slideDown 0.4s ease forwards;
        }

        .ip-close {
          position: absolute;
          top: 14px; right: 14px;
          background: rgba(255,255,255,0.07);
          border: none;
          color: rgba(255,255,255,0.5);
          width: 28px; height: 28px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .ip-close:hover {
          background: rgba(255,255,255,0.14);
          color: white;
        }

        .ip-icon-wrap {
          position: relative;
          width: 64px; height: 64px;
          margin-bottom: 16px;
        }
        .ip-icon-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid rgba(167,139,250,0.5);
          animation: pulse-ring 2s ease-out infinite;
        }
        .ip-icon {
          width: 64px; height: 64px;
          border-radius: 18px;
          background: linear-gradient(135deg, #a78bfa, #ec4899);
          display: flex; align-items: center; justify-content: center;
          font-size: 30px;
          box-shadow: 0 4px 20px rgba(167,139,250,0.4);
          animation: float 3s ease-in-out infinite;
        }

        .ip-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(167,139,250,0.12);
          border: 1px solid rgba(167,139,250,0.2);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 11px;
          color: #c4b5fd;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .ip-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          color: #fff;
          margin-bottom: 6px;
          line-height: 1.2;
        }

        .ip-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          color: rgba(255,255,255,0.55);
          line-height: 1.55;
          margin-bottom: 20px;
        }

        .ip-features {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .ip-feature-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 5px 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: rgba(255,255,255,0.65);
        }

        .ip-btn-install {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          letter-spacing: 0.3px;
          background: linear-gradient(90deg, #a78bfa 0%, #ec4899 50%, #a78bfa 100%);
          background-size: 200% auto;
          transition: background-position 0.5s ease, transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 20px rgba(167,139,250,0.35);
          margin-bottom: 10px;
        }
        .ip-btn-install:hover {
          background-position: right center;
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(167,139,250,0.5);
        }
        .ip-btn-install:active {
          transform: translateY(0);
        }

        .ip-btn-later {
          width: 100%;
          padding: 11px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: all 0.2s;
        }
        .ip-btn-later:hover {
          border-color: rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.65);
          background: rgba(255,255,255,0.04);
        }
      `}</style>

      {/* Backdrop */}
      <div className="ip-backdrop" onClick={handleClose} />

      {/* Card */}
      <div className={`ip-card ${isClosing ? "closing" : ""}`}>
        <button className="ip-close" onClick={handleClose}>✕</button>

        <div className="ip-icon-wrap">
          <div className="ip-icon-ring" />
          <div className="ip-icon">🌸</div>
        </div>

        <div className="ip-badge">
          <span>✦</span> App tersedia
        </div>

        <h2 className="ip-title">Install SkinTrack</h2>
        <p className="ip-desc">
          Simpan di layar utama HP-mu untuk akses cepat ke rutinitas skincare harianmu.
        </p>

        <div className="ip-features">
          <div className="ip-feature-chip">⚡ Akses cepat</div>
          <div className="ip-feature-chip">📴 Mode offline</div>
          <div className="ip-feature-chip">🔔 Pengingat</div>
        </div>

        <button className="ip-btn-install" onClick={handleInstall}>
          Pasang Sekarang
        </button>
        <button className="ip-btn-later" onClick={handleClose}>
          Nanti saja
        </button>
      </div>
    </>
  );
}
