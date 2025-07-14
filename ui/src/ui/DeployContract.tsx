import React, { useState } from "react";

export default function DeployContract() {
    const [type, setType] = useState("ERC20");

    return (
        <div className="p-4 max-w-md mx-auto bg-white rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Deploy Contract</h2>
            <label className="block mb-2 font-medium" htmlFor="contract-type">
                Type
            </label>
            <select
                id="contract-type"
                className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={type}
                onChange={e => setType(e.target.value)}
            >
                <option value="ERC20">ERC20</option>
                <option value="ERC3643">ERC3643</option>
            </select>
        </div>
    );
}
