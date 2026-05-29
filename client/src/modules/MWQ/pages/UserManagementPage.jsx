import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import GlobalHeader from '../components/GlobalHeader';
import MobileHeader from '../components/MobileHeader';
import MobileSidebar from '../components/MobileSidebar';
import { useTranslation } from 'react-i18next';
import { UserPlus, X } from 'lucide-react';
import * as queries from '../../../lib/queries';

// ── Shared UI primitives ──────────────────────────────────────────────────────

const Toast = ({ message, type, onClose }) => (
  <div
    style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
      padding: '12px 20px', borderRadius: 12, maxWidth: 380,
      background: type === 'error' ? 'rgba(220,38,38,0.92)' : 'rgba(29,205,221,0.92)',
      color: '#fff', fontSize: 14, fontWeight: 600,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}
  >
    <span style={{ flex: 1 }}>{message}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>x</button>
  </div>
);

// Simple confirm modal — replaces native confirm()
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 99998,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
  >
    <div
      style={{
        borderRadius: 20, padding: '28px 32px', maxWidth: 380, width: '90%',
        background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(60,147,154,0.35) 0%, rgba(28,78,81,0.6) 100%)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        color: '#fff',
      }}
    >
      <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 24, lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', cursor: 'pointer', outline: 'none',
          }}
        >Cancel</button>
        <button
          onClick={onConfirm}
          style={{
            padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
            border: 'none', color: '#fff', cursor: 'pointer', outline: 'none',
          }}
        >Confirm</button>
      </div>
    </div>
  </div>
);

// New-user creation modal
const NewUserModal = ({ module, onClose, onCreated }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'USER' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = {
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.20)',
    borderRadius: 10, color: 'white', padding: '10px 14px', fontSize: 13.5,
    fontWeight: 500, outline: 'none', width: '100%',
  };
  const labelStyle = { color: 'white', fontSize: 12, fontWeight: 600, opacity: 0.85, marginBottom: 5, display: 'block' };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await queries.createUser(module, form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        style={{
          borderRadius: 24, padding: '28px 32px', maxWidth: 480, width: '92%',
          background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(60,147,154,0.35) 0%, rgba(28,78,81,0.6) 100%)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>New User</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input required name="firstName" value={form.firstName} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input required name="lastName" value={form.lastName} onChange={handleChange} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input required type="email" name="email" value={form.email} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input required type="password" name="password" value={form.password} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select name="role" value={form.role} onChange={handleChange}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          {error && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button" onClick={onClose}
              style={{
                padding: '9px 22px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff', cursor: 'pointer', outline: 'none',
              }}
            >Cancel</button>
            <button
              type="submit" disabled={submitting}
              style={{
                padding: '9px 22px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
                border: 'none', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                outline: 'none', opacity: submitting ? 0.7 : 1,
              }}
            >{submitting ? 'Creating…' : 'Create User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const UserManagementPage = () => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [moduleTab, setModuleTab] = useState('MWQ');
  const [viewTab, setViewTab] = useState('User Management');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState(null); // { message, onConfirm }
  const [showNewUser, setShowNewUser] = useState(false);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };

  const askConfirm = (message, onConfirm) => {
    setConfirmState({ message, onConfirm });
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await queries.listUsers(moduleTab);
      setUsers(data.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [moduleTab]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleApprove = async (user) => {
    try {
      await queries.updateUser(moduleTab, user.id, { accountStatus: 'ACTIVE' });
      fetchUsers();
    } catch (err) {
      showToast(err?.response?.data?.error?.message || 'Action failed', 'error');
    }
  };

  const handleReject = (user) => {
    askConfirm(`Reject user "${user.firstName} ${user.lastName}"?`, async () => {
      setConfirmState(null);
      try {
        await queries.updateUser(moduleTab, user.id, { accountStatus: 'REJECTED' });
        fetchUsers();
      } catch (err) {
        showToast(err?.response?.data?.error?.message || 'Action failed', 'error');
      }
    });
  };

  const handlePromoteToAdmin = (user) => {
    askConfirm(`Promote "${user.firstName} ${user.lastName}" to ADMIN?`, async () => {
      setConfirmState(null);
      try {
        await queries.updateUser(moduleTab, user.id, { role: 'ADMIN' });
        fetchUsers();
      } catch (err) {
        showToast(err?.response?.data?.error?.message || 'Action failed', 'error');
      }
    });
  };

  const cardStyle = {
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.12) 100%)',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.20)',
    padding: '32px 36px',
    width: '100%',
  };

  const activeTabStyle = {
    borderRadius: '20px',
    border: '1px solid #009FAC',
    background: '#BBE6E9',
    boxShadow: '0 4px 24px 0 rgba(0, 159, 172, 0.50) inset',
    backdropFilter: 'blur(12px)',
    color: '#000000',
    fontWeight: '600',
    padding: '8px 24px',
    fontSize: '12.5px',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const inactiveTabStyle = {
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.30)',
    background: 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.25) 100%)',
    boxShadow: '0 4px 4px 0 rgba(255, 255, 255, 0.25) inset',
    color: '#FFFFFF',
    fontWeight: '400',
    padding: '8px 24px',
    fontSize: '12.5px',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const btnNewUserStyle = {
    background: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.20)',
    borderRadius: '30px',
    color: 'white',
    padding: '8px 20px',
    fontSize: '12.5px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s',
  };

  const filtered = viewTab === 'Approve User'
    ? users.filter((u) => u.accountStatus === 'PENDING')
    : users;

  const UserRow = ({ user }) => (
    <div
      className="p-6 rounded-[20px] border border-white/10 flex items-center justify-between gap-6 transition-all hover:bg-white/5"
      style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)' }}
    >
      <div className="flex-1 min-w-[200px]">
        <h4 className="text-white font-bold text-[15.5px]">{user.firstName} {user.lastName}</h4>
        <span className="text-[12.5px] text-gray-400 mt-1 block">{user.email}</span>
      </div>
      <div className="flex-[2] grid grid-cols-3 gap-4 text-[13.5px] text-white/80 font-medium">
        <div><span className="text-gray-400 font-normal">Role: </span>{user.role}</div>
        <div><span className="text-gray-400 font-normal">Status: </span>{user.accountStatus}</div>
        <div><span className="text-gray-400 font-normal">Module: </span>{moduleTab}</div>
      </div>
      <div className="flex items-center gap-2">
        {viewTab === 'Approve User' ? (
          <>
            <button
              onClick={() => handleReject(user)}
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center bg-[#ea3838] text-white hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer shadow"
              title="Reject"
            >
              <svg viewBox="0 0 24 24" className="w-[11px] h-[11px] fill-none stroke-current stroke-[3.5]"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <button
              onClick={() => handleApprove(user)}
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center bg-[#20b656] text-white hover:scale-110 active:scale-95 transition-all outline-none cursor-pointer shadow"
              title="Approve"
            >
              <svg viewBox="0 0 24 24" className="w-[11px] h-[11px] fill-none stroke-current stroke-[3.5]"><path d="M20 6L9 17l-5-5" /></svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => handlePromoteToAdmin(user)}
            className="text-[11px] px-3 py-1 rounded-full border border-[#009FAC] text-[#19D9F3] hover:bg-[#009FAC]/20 transition-all outline-none cursor-pointer"
            title="Promote to Admin"
          >
            Make Admin
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-screen h-screen lg:overflow-hidden p-0 flex flex-col bg-transparent relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
      {showNewUser && (
        <NewUserModal
          module={moduleTab}
          onClose={() => setShowNewUser(false)}
          onCreated={() => { fetchUsers(); showToast('User created successfully.', 'success'); }}
        />
      )}

      {isMobile && (
        <>
          <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
          <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </>
      )}
      {!isMobile && (
        <div className="hidden md:block z-[2000]">
          <GlobalHeader />
        </div>
      )}

      <div className="flex-1 relative md:h-[calc(100vh-80px)] flex md:flex-row flex-col md:mt-[80px] min-h-0 overflow-hidden">
        {!isMobile && <Sidebar />}

        <div className="flex-1 relative h-full md:pl-[92px] md:pr-[8px] md:pb-[8px] overflow-hidden flex flex-col">
          <div className="flex-grow flex flex-col min-w-0 h-full relative animate-fadeIn"
            style={{
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'radial-gradient(251.65% 89.92% at 50.22% 50.31%, rgba(60, 147, 154, 0.3) 0%, rgba(28, 78, 81, 0.44) 100%)',
              boxShadow: '3px 3px 4px 0 rgba(255, 255, 255, 0.17) inset',
              backdropFilter: 'blur(7px)',
              WebkitBackdropFilter: 'blur(7px)',
              padding: '20px 24px',
              overflow: 'hidden'
            }}
          >
            <div className="flex flex-col mb-4">
              <h1 className="text-xl font-bold text-white tracking-tight">User Management</h1>
              <p className="text-xs text-gray-400 mt-1">Manage users across modules</p>
            </div>

            <div className="flex-grow flex flex-col overflow-y-auto no-scrollbar">
              <div style={cardStyle} className="flex flex-col gap-6">
                {/* Module tab switcher */}
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <span className="text-xs text-gray-400 font-medium mr-2">Module:</span>
                  {['MWQ', 'AQMS'].map((mod) => (
                    <button
                      key={mod}
                      style={moduleTab === mod ? activeTabStyle : inactiveTabStyle}
                      onClick={() => setModuleTab(mod)}
                    >
                      {mod} Users
                    </button>
                  ))}
                </div>

                {/* View tab switcher + add button */}
                <div className="flex justify-between items-center w-full flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <button style={viewTab === 'User Management' ? activeTabStyle : inactiveTabStyle} onClick={() => setViewTab('User Management')}>
                      User Management
                    </button>
                    <button style={viewTab === 'Approve User' ? activeTabStyle : inactiveTabStyle} onClick={() => setViewTab('Approve User')}>
                      Approve User
                    </button>
                  </div>
                  <button
                    style={btnNewUserStyle}
                    className="hover:scale-[1.03] active:scale-[0.97]"
                    onClick={() => setShowNewUser(true)}
                  >
                    <UserPlus size={14} color="#ffffff" strokeWidth={2.5} />
                    <span>New User</span>
                  </button>
                </div>

                {loading ? (
                  <p className="text-white/60 text-sm text-center py-8">Loading…</p>
                ) : filtered.length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-8">No users found.</p>
                ) : (
                  <div className="flex flex-col gap-4 mt-2">
                    {filtered.map((user) => <UserRow key={user.id} user={user} />)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
