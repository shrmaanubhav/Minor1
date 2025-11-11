
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getCount, getMetaData, getOwnerOf } from "../SmartContract";
import axios from "axios";

export const fetchCertificates = createAsyncThunk(
    "certificates/fetchCertificates",
    async (_, { dispatch }) => {
        try {
            const count = await getCount();
            const organizations = new Set();
            const certificates = [];

            for (let tokenId = 1; tokenId <= count; tokenId++) {
                try {
                    const result = await getMetaData(tokenId);
                    const [jsonCID, CertificateCID] = result.split(",");
                    if (!jsonCID) continue;

                    const [response, ownerAddress] = await Promise.all([
                        axios.get(`https://ipfs.io/ipfs/${jsonCID}`),
                        getOwnerOf(tokenId),
                    ]);

                    const metadataWithOwner = {
                        ...response.data,
                        walletAddress: ownerAddress?.toLowerCase(),
                    };

                    certificates.push({
                        CertificateCID,
                        metadata: metadataWithOwner,
                        id: tokenId,
                    });

                    if (metadataWithOwner.organization) {
                        organizations.add(metadataWithOwner.organization);
                    }
                } catch (tokenError) {
                    console.error(
                        `Failed to fetch metadata for token ${tokenId}`,
                        tokenError
                    );
                }
            }

            dispatch(certificateActions.setOrganizations([...organizations]));
            return certificates;
        } catch (error) {
            console.error("Unable to load certificates from chain", error);
            throw error;
        }
    }
);

const CertificateSlice = createSlice({
    name: "CertificateSlice",
    initialState: {
        certificates: [],
        organizations: [],
        status: "idle",
        error: null,
    },
    reducers: {
        addCertificate(state, action) {
            state.certificates.push(action.payload);
        },
        setOrganizations(state, action) {
            state.organizations = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCertificates.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchCertificates.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.certificates = action.payload;
            })
            .addCase(fetchCertificates.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    },
});

export const certificateActions = CertificateSlice.actions;
export default CertificateSlice;
