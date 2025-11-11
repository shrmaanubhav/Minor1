import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Nav from "../components/Nav";
import CertificateCard from "../components/CertificateCard";
import { requestAccount } from "../SmartContract";
import { fetchCertificates } from "../store/certificate-slice";

const normalizeAddress = (address = "") => address.trim().toLowerCase();

const UserCertificates = () => {
    const dispatch = useDispatch();
    const [walletAddress, setWalletAddress] = useState(() => {
        if (typeof window === "undefined") return "";
        return window.localStorage.getItem("walletAddress") || "";
    });
    const {
        certificates,
        status: fetchStatus,
        error: fetchError,
    } = useSelector((state) => state.CertificateSlice);

    const [connectStatus, setConnectStatus] = useState({ loading: false, error: "" });

    const filteredCertificates = useMemo(() => {
        const normalized = normalizeAddress(walletAddress);
        if (!normalized) return [];

        return certificates.filter(
            (cert) =>
                normalizeAddress(cert?.metadata?.walletAddress) === normalized
        );
    }, [walletAddress, certificates]);

    const handleConnectWallet = async () => {
        setConnectStatus({ loading: true, error: "" });
        try {
            const account = await requestAccount();
            setWalletAddress(account);
            if (typeof window !== "undefined") {
                window.localStorage.setItem("walletAddress", account);
            }
        } catch (error) {
            setConnectStatus({
                loading: false,
                error:
                    error?.message ||
                    "Unable to connect to your wallet. Please try again.",
            });
            return;
        }
        setConnectStatus({ loading: false, error: "" });
    };

    const handleRefresh = () => {
        dispatch(fetchCertificates());
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setWalletAddress(value);
        if (typeof window !== "undefined") {
            window.localStorage.setItem("walletAddress", value);
        }
    };

    return (
        <div className='w-full min-h-screen bg-[#f7f7f7]'>
            <Nav cmp={"user-certificates"} />
            <div className='max-w-4xl mx-auto p-6'>
                <div className='bg-white shadow rounded-xl p-6'>
                    <div className='flex justify-between items-start'>
                        <div>
                            <h1 className='text-2xl font-semibold text-gray-800 mb-4'>
                                View Your Certificates
                            </h1>
                            <p className='text-sm text-gray-500 mb-6'>
                                Connect your wallet or paste the address linked to your
                                certificates.
                            </p>
                        </div>
                        <button
                            type='button'
                            onClick={handleRefresh}
                            className='px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                            disabled={fetchStatus === "loading"}>
                            {fetchStatus === "loading" ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                    <div className='flex flex-col md:flex-row gap-4'>
                        <input
                            type='text'
                            value={walletAddress}
                            onChange={handleInputChange}
                            placeholder='0x...'
                            className='flex-1 border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#2104ae]'
                        />
                        <button
                            type='button'
                            onClick={handleConnectWallet}
                            className='px-4 py-3 rounded-lg bg-[#2104ae] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                            disabled={connectStatus.loading}>
                            {connectStatus.loading ? "Connecting..." : "Connect Wallet"}
                        </button>
                    </div>
                    {connectStatus.error && (
                        <p className='text-red-600 text-sm mt-3'>
                            {connectStatus.error}
                        </p>
                    )}
                </div>
                <div className='mt-8'>
                    {fetchStatus === "loading" && (
                        <p className='text-center text-gray-600'>Loading certificates...</p>
                    )}
                    {fetchStatus === "failed" && (
                        <p className='text-center text-red-600'>
                            {fetchError || "Failed to load certificates."}
                        </p>
                    )}
                    {fetchStatus === "succeeded" &&
                        (walletAddress.trim() === "" ? (
                            <p className='text-center text-gray-600'>
                                Enter or connect a wallet address to view certificates.
                            </p>
                        ) : filteredCertificates.length === 0 ? (
                            <p className='text-center text-gray-600'>
                                No certificates were found for this wallet.
                            </p>
                        ) : (
                            <div className='flex flex-wrap gap-6 justify-center'>
                                {filteredCertificates.map((cert) => (
                                    <CertificateCard
                                        key={cert.id}
                                        certificateCID={cert.CertificateCID}
                                        metaData={cert.metadata}
                                    />
                                ))}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default UserCertificates;
