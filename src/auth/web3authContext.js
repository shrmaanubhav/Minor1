import { WEB3AUTH_NETWORK } from "@web3auth/base";

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID;

const web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET, // works for devnet
    chainConfig: {
      chainNamespace: "eip155", // for Ethereum-compatible chains
      chainId: "0x1", // Ethereum Mainnet
      rpcTarget: "https://rpc.ankr.com/eth", // fallback RPC
      displayName: "Ethereum Mainnet",
      blockExplorer: "https://etherscan.io",
      ticker: "ETH",
      tickerName: "Ethereum",
    },
  },
};

export default web3AuthContextConfig;
