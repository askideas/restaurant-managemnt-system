import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronDown, Search, Minus, X, Printer, Save, ChevronLeft, ChevronRight, CreditCard, Loader2 } from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, limit, startAfter, getCountFromServer, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';
import ThermalBill from '../components/Billing/ThermalBill';

const ITEMS_PER_PAGE = 24;

const BillingPage = () => {
  const [showAddBill, setShowAddBill] = useState(true);
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Bill Section States
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [billItems, setBillItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentBillId, setCurrentBillId] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [billType, setBillType] = useState('dine-in'); // 'dine-in', 'take-away', 'swiggy', 'zomato'
  const [discount, setDiscount] = useState(0);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBills, setTotalBills] = useState(0);
  const [lastVisible, setLastVisible] = useState(null);

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [processing, setProcessing] = useState(false);

  const printRef = useRef();
  const itemsListRef = useRef();
  const addBillSectionRef = useRef();

  // Fetch all data
  useEffect(() => {
    fetchFloors();
    fetchTables();
    fetchCategories();
    fetchItems();
    fetchBills();
    fetchTotalBillsCount();
  }, []);

  const fetchFloors = async () => {
    try {
      const q = query(collection(db, 'floors'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const floorsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFloors(floorsData);
    } catch (error) {
      console.error('Error fetching floors:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const q = query(collection(db, 'tables'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const tablesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTables(tablesData);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const categoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchTotalBillsCount = async () => {
    try {
      const snapshot = await getCountFromServer(collection(db, 'bills'));
      setTotalBills(snapshot.data().count);
    } catch (error) {
      console.error('Error fetching bills count:', error);
    }
  };

  const fetchBills = async (page = 1) => {
    try {
      let q;
      if (page === 1) {
        q = query(collection(db, 'bills'), orderBy('createdAt', 'desc'), limit(ITEMS_PER_PAGE));
      } else {
        q = query(collection(db, 'bills'), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(ITEMS_PER_PAGE));
      }
      
      const querySnapshot = await getDocs(q);
      const billsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBills(billsData);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  // Filter tables by floor
  const filteredTables = selectedFloor === 'all' 
    ? tables 
    : tables.filter(table => table.floorId === selectedFloor);

  // Filter items by category
  const filteredItems = selectedCategory 
    ? items.filter(item => item.categoryId === selectedCategory)
    : items;

  // Filter categories by search
  const searchFilteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  // Load open bill for selected table
  const loadOpenBillForTable = async (table) => {
    try {
      const q = query(
        collection(db, 'bills'),
        where('tableId', '==', table.id),
        where('status', '==', 'open')
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const billDoc = querySnapshot.docs[0];
        const billData = { id: billDoc.id, ...billDoc.data() };
        
        // Load bill data into form
        setBillItems(billData.items);
        setCustomerName(billData.customerName);
        setCurrentBillId(billDoc.id);
        toast.success('Loaded open bill for this table');
      } else {
        // No open bill, reset form
        setBillItems([]);
        setCustomerName('');
        setCurrentBillId(null);
      }
    } catch (error) {
      console.error('Error loading open bill:', error);
      toast.error('Failed to load open bill');
    }
  };

  // Handle table selection
  const handleTableSelect = (table) => {
    setSelectedTable(table);
    loadOpenBillForTable(table);
  };

  // Add item to bill
  const addItemToBill = (item) => {
    setBillItems(prev => {
      const existing = prev.find(bi => bi.id === item.id);
      if (existing) {
        return prev.map(bi =>
          bi.id === item.id
            ? { ...bi, quantity: bi.quantity + 1, pendingKotQty: (bi.pendingKotQty || 0) + 1 }
            : bi
        );
      } else {
        return [...prev, { ...item, quantity: 1, kotSent: false, pendingKotQty: 1 }];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (itemId, delta) => {
    setBillItems(prevItems => prevItems.map(bi => {
      if (bi.id === itemId) {
        const newQty = bi.quantity + delta;
        const newPending = (bi.pendingKotQty || 0) + (delta > 0 ? delta : Math.max(delta, -((bi.pendingKotQty || 0))));
        if (newQty <= 0) return null;
        return { ...bi, quantity: newQty, pendingKotQty: Math.max(0, newPending) };
      }
      return bi;
    }).filter(Boolean));
  };

  // Remove item from bill
  const removeItemFromBill = async (itemId) => {
    const itemToRemove = billItems.find(bi => bi.id === itemId);
    
    if (!itemToRemove) return;

    try {
      // Cancel all orders associated with this item
      if (itemToRemove.orderIds && itemToRemove.orderIds.length > 0) {
        await Promise.all(itemToRemove.orderIds.map(async (order) => {
          await updateDoc(doc(db, 'orders', order.orderDocId), {
            status: 'cancelled',
            updatedAt: new Date().toISOString()
          });
        }));
      }
      
      // Remove item from bill items
      const updatedItems = billItems.filter(bi => bi.id !== itemId);
      setBillItems(updatedItems);
      
      // Update bill in database if it exists
      if (currentBillId) {
        const subtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmount = (subtotal * discount) / 100;
        const total = subtotal - discountAmount;
        
        await updateDoc(doc(db, 'bills', currentBillId), {
          items: updatedItems,
          subtotal: subtotal,
          total: total,
          updatedAt: new Date().toISOString()
        });
        
        // Refresh bills list
        fetchBills(currentPage);
        
        toast.success('Item removed and bill updated');
      } else {
        toast.success('Item removed from bill');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  // Calculate total
  const calculateTotal = () => {
    const subtotal = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const calculateSubtotal = () => {
    return billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Generate custom order ID: #O-DDMMYYYY-N
  const generateOrderId = async () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB').split('/').join(''); // DDMMYYYY
    
    // Count orders created today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    
    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', startOfDay),
      where('createdAt', '<=', endOfDay)
    );
    const snapshot = await getDocs(q);
    const orderNumber = snapshot.size + 1;
    
    return `#O-${dateStr}-${orderNumber}`;
  };

  // Generate custom bill ID: #B-DDMMYYYY-N
  const generateBillId = async () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB').split('/').join(''); // DDMMYYYY
    
    // Count bills created today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    
    const q = query(
      collection(db, 'bills'),
      where('createdAt', '>=', startOfDay),
      where('createdAt', '<=', endOfDay)
    );
    const snapshot = await getDocs(q);
    const billNumber = snapshot.size + 1;
    
    return `#B-${dateStr}-${billNumber}`;
  };

  // Save bill
  const handleSaveBill = async () => {
    if ((billType === 'dine-in') && !selectedTable) {
      toast.error('Please select a table');
      return;
    }
    if (billItems.length === 0) {
      toast.error('Please add items to the bill');
      return;
    }

    setSaving(true);
    try {
      // Only send pendingKotQty > 0
      const itemsToOrder = billItems.filter(item => (item.pendingKotQty || 0) > 0);
      if (itemsToOrder.length === 0) {
        toast.error('No new items to send to KOT');
        setSaving(false);
        return;
      }

      // Create individual order for each item with pending quantity
      const updatedItemsWithOrders = await Promise.all(billItems.map(async (item) => {
        if ((item.pendingKotQty || 0) > 0) {
          // Generate unique order ID for this item
          const orderId = await generateOrderId();
          
          // Create order for this specific item
          const orderPayload = {
            orderId: orderId,
            billDocId: currentBillId || 'pending',
            customerName: customerName || 'Guest',
            itemId: item.id,
            itemName: item.name,
            itemPrice: item.price,
            quantity: item.pendingKotQty,
            subtotal: item.price * item.pendingKotQty,
            total: item.price * item.pendingKotQty,
            status: 'pending',
            type: billType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          if ((billType === 'dine-in') && selectedTable) {
            orderPayload.tableId = selectedTable.id;
            orderPayload.tableName = selectedTable.name;
          }
          
          const orderDoc = await addDoc(collection(db, 'orders'), orderPayload);
          
          // Return item with order ID attached
          return {
            ...item,
            kotSent: true,
            pendingKotQty: 0,
            orderIds: [...(item.orderIds || []), { orderId: orderId, orderDocId: orderDoc.id, quantity: item.pendingKotQty }]
          };
        }
        return item;
      }));

      const subtotal = calculateSubtotal();
      const total = calculateTotal();
      
      const billData = {
        customerName: customerName || 'Guest',
        items: updatedItemsWithOrders,
        subtotal: subtotal,
        discount: discount,
        total: total,
        status: 'open',
        type: billType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if ((billType === 'dine-in') && selectedTable) {
        billData.tableId = selectedTable.id;
        billData.tableName = selectedTable.name;
      }

      let billDocId = currentBillId;
      
      if (currentBillId) {
        await updateDoc(doc(db, 'bills', currentBillId), {
          ...billData,
          updatedAt: new Date().toISOString()
        });
      } else {
        const billId = await generateBillId();
        billData.billId = billId;
        const docRef = await addDoc(collection(db, 'bills'), billData);
        billDocId = docRef.id;
        setCurrentBillId(docRef.id);
        
        // Update all orders with the actual bill doc ID
        const orderUpdates = updatedItemsWithOrders
          .filter(item => item.orderIds && item.orderIds.length > 0)
          .flatMap(item => item.orderIds.map(order => order.orderDocId));
        
        await Promise.all(orderUpdates.map(orderDocId => 
          updateDoc(doc(db, 'orders', orderDocId), { billDocId: docRef.id })
        ));
      }
      
      setBillItems(updatedItemsWithOrders);
      fetchBills(1);
      fetchTotalBillsCount();
      
      toast.success(`${itemsToOrder.length} order(s) sent to KOT!`);
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error('Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  // Print bill
  const handlePrintBill = () => {
    if (billItems.length === 0) {
      toast.error('No items to print');
      return;
    }
    
    // Prepare bill data for thermal printing
    const billData = {
      billNo: currentBillId ? currentBillId.slice(-6).toUpperCase() : 'NEW',
      orderNo: currentBillId ? currentBillId.slice(-4).toUpperCase() : 'NEW',
      kotNo: '1', // Placeholder or track KOT count
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      type: billType === 'dine-in' ? 'Dine In' : 'Take Away',
      table: selectedTable ? selectedTable.shortCode : 'N/A',
      user: 'Admin', // Dynamic user if available
      items: billItems,
      totalAmount: calculateTotal(),
      totalQty: billItems.reduce((sum, item) => sum + item.quantity, 0)
    };

    // We use a small timeout to ensure state/DOM is ready if needed
    // But since we are using window.print() and CSS visibility, it should be fine
    window.print();
  };

  // Handle payment
  const handlePayment = () => {
    if (!currentBillId) {
      toast.error('Please save the bill first');
      return;
    }
    if (billItems.length === 0) {
      toast.error('No items in the bill');
      return;
    }
    setAmountReceived(calculateTotal().toString());
    setShowPaymentModal(true);
  };

  // Complete payment
  const completePayment = async () => {
    const total = calculateTotal();
    const received = parseFloat(amountReceived) || 0;

    if (received < total) {
      toast.error('Amount received is less than total');
      return;
    }

    setProcessing(true);
    try {
      await updateDoc(doc(db, 'bills', currentBillId), {
        status: 'paid',
        paymentMethod,
        amountReceived: received,
        change: received - total,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Cancel associated order if exists
      if (currentOrderId) {
        await updateDoc(doc(db, 'orders', currentOrderId), {
          status: 'completed',
          updatedAt: new Date().toISOString()
        });
      }

      toast.success('Payment completed successfully!');
      setShowPaymentModal(false);
      
      // Reset form
      resetBillForm();
      fetchBills(1);
      fetchTotalBillsCount();
    } catch (error) {
      console.error('Error completing payment:', error);
      toast.error('Failed to complete payment');
    } finally {
      setProcessing(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!currentBillId) {
      toast.error('No active bill to cancel');
      return;
    }

    if (!confirm('Are you sure you want to cancel all orders for this bill?')) {
      return;
    }

    try {
      // Get all order IDs from bill items
      const allOrderIds = billItems
        .filter(item => item.orderIds && item.orderIds.length > 0)
        .flatMap(item => item.orderIds.map(order => order.orderDocId));

      // Cancel all orders
      if (allOrderIds.length > 0) {
        await Promise.all(allOrderIds.map(orderDocId =>
          updateDoc(doc(db, 'orders', orderDocId), {
            status: 'cancelled',
            updatedAt: new Date().toISOString()
          })
        ));
      }

      // Update bill status
      await updateDoc(doc(db, 'bills', currentBillId), {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });

      toast.success('All orders cancelled successfully');
      resetBillForm();
      fetchBills(1);
    } catch (error) {
      console.error('Error cancelling orders:', error);
      toast.error('Failed to cancel orders');
    }
  };

  // Reset bill form
  const resetBillForm = () => {
    setSelectedTable(null);
    setSelectedFloor('all');
    setSelectedCategory('');
    setBillItems([]);
    setCustomerName('');
    setSearchQuery('');
    setCurrentBillId(null);
    setCurrentOrderId(null);
    setAmountReceived('');
    setPaymentMethod('cash');
    setBillType('dine-in');
    setDiscount(0);
  };

  // Load bill for editing
  const loadBillForEditing = async (bill) => {
    // Scroll to add bill section
    setShowAddBill(true);
    setTimeout(() => {
      if (addBillSectionRef.current) {
        addBillSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    // Load bill data
    setBillItems(bill.items || []);
    setCustomerName(bill.customerName || '');
    setCurrentBillId(bill.id);
    setCurrentOrderId(bill.orderId || null);
    setBillType(bill.type || 'dine-in');
    setDiscount(bill.discount || 0);

    // Load table if dine-in
    if (bill.type === 'dine-in' && bill.tableId) {
      const table = tables.find(t => t.id === bill.tableId);
      if (table) {
        setSelectedTable(table);
        const tableFloor = floors.find(f => f.id === table.floorId);
        if (tableFloor) {
          setSelectedFloor(tableFloor.id);
        }
      }
    }

    toast.success('Bill loaded for editing');
  };

  // Pagination
  const totalPages = Math.ceil(totalBills / ITEMS_PER_PAGE);
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchBills(page);
  };

  const getFoodTypeColor = (type) => {
    switch(type) {
      case 'veg': return 'bg-green-500';
      case 'nonveg': return 'bg-red-500';
      case 'egg': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        {showAddBill && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Bill For</span>
              <button
                type="button"
                onClick={() => setBillType('dine-in')}
                className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${billType === 'dine-in' ? 'bg-[#ec2b25] text-white border-[#ec2b25]' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
              >
                Dine In
              </button>
              <button
                type="button"
                onClick={() => setBillType('take-away')}
                className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${billType === 'take-away' ? 'bg-[#ec2b25] text-white border-[#ec2b25]' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
              >
                Take Away
              </button>
              <button
                type="button"
                onClick={() => setBillType('swiggy')}
                className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${billType === 'swiggy' ? 'bg-[#ec2b25] text-white border-[#ec2b25]' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
              >
                Swiggy
              </button>
              <button
                type="button"
                onClick={() => setBillType('zomato')}
                className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${billType === 'zomato' ? 'bg-[#ec2b25] text-white border-[#ec2b25]' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
              >
                Zomato
              </button>
            </div>
            <button
              onClick={() => setShowAddBill(!showAddBill)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#ec2b25] text-white hover:bg-[#d12620] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddBill ? 'Close' : 'Add Bill'}</span>
            </button>
          </div>
        )}
        {!showAddBill && (
          <button
            onClick={() => setShowAddBill(!showAddBill)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#ec2b25] text-white hover:bg-[#d12620] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddBill ? 'Close' : 'Add Bill'}</span>
          </button>
        )}
      </div>

      {/* Add Bill Section */}
      {showAddBill && (
        <div ref={addBillSectionRef} className="bg-white border border-gray-200 p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Column 1: Tables Selection or Customer Name */}
            {billType === 'dine-in' && (
              <div className="border-r border-gray-200 pr-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Select Table</h3>
                
                {/* Customer Name */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name (Optional)"
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25] text-sm"
                  />
                </div>

                {/* Floor Filter */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedFloor('all')}
                      className={`px-3 py-1 text-sm border cursor-pointer ${
                        selectedFloor === 'all' ? 'bg-[#ec2b25] text-white border-[#ec2b25]' : 'border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      All
                    </button>
                    {floors.map(floor => (
                      <button
                        key={floor.id}
                        onClick={() => setSelectedFloor(floor.id)}
                        className={`px-3 py-1 text-sm border cursor-pointer ${
                          selectedFloor === floor.id ? 'bg-[#ec2b25] text-white border-[#ec2b25]' : 'border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {floor.shortCode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tables Grid */}
                <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                  {filteredTables.map(table => {
                    const hasOpenBill = bills.some(bill => bill.tableId === table.id && bill.status === 'open');
                    return (
                      <button
                        key={table.id}
                        onClick={() => handleTableSelect(table)}
                        className={`aspect-square border-2 flex items-center justify-center cursor-pointer transition-colors relative ${
                          selectedTable?.id === table.id
                            ? 'border-[#ec2b25] bg-[#ec2b25] text-white'
                            : hasOpenBill
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="font-mono font-bold">{table.shortCode}</span>
                        {hasOpenBill && selectedTable?.id !== table.id && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {selectedTable && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200">
                    <p className="text-sm text-gray-600">Selected Table:</p>
                    <p className="font-medium text-gray-900">{selectedTable.name} ({selectedTable.shortCode})</p>
                  </div>
                )}
              </div>
            )}
            {(billType === 'take-away' || billType === 'swiggy' || billType === 'zomato') && (
              <div className="pr-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Details</h3>
                {/* Customer Name for Take Away/Swiggy/Zomato */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name (Optional)"
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25] text-sm"
                  />
                </div>
              </div>
            )}

            {/* Column 2: Items Selection */}
            <div className="border-r border-gray-200 pr-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Select Items</h3>
              
              {/* Category Dropdown */}
              <div className="mb-4">
                <div className="relative">
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full px-3 py-2 border border-gray-200 flex items-center justify-between hover:border-gray-300 cursor-pointer"
                  >
                    <span className="text-sm">
                      {selectedCategoryData 
                        ? `${selectedCategoryData.emoji} ${selectedCategoryData.name}` 
                        : 'All Categories'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  {showCategoryDropdown && (
                    <div className="absolute w-full mt-1 bg-white border border-gray-200 z-10 max-h-64">
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="w-full pl-8 pr-2 py-1 border border-gray-200 focus:outline-none focus:border-[#ec2b25] text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto max-h-48">
                        <button
                          onClick={() => {
                            setSelectedCategory('');
                            setShowCategoryDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm cursor-pointer"
                        >
                          All Categories
                        </button>
                        {searchFilteredCategories.map(category => (
                          <button
                            key={category.id}
                            onClick={() => {
                              setSelectedCategory(category.id);
                              setShowCategoryDropdown(false);
                              setSearchQuery('');
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 cursor-pointer"
                          >
                            <span>{category.emoji}</span>
                            <span className="text-sm">{category.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div ref={itemsListRef} className="space-y-2 max-h-96 overflow-y-auto">
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addItemToBill(item)}
                    className="w-full p-3 border border-gray-200 hover:border-[#ec2b25] hover:bg-gray-50 text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getFoodTypeColor(item.type)}`}></div>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{item.shortCode}</p>
                        </div>
                      </div>
                      <span className="font-bold text-sm">₹{item.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Column 3: Bill Summary */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Bill Summary</h3>
              
              <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
                {billItems.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No items added</p>
                ) : (
                  billItems.map(item => (
                    <div key={item.id} className="p-3 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {item.name} {item.kotSent && <span className='ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs'>KOT</span>}
                          </p>
                          <p className="text-xs text-gray-500">₹{item.price} each</p>
                          {item.orderIds && item.orderIds.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.orderIds.map((order, idx) => (
                                <span key={idx} className="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                  {order.orderId}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeItemFromBill(item.id)}
                          className="p-1 hover:bg-red-50 text-red-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 border border-gray-300 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 border border-gray-300 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-bold text-sm">₹{item.price * item.quantity}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Subtotal, Discount, and Total */}
              <div className="border-t-2 border-gray-900 pt-4 mb-4">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-medium">₹{calculateSubtotal()}</span>
                </div>
                
                {/* Discount Input */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Discount (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-20 px-2 py-1 border border-gray-200 focus:outline-none focus:border-[#ec2b25] text-sm text-right"
                  />
                </div>
                
                {discount > 0 && (
                  <div className="flex items-center justify-between mb-2 text-sm text-green-600">
                    <span>Discount Amount:</span>
                    <span>- ₹{((calculateSubtotal() * discount) / 100).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-2 pt-2 border-t border-gray-300">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-2xl font-bold text-[#ec2b25]">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  onClick={handleSaveBill}
                  disabled={saving}
                  className="flex flex-col items-center justify-center px-2 py-3 bg-[#ec2b25] text-white hover:bg-[#d12620] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mb-1" />
                      <span className="text-xs">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mb-1" />
                      <span className="text-xs">Save</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrintBill}
                  className="flex flex-col items-center justify-center px-2 py-3 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors cursor-pointer"
                >
                  <Printer className="w-5 h-5 mb-1" />
                  <span className="text-xs">Print</span>
                </button>
                <button
                  onClick={handlePayment}
                  disabled={!currentBillId}
                  className="flex flex-col items-center justify-center px-2 py-3 bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-5 h-5 mb-1" />
                  <span className="text-xs">Payment</span>
                </button>
              </div>
              
              {/* Cancel Order Button */}
              {currentBillId && billItems.some(item => item.orderIds && item.orderIds.length > 0) && (
                <button
                  onClick={handleCancelOrder}
                  className="w-full mt-2 flex items-center justify-center space-x-2 px-4 py-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm font-medium">Cancel All Orders</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bills List */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Bills</h2>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : bills.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No bills yet</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bills.map(bill => {
                const getBillTypeColor = (type) => {
                  switch(type) {
                    case 'dine-in': return 'bg-blue-100 text-blue-800 border-blue-300';
                    case 'take-away': return 'bg-purple-100 text-purple-800 border-purple-300';
                    case 'swiggy': return 'bg-orange-100 text-orange-800 border-orange-300';
                    case 'zomato': return 'bg-red-100 text-red-800 border-red-300';
                    default: return 'bg-gray-100 text-gray-800 border-gray-300';
                  }
                };
                
                const getBillTypeLabel = (type) => {
                  switch(type) {
                    case 'dine-in': return 'Dine In';
                    case 'take-away': return 'Take Away';
                    case 'swiggy': return 'Swiggy';
                    case 'zomato': return 'Zomato';
                    default: return type;
                  }
                };
                
                return (
                  <div 
                    key={bill.id} 
                    onClick={() => bill.status === 'open' && loadBillForEditing(bill)}
                    className={`border-2 border-gray-200 bg-white hover:shadow-lg transition-all ${bill.status === 'open' ? 'cursor-pointer hover:border-[#ec2b25]' : 'cursor-default'}`}
                  >
                    {/* Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 text-xs font-bold border ${getBillTypeColor(bill.type)}`}>
                            {getBillTypeLabel(bill.type)}
                          </span>
                          {bill.billId && (
                            <span className="text-xs font-mono font-semibold text-gray-700">{bill.billId}</span>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-bold uppercase ${
                          bill.status === 'open' 
                            ? 'bg-orange-500 text-white' 
                            : bill.status === 'paid' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-500 text-white'
                        }`}>
                          {bill.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          {bill.tableName && <p className="font-bold text-gray-900">{bill.tableName}</p>}
                          <p className="text-sm text-gray-600">{bill.customerName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="px-4 py-3 max-h-40 overflow-y-auto">
                      <div className="space-y-1.5">
                        {bill.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 border border-gray-200">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${getFoodTypeColor(item.type)}`}></div>
                              <span className="font-medium text-gray-900">{item.name}</span>
                              <span className="text-xs text-gray-500">x{item.quantity}</span>
                            </div>
                            <span className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bill Details */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium text-gray-900">₹{bill.subtotal?.toFixed(2)}</span>
                        </div>
                        {bill.discount > 0 && (
                          <div className="flex items-center justify-between text-sm text-green-600">
                            <span>Discount ({bill.discount}%):</span>
                            <span>- ₹{((bill.subtotal * bill.discount) / 100).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                          <span className="text-base font-bold text-gray-900">Total:</span>
                          <span className="text-xl font-bold text-[#ec2b25]">₹{bill.total?.toFixed(2)}</span>
                        </div>
                        {bill.status === 'paid' && bill.paymentMethod && (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Payment:</span>
                              <span className="font-medium uppercase">{bill.paymentMethod}</span>
                            </div>
                            {bill.amountReceived && (
                              <>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">Received:</span>
                                  <span className="font-medium">₹{bill.amountReceived}</span>
                                </div>
                                {bill.change > 0 && (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">Change:</span>
                                    <span className="font-medium text-green-600">₹{bill.change.toFixed(2)}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 bg-white border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(bill.createdAt).toLocaleString('en-IN')}</span>
                        {bill.status === 'paid' && bill.paidAt && (
                          <span className="text-green-600 font-medium">Paid: {new Date(bill.paidAt).toLocaleTimeString('en-IN')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Complete Payment</h2>
              
              <div className="space-y-4">
                {/* Bill Summary */}
                <div className="bg-gray-50 border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Table:</span>
                    <span className="font-medium">{selectedTable?.name}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Customer:</span>
                    <span className="font-medium">{customerName || 'Guest'}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Items:</span>
                    <span className="font-medium">{billItems.length}</span>
                  </div>
                  <div className="border-t border-gray-300 mt-3 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">Total:</span>
                      <span className="font-bold text-2xl text-[#ec2b25]">₹{calculateTotal()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`px-4 py-2 border cursor-pointer ${
                        paymentMethod === 'cash'
                          ? 'border-[#ec2b25] bg-[#ec2b25] text-white'
                          : 'border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`px-4 py-2 border cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'border-[#ec2b25] bg-[#ec2b25] text-white'
                          : 'border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Card
                    </button>
                    <button
                      onClick={() => setPaymentMethod('upi')}
                      className={`px-4 py-2 border cursor-pointer ${
                        paymentMethod === 'upi'
                          ? 'border-[#ec2b25] bg-[#ec2b25] text-white'
                          : 'border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      UPI
                    </button>
                  </div>
                </div>

                {/* Amount Received */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Received
                  </label>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]"
                  />
                </div>

                {/* Change */}
                {amountReceived && parseFloat(amountReceived) >= calculateTotal() && (
                  <div className="bg-green-50 border border-green-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Change to return:</span>
                      <span className="font-bold text-green-700">
                        ₹{(parseFloat(amountReceived) - calculateTotal()).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={completePayment}
                  disabled={processing || !amountReceived || parseFloat(amountReceived) < calculateTotal()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Complete Payment</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Bill for Printing */}
      <ThermalBill
        ref={printRef}
        billData={{
          billNo: currentBillId ? currentBillId.slice(-6).toUpperCase() : 'NEW',
          orderNo: currentBillId ? currentBillId.slice(-4).toUpperCase() : 'NEW',
          kotNo: '1',
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
          type: billType === 'dine-in' ? 'Dine In' : 'Take Away',
          table: selectedTable ? selectedTable.shortCode : 'N/A',
          user: 'Admin',
          items: billItems,
          totalAmount: calculateTotal(),
          totalQty: billItems.reduce((sum, item) => sum + item.quantity, 0)
        }}
      />
    </div>
  );
};

export default BillingPage;
