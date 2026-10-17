import React, { useEffect, useState, useRef } from 'react';
import { Network, Layers, ShieldAlert, Globe, Mail, Fingerprint, Info, RefreshCw } from 'lucide-react';
import { ClusterGraphData, ClusterNode } from '../types';
import { api } from '../api';

export const ClusterGraph: React.FC = () => {
  const [data, setData] = useState<ClusterGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<ClusterNode | null>(null);

  const fetchClusters = async () => {
    try {
      setLoading(true);
      const res = await api.getClusters();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-xs text-slate-400">Rendering relationship cluster map...</div>;
  }

  // Group nodes by type
  const fpNodes = data.nodes.filter((n) => n.type === 'fingerprint');
  const accountNodes = data.nodes.filter((n) => n.type === 'account');
  const ipNodes = data.nodes.filter((n) => n.type === 'ip');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" />
            <span>Interactive Multi-Account Cluster Visualizer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visual graph mapping accounts sharing identical hardware fingerprints and IP addresses. Reveals syndicated free-tier abuse rings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Hardware FP ({fpNodes.length})
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> User Account ({accountNodes.length})
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> IP Address ({ipNodes.length})
            </span>
          </div>

          <button
            onClick={fetchClusters}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cluster Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Multi-Account Syndicates</span>
          <div className="text-2xl font-black text-rose-400 mt-1">{data.stats.multiAccountDevices}</div>
          <p className="text-[11px] text-slate-500">Devices connected to 2 or more accounts</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Syndicated Accounts</span>
          <div className="text-2xl font-black text-white mt-1">{data.stats.totalAccountsInClusters}</div>
          <p className="text-[11px] text-slate-500">Total accounts clustered around devices</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Revenue Risk Level</span>
          <div className="text-2xl font-black text-amber-400 mt-1">High Leakage</div>
          <p className="text-[11px] text-slate-500">Identifiable via browser fingerprint signals</p>
        </div>
      </div>

      {/* Interactive Cluster Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-slate-800 rounded-2xl bg-[#080d1a] p-6 min-h-[480px] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 z-10">
            <span className="font-semibold text-slate-300">Cluster Map (Click node to inspect linkage)</span>
            <span className="font-mono">{data.links.length} Active Cross-Links</span>
          </div>

          {/* Graph Nodes Representation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-auto py-6">
            {fpNodes.map((fp) => {
              const connectedLinks = data.links.filter((l) => l.target === fp.id || l.source === fp.id);
              const isMulti = (fp.count || 0) > 1;
              const isSelected = selectedNode?.id === fp.id;

              return (
                <div
                  key={fp.id}
                  onClick={() => setSelectedNode(fp)}
                  className={`p-4 rounded-xl border transition cursor-pointer relative ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-400 shadow-lg shadow-indigo-950/50'
                      : isMulti
                      ? 'bg-slate-900/80 border-rose-500/30 hover:border-rose-400/60'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isMulti && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500 text-white uppercase tracking-wider">
                      Abuse Cluster
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-xs font-bold text-white truncate max-w-[130px]">
                      {fp.id.slice(0, 14)}...
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Linked Accounts:</span>
                      <strong className={isMulti ? 'text-rose-400' : 'text-slate-300'}>{fp.count || 1}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={fp.isBanned ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {fp.isBanned ? 'BANNED' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3 flex items-center justify-between">
            <span>Graph Mode: Canonical Hardware Hash Clustering</span>
            <span>Signals: Canvas + WebGL + Screen + Fonts + Audio</span>
          </div>
        </div>

        {/* Node Inspector Drawer */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/50 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Info className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Cluster Inspection</h3>
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Selected Device</span>
                <div className="font-mono text-xs font-semibold text-white mt-1 break-all p-2 rounded-lg bg-slate-900 border border-slate-800">
                  {selectedNode.id}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Direct Relationships</span>
                <div className="space-y-1.5 mt-2">
                  {data.links
                    .filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
                    .map((l, idx) => {
                      const otherId = l.source === selectedNode.id ? l.target : l.source;
                      return (
                        <div key={idx} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs flex items-center justify-between">
                          <span className="text-slate-300 truncate max-w-[170px]">{otherId}</span>
                          <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300">
                            {l.type}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <strong>Syndicate Insight:</strong>
                <p className="text-[11px] text-slate-300">
                  Even when rotating VPNs or disposable email addresses, this user's hardware signature remained constant across registrations.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 italic">
              Click any device fingerprint card on the left to inspect linked accounts and network edges.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
