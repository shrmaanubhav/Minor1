import contract from "./abi.json";
import { ethers } from "ethers";
const contractAddress = "0x23cB9cC6125DD5b83E5b8D94d7c45D0B123e0a0A";

const infuraProvider = new ethers.providers.JsonRpcProvider(
    "https://eth-sepolia.g.alchemy.com/v2/zEotRHIHt762GqCfnaj6tDD0ZH-GswVB"
);
const readOnlyContract = new ethers.Contract(
    contractAddress,
    contract.abi,
    infuraProvider
);

const hasInjectedWallet = () =>
    typeof window !== "undefined" && !!window.ethereum;

const getBrowserEthereum = () => {
    if (!hasInjectedWallet()) {
        throw new Error("No injected wallet found. Please install MetaMask.");
    }
    return window.ethereum;
};

const getWriteContract = async () => {
    const walletProvider = new ethers.providers.Web3Provider(getBrowserEthereum());
    const accounts = await walletProvider.listAccounts();
    if (!accounts.length) {
        await walletProvider.send("eth_requestAccounts", []);
    }
    return new ethers.Contract(
        contractAddress,
        contract.abi,
        walletProvider.getSigner()
    );
};

export const requestAccount = async () => {
    const ethereum = getBrowserEthereum();
    await ethereum.request({
        method: "wallet_requestPermissions",
        params: [
            {
                eth_accounts: {},
            },
        ],
    });

    const accounts = await ethereum.request({
        method: "eth_requestAccounts",
    });
    console.log(accounts);
    return accounts[0];
};

export const getCount = async () => {
    const res = await readOnlyContract.totalSupply();

    // console.log(res.toNumber());
    return res.toNumber();
};

export const getMetaData = async (tokenId) => {
    console.log("calling metadata");
    const res = await readOnlyContract.getMetaData(tokenId);

    // console.log(res);
    return res;
};

export const getOwnerOf = async (tokenId) => {
    const owner = await readOnlyContract.ownerOf(tokenId);
    return owner;
};

const ensureSepoliaNetwork = async () => {
  const ethereum = getBrowserEthereum();
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }], // Sepolia (11155111)
    });
  } catch (switchError) {
    // If Sepolia not added to MetaMask yet, add it
    if (switchError.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0xaa36a7",
            chainName: "Sepolia Test Network",
            rpcUrls: [
              "https://eth-sepolia.g.alchemy.com/v2/zEotRHIHt762GqCfnaj6tDD0ZH-GswVB",
            ],
            nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
    } else {
      console.error(switchError);
      throw switchError;
    }
  }
};




export const mintNFT = async (json, certificate, recipientAddress) => {
  try {
    await ensureSepoliaNetwork();

    if (!hasInjectedWallet()) {
      console.warn("⚠️ No MetaMask found.");
      return;
    }

    const contractInstance = await getWriteContract();
    if (!recipientAddress) {
      throw new Error("Recipient address is required to mint this certificate.");
    }
    const normalizedRecipient = ethers.utils.getAddress(recipientAddress);

    console.log("🚀 Minting NFT...");
    const tx = await contractInstance.mint(
      normalizedRecipient,
      `${json},${certificate}`
    );
    console.log("🧾 Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ NFT Mint confirmed!");

    // 🧩  Extract tokenId from the standard ERC-721 Transfer event
    const transferEvent = receipt.events?.find((e) => e.event === "Transfer");
    if (transferEvent) {
      const tokenId = transferEvent.args.tokenId.toString();
      console.log("🎟️ Minted Token ID:", tokenId);

      // Optionally check ownership
      const owner = await readOnlyContract.ownerOf(tokenId);
      console.log("Owner:", owner);
      return tokenId;
    } else {
      console.warn("⚠️ No Transfer event found. Couldn’t auto-detect token ID.");
    }
  } catch (err) {
    console.error("❌ Minting failed:", err);
    window?.alert?.(`Minting failed: ${err.message}`);
  }
};
