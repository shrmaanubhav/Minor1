import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useWeb3AuthAccount } from "../providers/Web3AuthProvider";
import Nav from "../components/Nav";
import CertificateCard from "../components/CertificateCard";
import { fetchCertificates } from "../store/certificate-slice";

const normalizeAddress = (address = "") => address.trim().toLowerCase();

const UserCertificates = () => {
  const dispatch = useDispatch();
  const { address, isConnecting } = useWeb3AuthAccount();
  const {
    certificates,
    status: fetchStatus,
    error: fetchError,
  } = useSelector((state) => state.CertificateSlice);
  const [copiedTokenId, setCopiedTokenId] = useState(null);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    if (fetchStatus === "idle") {
      dispatch(fetchCertificates());
    }
  }, [dispatch, fetchStatus]);

  const normalizedAddress = normalizeAddress(address);

  const filteredCertificates = useMemo(() => {
    if (!normalizedAddress) return [];
    return certificates.filter(
      (cert) => normalizeAddress(cert?.metadata?.walletAddress) === normalizedAddress
    );
  }, [normalizedAddress, certificates]);

  const shortAddress = useMemo(() => {
    if (!address) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  const handleRefresh = () => dispatch(fetchCertificates());
  const getShareLink = (tokenId) => {
    const base =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/verify/${tokenId}`;
  };

  const handleShareLink = async (tokenId) => {
    const link = getShareLink(tokenId);
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(link);
        setCopiedTokenId(tokenId);
        setCopyError("");
        setTimeout(() => setCopiedTokenId(null), 2000);
      } else {
        throw new Error("Clipboard unsupported");
      }
    } catch (err) {
      console.warn("Copy failed, showing fallback:", err);
      setCopyError(`Copy failed. Share manually: ${link}`);
    }
  };

  const renderCertificates = () => {
    if (fetchStatus === "loading" || isConnecting) {
      return <p className="text-center text-muted-foreground">Syncing certificates...</p>;
    }

    if (fetchStatus === "failed") {
      return (
        <p className="text-center text-red-400">
          {fetchError || "Failed to load certificates."}
        </p>
      );
    }

    if (!address) {
      return (
        <p className="text-center text-muted-foreground">
          Login with Web3Auth to view and verify your certificates.
        </p>
      );
    }

    if (!filteredCertificates.length) {
      return (
        <p className="text-center text-muted-foreground">
          No certificates found for your connected wallet yet.
        </p>
      );
    }

    return (
      <div className="flex flex-wrap gap-6 justify-center">
        {filteredCertificates.map((cert) => (
          <div
            key={cert.id}
            className="flex flex-col gap-3 max-w-sm w-full bg-white/5 rounded-2xl p-3 border border-border/40"
          >
            <CertificateCard
              certificateCID={cert.CertificateCID}
              metaData={cert.metadata}
            />
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono truncate">
                  {getShareLink(cert.id)}
                </span>
                <button
                  type="button"
                  onClick={() => handleShareLink(cert.id)}
                  className="px-3 py-1 text-[11px] font-semibold rounded border border-accent text-accent hover:bg-accent/10"
                >
                  {copiedTokenId === cert.id ? "Copied" : "Copy link"}
                </button>
              </div>
              {copiedTokenId === cert.id && (
                <span className="text-green-500">Share URL copied!</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="home-theme w-full min-h-screen bg-background text-foreground overflow-hidden">
      <Nav cmp={"user-certificates"} />

      {/* Animated grid background pulled from home page */}
      <div className="fixed inset-0 -z-10 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            backgroundPosition: "0 0",
          }}
        />
      </div>

      <section className="relative w-full min-h-screen flex flex-col px-6 pt-16 pb-24">
        <div className="max-w-6xl mx-auto w-full space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 z-10">
              <div className="space-y-4">
                <p className="text-sm font-mono text-accent tracking-widest uppercase">
                  Verify Instantly
                </p>
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-balance">
                  Your on-chain identity is ready.
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  We automatically pull your Web3Auth wallet and verify every certificate
                  tied to it. No manual addresses, no copy-paste—just instant proof.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/60 bg-secondary/40 p-5">
                  <p className="text-sm text-muted-foreground mb-2">Active Wallet</p>
                  <p className="text-xl font-semibold text-accent">
                    {shortAddress || "Not connected"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-secondary/40 p-5 flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">Certificates Verified</p>
                  <p className="text-3xl font-bold">
                    {filteredCertificates.length.toString().padStart(2, "0")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="px-8 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={fetchStatus === "loading"}
                >
                  {fetchStatus === "loading" ? "Refreshing..." : "Re-Verify"}
                </button>
                <div className="px-8 py-3 border border-accent/40 text-accent rounded-lg text-sm flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">
                    Status
                  </span>
                  <span className="text-base font-semibold">
                    {address ? "Secure" : "Awaiting Login"}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative h-96 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="absolute w-72 h-72 border border-accent/30 rounded-full"
                  style={{ animation: "spin 20s linear infinite" }}
                />
                <div
                  className="absolute w-56 h-56 border border-accent/50 rounded-full"
                  style={{ animation: "spin 15s linear infinite reverse" }}
                />
                <div className="absolute w-36 h-36 bg-gradient-to-br from-accent/40 to-accent/10 rounded-xl border border-accent/80 flex flex-col items-center justify-center gap-1">
                  <div className="text-3xl font-mono font-bold text-accent">✓</div>
                  <p className="text-xs font-mono text-muted-foreground tracking-[0.4em] uppercase">
                    Verified
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {shortAddress || "0x0000..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm p-8">
            <div className="flex flex-col gap-2 text-center mb-10">
              <p className="text-sm font-mono text-accent tracking-[0.5em] uppercase">
                Certificates
              </p>
              <h2 className="text-3xl font-semibold">All proofs linked to your wallet</h2>
              <p className="text-muted-foreground">
                Every credential minted for your address shows up here the moment it hits the chain.
              </p>
            </div>
            {copyError && (
              <div className="mb-4 text-sm text-yellow-300 text-center">
                {copyError}
              </div>
            )}
            {renderCertificates()}
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default UserCertificates;
