import React, { useState, useEffect } from 'react';
import { Plus, Loader2, SquarePen, Trash2, Eye, EyeOff } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import toast from 'react-hot-toast';

const SIDEBAR_ITEMS = [
  { label: 'Billing', value: 'billing' },
  { label: 'Menu', value: 'menu' },
  { label: 'Tables', value: 'tables' },
  { label: 'Orders', value: 'orders' },
  { label: 'Kitchen', value: 'kitchen' },
  { label: 'Reports', value: 'reports' },
  { label: 'Investment', value: 'investment' },
  { label: 'Staff', value: 'staff' },
];

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    address: '',
    access: [],
    emergency: { name: '', mobile: '', relation: '' },
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
        email: staff.email || '',
        password: '',
        address: staff.address || '',
        access: staff.access || [],
        emergency: staff.emergency || { name: '', mobile: '', relation: '' },
      });
      setEditingStaff(staff);
    } else {
      setForm({
        name: '',
        mobile: '',
        email: '',
        password: '',
        address: '',
        access: [],
        emergency: { name: '', mobile: '', relation: '' },
      });
      setEditingStaff(null);
    }
    setShowPassword(false);
    setShowModal(true);
  };

  const handleAccessChange = (value) => {
    setForm(f => ({ 
      ...f, 
      access: f.access.includes(value) 
        ? f.access.filter(v => v !== value) 
        : [...f.access, value] 
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.mobile || !form.email || !form.address) {
      toast.error('Name, mobile, email and address are required');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Validate password for new staff
    if (!editingStaff) {
      if (!form.password) {
        toast.error('Password is required');
        return;
      }
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }
    
    setSaving(true);
    try {
      let uid = null;
      
      // Create Firebase Auth user only for new staff
      if (!editingStaff && form.email && form.password) {
        try {
          const auth = getAuth();
          const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
          uid = userCredential.user.uid;
          toast.success('User account created');
        } catch (authError) {
          console.error('Auth error:', authError);
          setSaving(false);
          if (authError.code === 'auth/email-already-in-use') {
            toast.error('Email already exists');
          } else if (authError.code === 'auth/weak-password') {
            toast.error('Password is too weak');
          } else if (authError.code === 'auth/invalid-email') {
            toast.error('Invalid email format');
          } else {
            toast.error(`Failed to create user account: ${authError.message}`);
          }
          return;
        }
      }
      
      const staffData = {
        name: form.name,
        mobile: form.mobile,
        email: form.email,
        address: form.address,
        access: form.access || [],
        emergency: form.emergency || { name: '', mobile: '', relation: '' },
      };
      
      if (uid) {
        staffData.uid = uid;
      }
      
      if (editingStaff) {
        await updateDoc(doc(db, 'staff', editingStaff.id), staffData);
        toast.success('Staff updated');
      } else {
        await addDoc(collection(db, 'staff'), {
          ...staffData,
          createdAt: new Date().toISOString(),
        });
        toast.success('Staff added successfully');
      }
      
      setShowModal(false);
      setEditingStaff(null);
    } catch (e) {
      console.error('Error saving staff:', e);
      toast.error(`Error saving staff: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await deleteDoc(doc(db, 'staff', id));
      toast.success('Staff deleted');
    } catch (error) {
      toast.error('Failed to delete staff');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-[#ec2b25] text-white hover:bg-[#d12620] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Staff List Section */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Staff List</h2>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#ec2b25] mx-auto" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No staff members found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map(staff => (
              <div key={staff.id} className="border-2 border-gray-200 bg-white hover:border-[#ec2b25] transition-all p-4 relative">
                <div className="absolute top-2 right-2 flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(staff)} 
                    className="p-1 hover:bg-gray-100 text-gray-600 cursor-pointer" 
                    title="Edit"
                  >
                    <SquarePen className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(staff.id)} 
                    className="p-1 hover:bg-red-50 text-red-600 cursor-pointer" 
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="font-bold text-[#ec2b25] text-lg mb-3">{staff.name}</div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Mobile:</span>
                    <span className="font-medium text-gray-900">{staff.mobile}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{staff.email}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <span className="text-gray-600 text-xs">Address:</span>
                    <p className="font-medium text-gray-900">{staff.address}</p>
                  </div>
                  
                  {staff.access && staff.access.length > 0 && (
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <span className="text-gray-600 text-xs">Access:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {staff.access.map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs">
                            {SIDEBAR_ITEMS.find(si => si.value === item)?.label || item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {staff.emergency && staff.emergency.name && (
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <span className="text-gray-600 text-xs">Emergency Contact:</span>
                      <p className="font-medium text-gray-900">{staff.emergency.name} ({staff.emergency.relation})</p>
                      <p className="text-gray-700">{staff.emergency.mobile}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingStaff ? 'Edit Staff' : 'Add Staff'}
                </h2>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="p-1 hover:bg-gray-200 cursor-pointer"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={form.name} 
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                      className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" 
                      placeholder="Enter staff name" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={form.mobile} 
                      onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} 
                      className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" 
                      placeholder="Enter mobile number" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      value={form.email} 
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                      className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" 
                      placeholder="Enter email address"
                      disabled={!!editingStaff}
                      readOnly={!!editingStaff}
                    />
                    {editingStaff && <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password {!editingStaff && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={form.password} 
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
                        className="w-full px-3 py-2 pr-10 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" 
                        placeholder={editingStaff ? "Leave blank to keep current" : "Enter password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                      </button>
                    </div>
                    {!editingStaff && <p className="text-xs text-gray-500 mt-1">Min 6 characters</p>}
                  </div>
                </div>
              </div>

              {/* Access Section */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">Access Permissions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SIDEBAR_ITEMS.map(item => (
                    <label key={item.value} className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-gray-200 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={form.access.includes(item.value)}
                        onChange={() => handleAccessChange(item.value)}
                        className="accent-[#ec2b25] w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">Address</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    value={form.address} 
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))} 
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" 
                    placeholder="Enter complete address"
                    rows="3"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input 
                      type="text" 
                      value={form.emergency.name} 
                      onChange={e => setForm(f => ({ ...f, emergency: { ...f.emergency, name: e.target.value } }))} 
                      className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" 
                      placeholder="Emergency contact name" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                    <input 
                      type="text" 
                      value={form.emergency.mobile} 
                      onChange={e => setForm(f => ({ ...f, emergency: { ...f.emergency, mobile: e.target.value } }))} 
                      className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" 
                      placeholder="Emergency contact mobile" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                    <input 
                      type="text" 
                      value={form.emergency.relation} 
                      onChange={e => setForm(f => ({ ...f, emergency: { ...f.emergency, relation: e.target.value } }))} 
                      className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]" 
                      placeholder="Relation" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer" 
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                className="px-4 py-2 bg-[#ec2b25] text-white hover:bg-[#d12620] transition-colors cursor-pointer flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={saving || !form.name || !form.mobile || !form.email || !form.address || (!editingStaff && !form.password)}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
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
