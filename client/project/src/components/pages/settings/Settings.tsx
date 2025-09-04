import React, { useState, useEffect } from 'react';

const NETWORKS = [
    { label: 'Localhost', value: 'http://localhost:8899' },
    { label: 'Devnet', value: 'https://api.devnet.solana.com' },
    { label: 'Mainnet', value: 'https://api.mainnet-beta.solana.com' },
    { label: 'Custom', value: 'custom' },
];

export const Settings: React.FC = () => {
    const [selected, setSelected] = useState('https://api.devnet.solana.com');
    const [customUrl, setCustomUrl] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('solana-network');
        if (stored) {
            setSelected(stored.startsWith('http') ? stored : 'https://api.devnet.solana.com');
            if (!NETWORKS.some(n => n.value === stored)) {
                setCustomUrl(stored);
                setSelected('custom');
            }
        }
    }, []);

    const handleSave = () => {
        const value = selected === 'custom' ? customUrl : selected;
        localStorage.setItem('solana-network', value);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };

    return (
        <div className="max-w-lg mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 space-y-6">
                <div>
                    <label className="block text-slate-300 font-medium mb-2">Solana Network</label>
                    <select
                        value={selected}
                        onChange={e => setSelected(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                        {NETWORKS.map(n => (
                            <option key={n.value} value={n.value}>{n.label}</option>
                        ))}
                    </select>
                </div>
                {selected === 'custom' && (
                    <div>
                        <label className="block text-slate-300 font-medium mb-2">Custom RPC URL</label>
                        <input
                            type="text"
                            value={customUrl}
                            onChange={e => setCustomUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                )}
                <button
                    onClick={handleSave}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
                >
                    Save
                </button>
                {saved && <div className="text-green-400 text-center mt-2">Saved!</div>}
                <div className="text-slate-400 text-xs mt-4">
                    Current: <span className="font-mono">{selected === 'custom' ? customUrl : selected}</span>
                </div>
            </div>
        </div>
    );
}; 