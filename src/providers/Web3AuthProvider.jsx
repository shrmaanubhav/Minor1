import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Web3Auth } from "@web3auth/modal";
import { ethers } from "ethers";

const Web3AuthReactContext = createContext(null);

const STATUS = {
  IDLE: "idle",
  INITIALIZING: "initializing",
  READY: "ready",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ERROR: "error",
};

export const Web3AuthProvider = ({ config, children }) => {
  const [web3Auth, setWeb3Auth] = useState(null);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [provider, setProvider] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const init = async () => {
      if (!config?.web3AuthOptions?.clientId) {
        console.error("Web3Auth clientId missing. Check environment variables.");
        return;
      }

      setStatus(STATUS.INITIALIZING);
      setError(null);

      try {
        const instance = new Web3Auth(config.web3AuthOptions);
        setWeb3Auth(instance);
        await instance.initModal();
        if (cancelled) return;

        if (instance.provider) {
          setProvider(instance.provider);
          const info = await instance.getUserInfo().catch(() => null);
          if (!cancelled) setUserInfo(info);
          setStatus(STATUS.CONNECTED);
        } else {
          setStatus(STATUS.READY);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Web3Auth initialization failed:", err);
        setError(err);
        setStatus(STATUS.ERROR);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [config]);

  useEffect(() => {
    if (!provider) {
      setAddress(null);
      return;
    }

    let cancelled = false;

    const syncAddress = async () => {
      try {
        const ethersProvider = new ethers.providers.Web3Provider(provider);
        const signer = ethersProvider.getSigner();
        const nextAddress = await signer.getAddress();
        if (!cancelled) setAddress(nextAddress);
      } catch (err) {
        if (!cancelled) console.error("Failed to read wallet address:", err);
      }
    };

    syncAddress();

    return () => {
      cancelled = true;
    };
  }, [provider]);

  useEffect(() => {
    if (!provider || !web3Auth) return;

    let cancelled = false;

    const syncUserInfo = async () => {
      try {
        const info = await web3Auth.getUserInfo();
        if (!cancelled) setUserInfo(info);
      } catch (err) {
        if (!cancelled) console.error("Failed to fetch user info:", err);
      }
    };

    syncUserInfo();

    return () => {
      cancelled = true;
    };
  }, [provider, web3Auth]);

  const connect = useCallback(async () => {
    if (!web3Auth) throw new Error("Web3Auth not ready yet");

    setStatus(STATUS.CONNECTING);
    setError(null);

    try {
      const nextProvider = await web3Auth.connect();
      setProvider(nextProvider);
      const info = await web3Auth.getUserInfo().catch(() => null);
      setUserInfo(info);
      setStatus(STATUS.CONNECTED);
      return nextProvider;
    } catch (err) {
      console.error("Web3Auth connect failed:", err);
      setError(err);
      setStatus(STATUS.ERROR);
      throw err;
    }
  }, [web3Auth]);

  const disconnect = useCallback(async () => {
    if (!web3Auth) return;
    try {
      await web3Auth.logout();
    } catch (err) {
      console.error("Web3Auth logout failed:", err);
    } finally {
      setProvider(null);
      setUserInfo(null);
      setAddress(null);
      setStatus(STATUS.READY);
    }
  }, [web3Auth]);

  const contextValue = useMemo(
    () => ({
      web3Auth,
      status,
      provider,
      address,
      userInfo,
      error,
      isConnected: Boolean(provider),
      isConnecting: status === STATUS.CONNECTING || status === STATUS.INITIALIZING,
      connect,
      disconnect,
    }),
    [address, connect, disconnect, error, provider, status, userInfo, web3Auth]
  );

  return (
    <Web3AuthReactContext.Provider value={contextValue}>
      {children}
    </Web3AuthReactContext.Provider>
  );
};

const useWeb3AuthContext = () => {
  const ctx = useContext(Web3AuthReactContext);
  if (!ctx) {
    throw new Error("useWeb3Auth* hooks must be used within Web3AuthProvider");
  }
  return ctx;
};

export const useWeb3Auth = () => {
  const { web3Auth, status, provider, error } = useWeb3AuthContext();
  return { web3Auth, status, provider, error };
};

export const useWeb3AuthConnect = () => {
  const { connect, isConnected, status, isConnecting } = useWeb3AuthContext();
  return { connect, isConnected, status, isConnecting };
};

export const useWeb3AuthDisconnect = () => {
  const { disconnect, isConnected } = useWeb3AuthContext();
  return { disconnect, isConnected };
};

export const useWeb3AuthUser = () => {
  const { userInfo } = useWeb3AuthContext();
  return { userInfo };
};

export const useWeb3AuthAccount = () => {
  const { address, isConnecting, isConnected, status } = useWeb3AuthContext();
  return { address, isConnecting, isConnected, status };
};

export const WagmiProvider = ({ children }) => children;
