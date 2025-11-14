import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useWeb3AuthAccount,
  useWeb3AuthConnect,
  useWeb3AuthUser,
} from "../providers/Web3AuthProvider";
import "./Auth.css";

function UserLogin() {
  const { connect, isConnected } = useWeb3AuthConnect();
  const { userInfo } = useWeb3AuthUser();
  const { address } = useWeb3AuthAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("authRole", "user");
    }
  }, []);

  useEffect(() => {
    if (isConnected && userInfo) {
      navigate("/user");
    }
  }, [isConnected, userInfo, navigate]);

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <p className="text-sm mb-4">
          Admin access?{" "}
          <Link to="/sign-in" className="text-blue-600 underline">
            Switch to admin login
          </Link>
        </p>

        {!isConnected ? (
          <button className="login-btn" onClick={() => connect()}>
            Login with Google (Web3Auth)
          </button>
        ) : (
          <div className="logged-in">
            <p>Connected as:</p>
            <p className="wallet-address">{address}</p>
            <p>Welcome, {userInfo?.name}</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default UserLogin;
