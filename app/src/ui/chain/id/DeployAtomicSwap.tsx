import React from 'react';

export default function DeployAtomicSwap() {
    return (
        <div className="p-4 max-w-md bg-card rounded-lg shadow-lg border border-border">
            <div className="mb-4">
                <label htmlFor="atomic-swap" className="block text-sm font-medium text-gray-700 mb-2">
                    Atomic Swap
                </label>
                <input
                    type="text"
                    id="atomic-swap"
                    name="atomic-swap"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter atomic swap details..."
                />
            </div>
        </div>
    );
}
