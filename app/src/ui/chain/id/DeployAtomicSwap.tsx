import React, { useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { deployAtomicSwap } from "@/ui/wallet/web3";
import { isErrorResponse } from "@/api/error";
import { StoredContract } from "@/api/contracts";
import { Button } from "@/ui/components/ui/button";
import { useAccount } from "@/ui/account/AccountContext";

export default function DeployAtomicSwap() {
    const { id } = useParams(); // chain id
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deployResult, setDeployResult] = useState<any>(null);
    const { currentAccount } = useAccount();

    const canDeploy = !loading && currentAccount;

    async function onDeployAtomicSwap() {
        if (!currentAccount) {
            setError("No account selected");
            return;
        }
        setLoading(true);
        setError(null);
        setDeployResult(null);

        try {
            const response = await deployAtomicSwap(currentAccount, id!);
            if (isErrorResponse(response)) {
                setError(response.error);
            }

            setDeployResult(response);
            navigate(`/chain/${id}/contract/${(response as StoredContract).contractAddress}`);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to deploy");
        } finally {
            setLoading(false);
        }
    }

    function onCancel() {
        navigate(`/chain/${id}`);
    }

    return (
        <div className="p-4 max-w-md bg-card rounded-lg shadow-lg border border-border">
            {error && (
                <div className="text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/20 rounded-md p-2 mb-2">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {deployResult && (
                <div className="text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/20 rounded-md p-2 mb-2 break-all">
                    <strong>Deployment Result:</strong>
                    <pre className="whitespace-pre-wrap text-xs mt-1">{JSON.stringify(deployResult, null, 2)}</pre>
                </div>
            )}

            <div className="flex justify-start gap-2 items-center">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <div className="relative group">
                    <Button
                        variant="theme"
                        onClick={onDeployAtomicSwap}
                        disabled={!canDeploy}
                    >
                        {loading ? "Creating..." : "Create"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
