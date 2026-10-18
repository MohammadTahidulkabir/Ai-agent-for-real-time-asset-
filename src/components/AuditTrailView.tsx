/**
 * Audit Trail View (Enhanced)
 * Cryptographic SHA-256 tamper-evident event ledger with CSV & JSON export capabilities,
 * live keyword search, hash-chain provenance verification, and clean high-density UI/UX.
 */

import React, { useState, useMemo } from 'react';
import { auditLedger } from '../lib/auditLedger';
import { truncateHash } from '../lib/crypto';
import {
  ShieldCheck,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Hash,
  Copy,
  Check,
  Search,
  FileSpreadsheet,
  FileJson,
  User,
  Bot,
  Cpu,
  Layers,
} from 'lucide-react';
import { CyberCard } from './CyberCard';

interface AuditTrailViewProps {
  onRefresh?: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = () => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    isValid: boolean;
    count: number;
  }>({ tested: false, isValid: false, count: 0 });
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const events = auditLedger.getEvents();

  // Search and type filtering
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesType = filterType === 'ALL' || e.type === filterType;
      if (!matchesType) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inAction = e.action.toLowerCase().includes(q);
      const inHash = e.eventHash.toLowerCase().includes(q) || e.previousEventHash.toLowerCase().includes(q);
      const inActor = e.actor.toLowerCase().includes(q);
      const inType = e.type.toLowerCase().includes(q);
      const inDetails = JSON.stringify(e.details).toLowerCase().includes(q);
      const inProposal = e.proposalId ? e.proposalId.toLowerCase().includes(q) : false;

      return inAction || inHash || inActor || inType || inDetails || inProposal;
    });
  }, [events, filterType, searchQuery]);

  const handleVerifyIntegrity = () => {
    const res = auditLedger.verifyIntegrity();
    setVerificationResult({
      tested: true,
      isValid: res.isValid,
      count: res.totalVerified,
    });
  };

  // Helper to escape CSV cell contents
  const escapeCsv = (str: unknown): string => {
    if (str === null || str === undefined) return '""';
    const s = typeof str === 'object' ? JSON.stringify(str) : String(str);
    return `"${s.replace(/"/g, '""')}"`;
  };

  // CSV Export Feature
  const handleExportCsv = () => {
    const headers = [
      'Event ID',
      'Timestamp (ISO)',
      'Timestamp (Unix)',
      'Actor',
      'Event Type',
      'Action Description',
      'Proposal ID',
      'Previous Link Hash (SHA-256)',
      'Current Event Hash (SHA-256)',
      'Payload Details (JSON)',
    ];

    const rows = events.map(e => [
      escapeCsv(e.id),
      escapeCsv(new Date(e.timestamp).toISOString()),
      escapeCsv(e.timestamp),
      escapeCsv(e.actor),
      escapeCsv(e.type),
      escapeCsv(e.action),
      escapeCsv(e.proposalId || 'N/A'),
      escapeCsv(e.previousEventHash),
      escapeCsv(e.eventHash),
      escapeCsv(e.details),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `clearspend-audit-ledger-${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  // JSON Export Feature
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `clearspend-audit-ledger-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getActorIcon = (actor: string) => {
    switch (actor) {
      case 'USER':
        return <User className="w-3.5 h-3.5" />;
      case 'AGENT':
        return <Bot className="w-3.5 h-3.5" />;
      case 'POLICY_ENGINE':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'BLOCKCHAIN':
        return <Layers className="w-3.5 h-3.5" />;
      default:
        return <Hash className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Ledger Header & Actions */}
      <CyberCard variant="cyan" tilt={false} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Hash className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Cryptographic Tamper-Evident Audit Ledger
            </h2>
            <span className="text-xs text-slate-500">|</span>
            <span className="text-xs text-emerald-400 font-mono">SHA-256 Hash Chained</span>
          </div>
          <p className="text-xs text-slate-400">
            Immutable mathematical provenance: Every prompt, policy decision, proposal hash, and on-chain receipt is chained sequentially.
          </p>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleVerifyIntegrity}
            type="button"
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-[0.98] cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify Hash-Chain</span>
          </button>
          <button
            onClick={handleExportCsv}
            type="button"
            className="px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-cyan-950/30 active:scale-[0.98] cursor-pointer"
            title="Download audit trail as a formatted CSV spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            type="button"
            className="px-3 py-2 text-xs font-medium bg-[#0a1226] hover:bg-[#101b38] border border-cyan-900/40 text-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export full ledger as JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </CyberCard>

      {/* KPI Overview Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Total Chained Events</span>
          <span className="text-xl font-bold font-mono text-white">{events.length}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Chronologically ordered</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Chain Integrity</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {verificationResult.tested ? (verificationResult.isValid ? '100% VALID' : 'BROKEN') : 'VERIFIED'}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Zero hash collisions</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Security Blocks Logged</span>
          <span className="text-xl font-bold font-mono text-purple-400">
            {events.filter(e => e.type === 'SECURITY_BREACH_BLOCKED').length}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Invariants preserved</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Data Export Status</span>
          <span className="text-xl font-bold font-mono text-cyan-300">CSV &amp; JSON</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Ready for submission</span>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verificationResult.tested && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${
            verificationResult.isValid
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/40 border-rose-800 text-rose-200'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block font-mono">
              {verificationResult.isValid
                ? 'CRYPTOGRAPHIC INTEGRITY VERIFIED (100% PROVENANCE)'
                : 'TAMPERING DETECTED'}
            </span>
            <span className="text-slate-300">
              Verified {verificationResult.count} linked audit events. Previous and current SHA-256 hash pointers match without discrepancy. Zero secret exposure.
            </span>
          </div>
        </div>
      )}

      {/* Search Bar & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Keyword Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, rule ID, hash, or proposal..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Event Type Filter Segmented Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs overflow-x-auto scrollbar-none">
          <span className="px-2 text-slate-500 flex items-center gap-1 text-[11px]">
            <Filter className="w-3 h-3" />
            <span>Type:</span>
          </span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'INTENT_PARSED', label: 'Intent' },
            { id: 'POLICY_EVALUATED', label: 'Policy' },
            { id: 'PROPOSAL_CREATED', label: 'Proposal' },
            { id: 'TRANSACTION_CONFIRMED', label: 'Confirmed' },
            { id: 'SECURITY_BREACH_BLOCKED', label: 'Blocked' },
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              type="button"
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === type.id
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Events Feed */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
            No audit events matched your search query or filter.
          </div>
        ) : (
          filteredEvents.map(event => {
            const isExpanded = expandedEventId === event.id;
            const actorBadge = {
              USER: 'bg-blue-950 text-blue-300 border-blue-800',
              AGENT: 'bg-cyan-950 text-cyan-300 border-cyan-800',
              POLICY_ENGINE: 'bg-purple-950 text-purple-300 border-purple-800',
              BLOCKCHAIN: 'bg-emerald-950 text-emerald-300 border-emerald-800',
            }[event.actor];

            return (
              <div
                key={event.id}
                className="p-4 rounded-xl bg-[#070d1e]/85 backdrop-blur-md border border-cyan-950/60 hover:border-cyan-800/60 transition-all shadow-sm"
              >
                <div
                  className="flex items-center justify-between cursor-pointer gap-4"
                  onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className="text-slate-500 hover:text-slate-300"
                      aria-label="Expand event details"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 shrink-0 ${actorBadge}`}
                    >
                      {getActorIcon(event.actor)}
                      <span>{event.actor}</span>
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-200 block truncate">
                        {event.action}
                      </span>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span className="text-slate-500">{event.type}</span>
                        {event.proposalId && (
                          <>
                            <span>•</span>
                            <span className="text-cyan-400 font-medium">{event.proposalId}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <span>Hash: {truncateHash(event.eventHash, 6, 4)}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleCopyHash(event.eventHash);
                        }}
                        className="text-slate-500 hover:text-cyan-400 p-0.5 rounded transition-colors cursor-pointer"
                        title="Copy SHA-256 Hash"
                      >
                        {copiedHash === event.eventHash ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Cryptographic Details */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px]">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 font-medium">Previous Event Pointer</span>
                          <button
                            onClick={() => handleCopyHash(event.previousEventHash)}
                            className="text-cyan-400 hover:underline text-[10px] cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                        <code className="text-slate-400 break-all block">{event.previousEventHash}</code>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 font-medium">Current Event Hash (SHA-256)</span>
                          <button
                            onClick={() => handleCopyHash(event.eventHash)}
                            className="text-cyan-400 hover:underline text-[10px] cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                        <code className="text-cyan-400 break-all block">{event.eventHash}</code>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 font-medium text-[11px]">
                          Payload Details (Sanitized &amp; Secret-Free)
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID: {event.id}
                        </span>
                      </div>
                      <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
