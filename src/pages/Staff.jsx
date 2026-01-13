import React, { useState, useEffect } from 'react';
import { Plus, Loader2, SquarePen, Trash2 } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

const SIDEBAR_ITEMS = [
  { label: 'Billing', value: 'billing' },
  { label: 'Menu', value: 'menu' },
  { label: 'Tables', value: 'tables' },
  { label: 'Orders', value: 'orders' },
  { label: 'Investments', value: 'investments' },
  { label: 'Payroll', value: 'payroll' },
  { label: 'Staff', value: 'staff' },
];

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    altMobile: '',
    address: '',
    role: '',
    aadhar: '',
    access: [],
    emergency: { name: '', mobile: '', address: '' },
  });
  const [editingStaff, setEditingStaff] = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'staff'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setStaffList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenModal = (staff = null) => {
    if (staff) {
      setForm({
        name: staff.name || '',
        mobile: staff.mobile || '',
        altMobile: staff.altMobile || '',
        address: staff.address || '',
        role: staff.role || '',
        aadhar: staff.aadhar || '',
        access: staff.access || [],
        emergency: staff.emergency || { name: '', mobile: '', address: '' },
      });
      setEditingStaff(staff);
    } else {
      setForm({
        name: '',
        mobile: '',
        altMobile: '',
        address: '',
        role: '',
        aadhar: '',
        access: [],
        emergency: { name: '', mobile: '', address: '' },
      });
      setEditingStaff(null);
    }
    setShowModal(true);
  };

  const handleAccessChange = (value) => {
    setForm(f => ({ ...f, access: f.access.includes(value) ? f.access.filter(v => v !== value) : [...f.access, value] }));
  };

  const handleSave = async () => {
    if (!form.name || !form.mobile || !form.address || !form.role || !form.aadhar) {
      toast.error('All main fields are required');
      return;
    }
    setSaving(true);
    try {
      if (editingStaff) {
        await updateDoc(doc(db, 'staff', editingStaff.id), {
          ...form,
        });
        toast.success('Staff updated');
      } else {
        await addDoc(collection(db, 'staff'), {
          ...form,
          createdAt: new Date().toISOString(),
        });
        toast.success('Staff added');
      }
    } catch (e) {
      toast.error('Error saving staff');
    }
    setShowModal(false);
    setSaving(false);
    setEditingStaff(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff?')) return;
    await deleteDoc(doc(db, 'staff', id));
    toast.success('Staff deleted');
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
        <button
          onClick={handleOpenModal}
          className="flex items-center space-x-2 px-4 py-2 bg-[#ec2b25] text-white hover:bg-[#d12620] transition-colors cursor-pointer rounded"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Staff List Section */}
      <div className="bg-white p-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Staff List</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500"><Loader2 className="w-8 h-8 animate-spin text-[#ec2b25] mx-auto" /></div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No staff found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {staffList.map(staff => (
              <div key={staff.id} className="border border-gray-200 p-4 hover:border-gray-300 transition-colors relative rounded">
                <div className="absolute top-2 right-2 flex gap-2">
                  <button onClick={() => handleOpenModal(staff)} className="p-1 hover:bg-gray-100 text-gray-600 cursor-pointer" title="Edit">
                    <SquarePen className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(staff.id)} className="p-1 hover:bg-red-50 text-red-600 cursor-pointer" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="font-semibold text-[#ec2b25] text-lg mb-1">{staff.name}</div>
                <div className="text-xs text-gray-700 mb-1">Role: <span className="font-semibold">{staff.role}</span></div>
                <div className="text-xs text-gray-700 mb-1">Mobile: <span className="font-semibold">{staff.mobile}</span></div>
                <div className="text-xs text-gray-700 mb-1">Alt Mobile: <span className="font-semibold">{staff.altMobile}</span></div>
                <div className="text-xs text-gray-700 mb-1">Aadhar: <span className="font-semibold">{staff.aadhar}</span></div>
                <div className="text-xs text-gray-700 mb-1">Address: <span className="font-semibold">{staff.address}</span></div>
                <div className="text-xs text-gray-700 mb-1">Access: <span className="font-semibold">{(staff.access || []).join(', ')}</span></div>
                <div className="text-xs text-gray-700 mb-1">Emergency: <span className="font-semibold">{staff.emergency?.name} ({staff.emergency?.mobile})</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white w-full max-w-4xl p-8 rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Staff</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 cursor-pointer">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Staff Name</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" placeholder="Enter staff name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                  <input type="text" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" placeholder="Enter mobile number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Mobile Number</label>
                  <input type="text" value={form.altMobile} onChange={e => setForm(f => ({ ...f, altMobile: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" placeholder="Enter alternate mobile number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aadhar Card Number</label>
                  <input type="text" value={form.aadhar} onChange={e => setForm(f => ({ ...f, aadhar: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" placeholder="Enter aadhar card number" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input type="text" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" placeholder="Enter role" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" placeholder="Enter address" />
                </div>
              </div>
              {/* Access Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Access</label>
                <div className="flex flex-wrap gap-2">
                  {SIDEBAR_ITEMS.filter(i => i.value !== 'dashboard').map(item => (
                    <label key={item.value} className="flex items-center gap-2 cursor-pointer px-3 py-1 border rounded border-gray-200">
                      <input
                        type="checkbox"
                        checked={form.access.includes(item.value)}
                        onChange={() => handleAccessChange(item.value)}
                        className="accent-[#ec2b25]"
                      />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Emergency Contact */}
              <div className="border-t pt-4 mt-4">
                <div className="font-semibold text-gray-900 mb-2">Emergency Contact</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input type="text" value={form.emergency.name} onChange={e => setForm(f => ({ ...f, emergency: { ...f.emergency, name: e.target.value } }))} className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" placeholder="Enter emergency contact name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                    <input type="text" value={form.emergency.mobile} onChange={e => setForm(f => ({ ...f, emergency: { ...f.emergency, mobile: e.target.value } }))} className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" placeholder="Enter emergency contact mobile" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input type="text" value={form.emergency.address} onChange={e => setForm(f => ({ ...f, emergency: { ...f.emergency, address: e.target.value } }))} className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" placeholder="Enter emergency contact address" />
                  </div>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer" disabled={saving}>Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#ec2b25] text-white hover:bg-[#d12620] transition-colors cursor-pointer flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={saving || !form.name || !form.mobile || !form.address || !form.role || !form.aadhar}>
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

export default Staff;
