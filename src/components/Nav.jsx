import React, { useMemo, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  useWeb3AuthAccount,
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
} from "../providers/Web3AuthProvider";

const Nav = ({ cmp }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, connect } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { address } = useWeb3AuthAccount();

  const [role, setRole] = useState(() => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem("authRole");
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(window.sessionStorage.getItem("authRole"));
    }
  }, [location.pathname]);

  const isAdmin = role === "admin" || role === null;
  const logoutRedirect = isAdmin ? "/sign-in" : "/user-sign-in";

  const handleLogout = useCallback(async () => {
    try {
      await disconnect();
      window.sessionStorage.removeItem("authRole");
      navigate(logoutRedirect, { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, [disconnect, navigate, logoutRedirect]);

  const shortAddress = useMemo(() => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;
  }, [address]);

  const [initializing, setInitializing] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setInitializing(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (initializing) return null;

  return (
    <div className="flex justify-center h-12 items-center text-lg font-semibold gap-6 flex-wrap bg-white/5 border-b border-gray-700 transition-all">
      {isAdmin ? (
        <>
          <Link
            to="/admin"
            className={`mx-4 hover:text-[#2104ae] hover:cursor-pointer ${
              cmp === "home" ? "underline" : ""
            }`}
          >
            Home
          </Link>
          <Link
            to="/admin/issue-certificate"
            className={`mx-4 hover:text-[#2104ae] hover:cursor-pointer ${
              cmp === "issue" ? "underline" : ""
            }`}
          >
            Issue Certificate
          </Link>
          <Link
            to="/admin/certificates"
            className={`mx-4 hover:text-[#2104ae] hover:cursor-pointer ${
              cmp === "certificates" ? "underline" : ""
            }`}
          >
            Certificates
          </Link>
        </>
      ) : (
        <Link
          to="/user"
          className={`mx-4 hover:text-[#2104ae] hover:cursor-pointer ${
            cmp === "user-certificates" ? "underline" : ""
          }`}
        >
          My Certificates
        </Link>
      )}

      <div className="flex items-center gap-4 ml-6">
        {isConnected ? (
          <>
            {shortAddress && (
              <span className="text-sm text-gray-400">{shortAddress}</span>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-[#2104ae] border border-[#2104ae] rounded hover:bg-[#2104ae]/10"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={async () => {
              try {
                await connect();
              } catch (err) {
                console.error("Wallet connect error:", err);
              }
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#2104ae] rounded hover:bg-[#160176]"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
};

export default Nav;
