import React, { useEffect, useRef, useState } from "react";
import { Route, Routes, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import Home from "./views/Home";
import AdminLogin from "./views/AdminLogin";
import Issue from "./views/Issue";
import Retrieve from "./views/Retrieve";
import CertificateTemplate from "./views/CertificateTemplate";
import Certificates from "./views/Certificates";
import UserLogin from "./views/UserLogin";
import UserCertificates from "./views/UserCertificates";
import VerifyCertificate from "./views/VerifyCertificate";

import { getCount, getMetaData, getOwnerOf } from "./SmartContract";
import axios from "axios";
import { certificateActions } from "./store/certificate-slice";

import {
  useWeb3AuthAccount,
  useWeb3AuthConnect,
  useWeb3AuthUser,
} from "./providers/Web3AuthProvider";

const backendBaseUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";


const HomeRedirect = () => {
  const navigate = useNavigate();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (redirected) return;
    const role =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("authRole")
        : null;

    console.log("🔁 Redirecting based on role:", role);

    if (role === "user") navigate("/user", { replace: true });
    else navigate("/admin", { replace: true });

    setRedirected(true);
  }, [navigate, redirected]);

  return null;
};

const ProtectedRoute = ({ allowedRole, redirectTo }) => {
  const navigate = useNavigate();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    const role =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("authRole")
        : null;

    if (hasNavigated) return;
    console.log(
      `🛡️ Checking access for role "${role}" (allowed: ${allowedRole})`
    );

    if (!role) {
      setHasNavigated(true);
      navigate(redirectTo, { replace: true });
      return;
    }

    if (role !== allowedRole) {
      setHasNavigated(true);
      navigate(role === "admin" ? "/admin" : "/user", { replace: true });
    }
  }, [allowedRole, redirectTo, navigate, hasNavigated]);

  return <Outlet />;
};

const App = () => {
  const dispatch = useDispatch();
  const { isConnected, status, connect } = useWeb3AuthConnect();
  const { userInfo } = useWeb3AuthUser();
  const { address } = useWeb3AuthAccount();
  const lastSyncedUser = useRef({ email: null, address: null });

  console.log(
    "⚙️ Rendering App | isConnected:",
    isConnected,
    "| address:",
    address
  );

  useEffect(() => {
    if (status === "ready" && !isConnected) {
      console.log("⚡ Web3Auth ready → opening login modal automatically");
      connect()
        .then(() => console.log("✅ User login successful"))
        .catch((err) => console.error("❌ Web3Auth auto-login failed:", err));
    }
  }, [status, isConnected, connect]);

  useEffect(() => {
    const email = userInfo?.email;
    if (!isConnected || !address || !email) return;

    if (
      lastSyncedUser.current.email === email &&
      lastSyncedUser.current.address === address
    ) {
      return;
    }

    let cancelled = false;
    const syncUser = async () => {
      try {
        const response = await fetch(`${backendBaseUrl}/addUser`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, address }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || "Failed to register user");
        }
        if (!cancelled) {
          lastSyncedUser.current = { email, address };
          console.log("🗃️ User synced to DB:", data?.message || "OK");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("❌ Unable to sync user to backend:", error);
        }
      }
    };

    syncUser();
    return () => {
      cancelled = true;
    };
  }, [isConnected, address, userInfo?.email]);

  useEffect(() => {
    const loadCertificates = async () => {
      console.log("🧩 Starting certificate load...");
      const startTime = performance.now();

      try {
        const count = await getCount();
        console.log("🧾 Total certificates found:", count);
        const organizations = new Set();

        const tokenIds = Array.from({ length: count }, (_, i) => i + 1);

        const fetchPromises = tokenIds.map(async (tokenId) => {
          console.log(`🔍 Fetching metadata for tokenId: ${tokenId}`);
          try {
            const result = await getMetaData(tokenId);
            const [jsonCID, CertificateCID] = result.split(",");
            if (!jsonCID) return null;

            const [response, ownerAddress] = await Promise.all([
              axios.get(`https://ipfs.io/ipfs/${jsonCID}`),
              getOwnerOf(tokenId),
            ]);

            const metadataWithOwner = {
              ...response.data,
              walletAddress: ownerAddress?.toLowerCase(),
            };

            return {
              tokenId,
              CertificateCID,
              metadataWithOwner,
              organization: metadataWithOwner.organization,
            };
          } catch (err) {
            console.error(
              `❌ Failed to fetch metadata for token ${tokenId}`,
              err
            );
            return null;
          }
        });

        const allCertificateData = await Promise.all(fetchPromises);

        allCertificateData.forEach((data) => {
          if (data) {
            dispatch(
              certificateActions.addCertificate({
                CertificateCID: data.CertificateCID,
                metadata: data.metadataWithOwner,
                id: data.tokenId,
              })
            );
            if (data.organization) {
              organizations.add(data.organization);
            }
            console.log(`✅ Token ${data.tokenId} processed`);
          }
        });

        dispatch(certificateActions.setOrganizations([...organizations]));
        console.log(
          `🏁 Certificate loading complete in ${Math.round(
            performance.now() - startTime
          )}ms`
        );
      } catch (error) {
        console.error("🚨 Unable to load certificates from chain", error);
      }
    };

    // --- THIS IS THE FIX ---
    // Only run the fetch logic AFTER Web3Auth is ready AND
    // the user has successfully connected their wallet.
    if (status === "ready" && isConnected) {
      console.log("✅ Connection active. Loading certificates...");
      loadCertificates();
    } else {
      console.log("🕒 Waiting for Web3Auth connection to load certificates...");
    }
  }, [dispatch, status, isConnected]);

  // if (status !== "ready") {
  //   console.log(" Waiting for Web3Auth session...");
  //   return <Loader />;
  // }

  // console.log("🚀 Web3Auth ready → rendering routes");

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      {/* --- Admin routes --- */}
      <Route
        path="/admin"
        element={<ProtectedRoute allowedRole="admin" redirectTo="/sign-in" />}
      >
        <Route index element={<Home />} />
        <Route path="issue-certificate" element={<Issue />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="retrieve-certificate" element={<Retrieve />} />
        <Route path="editCerti" element={<CertificateTemplate />} />
      </Route>

      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRole="user" redirectTo="/user-sign-in" />
        }
      >
        <Route index element={<UserCertificates />} />
      </Route>

      <Route
        path="/sign-in"
        element={
          isConnected ? <Navigate to="/admin" replace /> : <AdminLogin />
        }
      />
      <Route
        path="/user-sign-in"
        element={isConnected ? <Navigate to="/user" replace /> : <UserLogin />}
      />

      <Route path="/verify/:tokenId" element={<VerifyCertificate />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
