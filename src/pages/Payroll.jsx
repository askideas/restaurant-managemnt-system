import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Plus, X, DollarSign, Users, IndianRupee, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const Payroll = () => {
  const [staff, setStaff] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salaries, setSalaries] = useState({});

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchStaff();
    fetchPayrolls();
  }, [selectedMonth, selectedYear]);

  const fetchStaff = async () => {
    try {
      const staffSnap = await getDocs(collection(db, 'staff'));
      const staffList = staffSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStaff(staffList);
      
      // Initialize salaries with existing salary data
      const initialSalaries = {};
      staffList.forEach(s => {
        initialSalaries[s.id] = s.salary || 0;
      });
      setSalaries(initialSalaries);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to fetch staff');
    }
  };

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const payrollsSnap = await getDocs(
        query(
          collection(db, 'payrolls'),
          where('month', '==', selectedMonth),
          where('year', '==', selectedYear)
        )
      );
      const payrollList = payrollsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayrolls(payrollList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      setLoading(false);
    }
  };

  const handleSalaryChange = (staffId, value) => {
    setSalaries({
      ...salaries,
      [staffId]: parseFloat(value) || 0
    });
  };

  const handleSavePayroll = async () => {
    try {
      // Validate that at least one salary is entered
      const hasValidSalary = Object.values(salaries).some(salary => salary > 0);
      if (!hasValidSalary) {
        toast.error('Please enter at least one salary amount');
        return;
      }

      // Check if payroll already exists for this month/year
      const existingPayroll = payrolls.length > 0;
      if (existingPayroll) {
        toast.error(`Payroll already exists for ${months[selectedMonth]} ${selectedYear}`);
        return;
      }

      // Create payroll entries for each staff with salary
      const payrollPromises = staff.map(async (s) => {
        const salary = salaries[s.id] || 0;
        if (salary > 0) {
          return addDoc(collection(db, 'payrolls'), {
            staffId: s.id,
            staffName: s.name,
            staffEmail: s.email,
            salary: salary,
            month: selectedMonth,
            year: selectedYear,
            monthName: months[selectedMonth],
            createdAt: new Date().toISOString(),
          });
        }
      });

      await Promise.all(payrollPromises.filter(Boolean));
      
      toast.success('Payroll saved successfully');
      setShowModal(false);
      fetchPayrolls();
    } catch (error) {
      console.error('Error saving payroll:', error);
      toast.error('Failed to save payroll');
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTotalPayroll = () => {
    return payrolls.reduce((sum, p) => sum + (parseFloat(p.salary) || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ec2b25] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payroll...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600 mt-1">Manage staff salaries and payroll</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#ec2b25] text-white px-6 py-3 hover:bg-[#d12520] transition-colors"
          disabled={payrolls.length > 0}
        >
          <Plus className="w-5 h-5" />
          Add Payroll
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700 font-medium">Filter:</span>
          </div>
          
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border-2 border-gray-200 px-4 py-2 bg-white text-gray-900 focus:outline-none focus:border-[#ec2b25]"
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border-2 border-gray-200 px-4 py-2 bg-white text-gray-900 focus:outline-none focus:border-[#ec2b25]"
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Card */}
      {payrolls.length > 0 && (
        <div className="bg-white border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Total Payroll</h3>
              <p className="text-3xl font-bold text-[#ec2b25]">{formatCurrency(getTotalPayroll())}</p>
              <p className="text-sm text-gray-500 mt-2">
                {months[selectedMonth]} {selectedYear} • {payrolls.length} Staff
              </p>
            </div>
            <div className="p-4 bg-red-100">
              <IndianRupee className="w-8 h-8 text-[#ec2b25]" />
            </div>
          </div>
        </div>
      )}

      {/* Payroll List */}
      <div className="bg-white border-2 border-gray-200">
        <div className="p-4 border-b-2 border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Payroll for {months[selectedMonth]} {selectedYear}
          </h2>
        </div>

        {payrolls.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month/Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y-2 divide-gray-200">
                {payrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{payroll.staffName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {payroll.staffEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-green-600">{formatCurrency(payroll.salary)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {payroll.monthName} {payroll.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {new Date(payroll.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IndianRupee className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-2">No Payroll Found</p>
            <p className="text-gray-400">
              No payroll records for {months[selectedMonth]} {selectedYear}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-[#ec2b25] hover:underline font-medium"
            >
              Add Payroll for this month
            </button>
          </div>
        )}
      </div>

      {/* Add Payroll Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b-2 border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add Payroll</h2>
                <p className="text-gray-600 mt-1">
                  {months[selectedMonth]} {selectedYear}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {staff.map((s) => (
                  <div key={s.id} className="border-2 border-gray-200 p-4 hover:border-[#ec2b25] transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <h3 className="font-medium text-gray-900">{s.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{s.email}</p>
                        <p className="text-xs text-gray-500 mt-1">{s.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-gray-600" />
                        <input
                          type="number"
                          value={salaries[s.id] || ''}
                          onChange={(e) => handleSalaryChange(s.id, e.target.value)}
                          placeholder="Enter salary"
                          className="border-2 border-gray-200 px-3 py-2 w-40 focus:outline-none focus:border-[#ec2b25]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t-2 border-gray-200 flex items-center justify-between">
              <div className="text-gray-600">
                <span className="text-sm">Total: </span>
                <span className="text-xl font-bold text-[#ec2b25]">
                  {formatCurrency(Object.values(salaries).reduce((sum, sal) => sum + (parseFloat(sal) || 0), 0))}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border-2 border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePayroll}
                  className="px-6 py-2 bg-[#ec2b25] text-white hover:bg-[#d12520] transition-colors"
                >
                  Save Payroll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
