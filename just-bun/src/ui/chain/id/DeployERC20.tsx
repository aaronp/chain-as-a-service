import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { deployERC20, erc20Template, prepareERC20Deploy } from "@/ui/wallet/web3";
import AccountSelect from "@/ui/account/AccountSelect";
import { Account } from "@/ui/wallet/accounts";
import { isErrorResponse } from "@/api/error";
import { StoredContract } from "@/api/contracts";
import { Button } from "@/ui/components/ui/button";
import { useAccount } from "@/ui/account/AccountContext";

// const api = edenTreaty('/api');

export default function DeployERC20() {
    const { id } = useParams(); // chain id
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [account, setAccount] = useState<Account | null>(null);
    const [symbol, setSymbol] = useState("");
    const [initialSupply, setInitialSupply] = useState(1000);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deployResult, setDeployResult] = useState<any>(null);
    const { currentAccount } = useAccount();

    const canDeploy = !loading && name.trim() && symbol.trim() && currentAccount;

    async function onDeployERC20() {
        if (!currentAccount) {
            setError("No account selected");
            return;
        }
        setLoading(true);
        setError(null);
        setDeployResult(null);

        try {

            const response = await deployERC20(currentAccount, id!, name, symbol, initialSupply);
            if (isErrorResponse(response)) {
                setError(response.error);
            }

            // const txReceipt = await txResponse.wait();
            // console.log("txReceipt", txReceipt);
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
        <div className="p-4 max-w-md mx-auto bg-card rounded-lg shadow-lg border border-border">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">Deploy ERC20 Token</h2>

            <label className="block mb-2 font-medium text-card-foreground" htmlFor="token-name">Token Name</label>
            <input
                id="token-name"
                className="w-full border border-input rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name"
                autoFocus
            />
            <label className="block mb-2 font-medium text-card-foreground" htmlFor="token-symbol">Symbol</label>
            <input
                id="token-symbol"
                className="w-full border border-input rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                placeholder="Symbol"
            />
            <label className="block mb-2 font-medium text-card-foreground" htmlFor="token-initial-supply">Initial Supply</label>
            <input
                id="token-initial-supply"
                type="number"
                min={0}
                max={255}
                className="w-full border border-input rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                value={initialSupply}
                onChange={e => setInitialSupply(Number(e.target.value))}
            />
            {error && <div className="text-destructive mb-2">{error}</div>}
            {deployResult && (
                <div className="text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/20 rounded-md p-2 mb-2 break-all">
                    <strong>Deployment Result:</strong>
                    <pre className="whitespace-pre-wrap text-xs mt-1">{JSON.stringify(deployResult, null, 2)}</pre>
                </div>
            )}
            <div className="flex justify-end gap-2 items-center">
                <button
                    className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </button>
                <div className="relative group">
                    <Button
                        variant="theme"
                        onClick={onDeployERC20}
                        disabled={!canDeploy}
                    >
                        {loading ? "Creating..." : "Create"}
                    </Button>
                    <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none border border-border">
                        <div><strong>canDeploy:</strong> {String(canDeploy)}</div>
                        <div><strong>loading:</strong> {String(loading)}</div>
                        <div><strong>name:</strong> {name || <span className='text-muted-foreground'>[empty]</span>}</div>
                        <div><strong>symbol:</strong> {symbol || <span className='text-muted-foreground'>[empty]</span>}</div>
                        <div><strong>account:</strong> {account ? (account.name || account.address || '[selected]') : <span className='text-muted-foreground'>[none]</span>}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
