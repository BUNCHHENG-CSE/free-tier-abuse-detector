import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { ReviewItem } from '../types';
import { api } from '../api';
import { RiskBadge } from '../components/RiskBadge';

interface ReviewQueueProps {
  onOpenReview: (id: string) => void;
  onRefreshParent: () => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onOpenReview, onRefreshParent }) => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.getReviewQueue(statusFilter, search);
      setItems(res.items);
      setPendingCount(res.pendingCount);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueue();
  };

  const handleQuickDecision = async (id: string, decision: 'approved' | 'rejected' | 'abuser') => {
    try {
      await api.submitDecision(id, decision);
      fetchQueue();
      onRefreshParent();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Manual Review Queue</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {pendingCount} Pending
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Flagged suspicious registrations. No black-box automated blocking—review signals and approve or tag abusers.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, IP, or FP..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'pending', label: 'Pending Review', count: pendingCount },
          { id: 'all', label: 'All Items' },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'abuser', label: 'Banned Abusers' },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-300 font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Queue Table */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/40 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading review queue...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Review Queue is Clear!</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No suspicious registrations currently awaiting review in this view. Use the simulation buttons in the header to test attacks.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/70 border-b border-slate-800/80 text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User / Registration</th>
                  <th className="py-3.5 px-4">Risk Score</th>
                  <th className="py-3.5 px-4">Triggered Signals</th>
                  <th className="py-3.5 px-4">Hardware Cluster</th>
                  <th className="py-3.5 px-4">IP / Time</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/30 transition group cursor-pointer"
                    onClick={() => onOpenReview(item.id)}
                  >
                    {/* User */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white group-hover:text-indigo-300 transition">
                        {item.email || 'Anonymous signup'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        ID: {item.event_id}
                      </div>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3.5 px-4">
                      <RiskBadge score={item.risk_score} level={item.risk_level} />
                    </td>

                    {/* Reasons */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="space-y-1">
                        {item.reasons.slice(0, 2).map((r, idx) => (
                          <div key={idx} className="text-[11px] text-slate-300 truncate" title={r}>
                            • {r}
                          </div>
                        ))}
                        {item.reasons.length > 2 && (
                          <span className="text-[10px] text-muted italic">
                            +{item.reasons.length - 2} more signals
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cluster / FP */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-slate-300 text-[11px]">
                        <span>{item.fingerprint_id.slice(0, 14)}...</span>
                      </div>
                      <div className="text-[10px] text-indigo-400 flex items-center gap-1 mt-0.5 font-medium">
                        <Layers className="w-3 h-3" />
                        <span>{item.linked_accounts_count || 1} accounts linked</span>
                      </div>
                    </td>

                    {/* IP / Time */}
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="font-mono text-slate-300">{item.ip_address}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleQuickDecision(item.id, 'approved')}
                          className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition"
                          title="Quick Approve"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleQuickDecision(item.id, 'rejected')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
                          title="Quick Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleQuickDecision(item.id, 'abuser')}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                          title="Ban Device & Mark Abuser"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenReview(item.id)}
                          className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/20 transition ml-1"
                          title="Detailed Investigation"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
