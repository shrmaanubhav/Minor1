import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useWeb3AuthAccount,
  useWeb3AuthConnect,
  useWeb3AuthUser,
} from "../providers/Web3AuthProvider";
import "./Auth.css";

function AdminLogin() {
  const { connect, isConnected } = useWeb3AuthConnect();
  const { userInfo } = useWeb3AuthUser();
  const { address } = useWeb3AuthAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("authRole", "admin");
    }
  }, []);

  useEffect(() => {
    if (isConnected && userInfo) {
      navigate("/admin");
    }
  }, [isConnected, userInfo, navigate]);

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <h1>Academic Credentials Store</h1>
        <p>Log in to continue</p>

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

        <p className="text-sm mt-4">
          Not an admin?{" "}
          <Link to="/user-sign-in" className="text-blue-600 underline">
            Switch to user login
          </Link>
        </p>
      </section>
    </div>
  );
}

export default AdminLogin;
