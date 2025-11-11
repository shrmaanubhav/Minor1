import React, { useEffect } from "react";
import {
    BrowserRouter,
    Route,
    Routes,
    Navigate,
    Outlet,
    useLocation,
} from "react-router-dom";
import { useDispatch } from "react-redux";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

import Home from "./views/Home";
import AdminLogin from "./views/AdminLogin";
import Issue from "./views/Issue";
import Retrieve from "./views/Retrieve";
import CertificateTemplate from "./views/CertificateTemplate";
import Certificates from "./views/Certificates";
import UserLogin from "./views/UserLogin";
import UserCertificates from "./views/UserCertificates";
import { fetchCertificates } from "./store/certificate-slice";

const getStoredRole = () =>
    typeof window !== "undefined" ? window.sessionStorage.getItem("authRole") : null;

const RedirectToDashboard = () => {
    const role = getStoredRole();
    const redirectPath = role === 'user' ? '/user' : '/admin';
    return <Navigate to={redirectPath} replace />;
};

const ProtectedRoute = ({ allowedRole, redirectTo }) => {
    const role = getStoredRole();
    const isAuthorized = role === allowedRole;

    return (
        <>
            <SignedIn>
                {isAuthorized ? <Outlet /> : <RedirectToDashboard />}
            </SignedIn>
            <SignedOut>
                <Navigate to={redirectTo} replace />
            </SignedOut>
        </>
    );
};

const AuthRoute = () => {
    const location = useLocation();

    return (
        <>
            <SignedOut>
                <AdminLogin />
            </SignedOut>
            <SignedIn>
                {location.pathname.includes('sso-callback') ? <Outlet /> : <RedirectToDashboard />}
            </SignedIn>
        </>
    );
};

const UserAuthRoute = () => {
    const location = useLocation();

    return (
        <>
            <SignedOut>
                <UserLogin />
            </SignedOut>
            <SignedIn>
                {location.pathname.includes('sso-callback') ? <Outlet /> : <RedirectToDashboard />}
            </SignedIn>
        </>
    );
};

const App = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchCertificates());
    }, [dispatch]);

    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/admin" replace />} />
                    <Route path="/sign-in" element={<AuthRoute />}>
                        <Route path="sso-callback" element={<Outlet />} />
                    </Route>
                    <Route path="/user-sign-in" element={<UserAuthRoute />} />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRole="admin" redirectTo="/sign-in" />
                        }>
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
                        }>
                        <Route index element={<UserCertificates />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    );
};

export default App;
