import React, { useEffect } from "react";
import { SignIn } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";

function UserLogin() {
  const { ready, authenticated } = usePrivy();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("authRole", "user");
    }
  }, []);

  // Optional: show loading state while Privy is initializing
  if (!ready) return <div className="auth-layout">Connecting wallet...</div>;

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <p className="text-sm mb-4">
          Admin access?{" "}
          <Link to="/sign-in" className="text-blue-600 underline">
            Switch to admin login
          </Link>
        </p>

        <SignIn
          appearance={{
            layout: {
              socialButtonsPlacement: "bottom",
              logoPlacement: "outside",
            },
          }}
          routing="path"
          path="/user-sign-in"
          afterSignInUrl="/user" // ✅ this redirects after Clerk login
          afterSignUpUrl="/user"
        />
      </section>
    </div>
  );
}

export default UserLogin;
