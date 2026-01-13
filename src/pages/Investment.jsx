import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';

const CATEGORY_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Equipment', value: 'equipment' },
  { label: 'Renovation', value: 'renovation' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Other', value: 'other' },
];

const PAGE_SIZE = 42;

const Investment = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', amount: '', staff: '' });
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState('');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'investments'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setInvestments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenModal = () => {
    setForm({ name: '', category: '', amount: '', staff: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.amount || !form.staff) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);
    await addDoc(collection(db, 'investments'), {
      ...form,
      amount: parseFloat(form.amount),
      createdAt: new Date().toISOString(),
    });
    setShowModal(false);
    setSaving(false);
    toast.success('Investment added');
  };

  // Filter investments
  const filtered = investments.filter(inv => {
    const date = inv.createdAt?.slice(0, 10);
    const catMatch = !category || inv.category === category;
    const fromMatch = !fromDate || date >= fromDate;
    const toMatch = !toDate || date <= toDate;
    return catMatch && fromMatch && toMatch;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Investments</h1>
        <button
          onClick={handleOpenModal}
          className="flex items-center space-x-2 px-4 py-2 bg-[#ec2b25] text-white hover:bg-[#d12620] transition-colors cursor-pointer rounded"
        >
          <Plus className="w-4 h-4" />
          <span>Add Investment</span>
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 border border-gray-200 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-700">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="border px-2 py-1 rounded text-sm">
            {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-700">From</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border px-2 py-1 rounded text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-700">To</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border px-2 py-1 rounded text-sm" />
        </div>
      </div>

      {/* Investments Section */}
      <div className="bg-white p-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Investment List</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500"><Loader2 className="w-8 h-8 animate-spin text-[#ec2b25] mx-auto" /></div>
        ) : paged.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No investments found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paged.map(inv => (
              <div key={inv.id} className="border border-gray-200 p-4 hover:border-gray-300 transition-colors relative rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-[#ec2b25] text-lg">{inv.name}</div>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-semibold">{inv.category}</span>
                </div>
                <div className="text-xs text-gray-700 mb-1">Staff: <span className="font-semibold">{inv.staff}</span></div>
                <div className="text-xs text-gray-700 mb-1">Date: <span className="font-semibold">{inv.createdAt?.slice(0, 10)}</span></div>
                <div className="font-bold text-gray-900 text-lg">₹{inv.amount}</div>
              </div>
            ))}
          </div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50">Prev</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 rounded font-semibold ${page === i + 1 ? 'bg-[#ec2b25] text-white' : 'bg-gray-100 text-gray-700'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50">Next</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white w-full max-w-md p-6 rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Investment</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 cursor-pointer">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Investment Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" placeholder="Enter investment name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]">
                  <option value="">Select Category</option>
                  <option value="equipment">Equipment</option>
                  <option value="renovation">Renovation</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" placeholder="Enter amount" min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Staff</label>
                <input type="text" value={form.staff} onChange={e => setForm(f => ({ ...f, staff: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" placeholder="Enter staff name" />
              </div>
            </div>
            {/* Footer */}
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer" disabled={saving}>Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#ec2b25] text-white hover:bg-[#d12620] transition-colors cursor-pointer flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={saving || !form.name || !form.category || !form.amount || !form.staff}>
                {saving && <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>}
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investment;
