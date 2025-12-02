import React, { useState, useEffect } from 'react';
import { Plus, SquarePen, Trash2, Loader2 } from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import AddCategoryModal from '../components/AddCategoryModal';
import AddItemModal from '../components/AddItemModal';
import toast from 'react-hot-toast';

const MenuPage = () => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: '', id: '', name: '' });

  // Fetch categories from Firestore
  const fetchCategories = async () => {
    try {
      const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  };

  // Fetch items from Firestore
  const fetchItems = async () => {
    try {
      const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const itemsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, []);

  // Save category to Firestore
  const handleSaveCategory = async (categoryIdOrData, categoryData) => {
    try {
      if (typeof categoryIdOrData === 'string') {
        // Edit mode: categoryIdOrData is the ID
        await updateDoc(doc(db, 'categories', categoryIdOrData), categoryData);
        toast.success('Category updated successfully!');
      } else {
        // Add mode: categoryIdOrData is the data
        await addDoc(collection(db, 'categories'), categoryIdOrData);
        toast.success('Category added successfully!');
      }
      fetchCategories();
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  // Delete category from Firestore
  const handleDeleteCategory = async (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    setDeleteConfirm({
      show: true,
      type: 'category',
      id: categoryId,
      name: category ? `${category.emoji} ${category.name}` : 'this category'
    });
  };

  // Confirm delete category
  const confirmDeleteCategory = async () => {
    try {
      await deleteDoc(doc(db, 'categories', deleteConfirm.id));
      fetchCategories();
      if (selectedCategory === deleteConfirm.id) {
        setSelectedCategory('all');
      }
      toast.success('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setDeleteConfirm({ show: false, type: '', id: '', name: '' });
    }
  };

  // Save item to Firestore
  const handleSaveItem = async (itemIdOrData, itemData) => {
    try {
      if (typeof itemIdOrData === 'string') {
        // Edit mode: itemIdOrData is the ID
        await updateDoc(doc(db, 'items', itemIdOrData), itemData);
        toast.success('Item updated successfully!');
      } else {
        // Add mode: itemIdOrData is the data
        await addDoc(collection(db, 'items'), itemIdOrData);
        toast.success('Item added successfully!');
      }
      fetchItems();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    }
  };

  // Delete item from Firestore
  const handleDeleteItem = async (itemId) => {
    const item = items.find(itm => itm.id === itemId);
    setDeleteConfirm({
      show: true,
      type: 'item',
      id: itemId,
      name: item ? item.name : 'this item'
    });
  };

  // Confirm delete item
  const confirmDeleteItem = async () => {
    try {
      await deleteDoc(doc(db, 'items', deleteConfirm.id));
      fetchItems();
      toast.success('Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setDeleteConfirm({ show: false, type: '', id: '', name: '' });
    }
  };

  // Filter items based on selected category
  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.categoryId === selectedCategory);

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
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#ec2b25] text-white hover:bg-[#d12620] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => setShowItemModal(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-[#ec2b25] text-[#ec2b25] hover:bg-[#ec2b25] hover:text-white transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white p-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Categories</h2>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 border transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#ec2b25] text-white border-[#ec2b25]'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <div
                key={category.id}
                className={`px-4 py-2 border transition-colors flex items-center justify-between ${
                  selectedCategory === category.id
                    ? 'bg-[#ec2b25] text-white border-[#ec2b25]'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <span>{category.emoji}</span>
                  <span>{category.name}</span>
                </button>
                <div className="flex items-center space-x-1">
                  <div className={`h-6 w-px mx-2 ${
                    selectedCategory === category.id ? 'bg-white bg-opacity-30' : 'bg-gray-300'
                  }`}></div>
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setShowCategoryModal(true);
                    }}
                    className={`p-1 hover:bg-opacity-20 hover:bg-black cursor-pointer ${
                      selectedCategory === category.id ? 'text-white' : 'text-gray-600'
                    }`}
                    title="Edit category"
                  >
                    <SquarePen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className={`p-1 hover:bg-opacity-20 hover:bg-black cursor-pointer ${
                      selectedCategory === category.id ? 'text-white' : 'text-red-600'
                    }`}
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No categories yet. Click "Add Category" to create one.
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="bg-white p-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Menu Items</h2>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {selectedCategory === 'all' 
              ? 'No items yet. Click "Add Item" to create one.'
              : 'No items in this category.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const category = categories.find(cat => cat.id === item.categoryId);
              return (
                <div
                  key={item.id}
                  className="border border-gray-200 p-4 hover:border-gray-300 transition-colors relative"
                >
                  <div className="absolute top-2 right-2 flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setShowItemModal(true);
                      }}
                      className="p-1 hover:bg-gray-100 text-gray-600 cursor-pointer"
                      title="Edit item"
                    >
                      <SquarePen className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 hover:bg-red-50 text-red-600 cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-start justify-between mb-2 pr-12">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getFoodTypeColor(item.type)}`}></div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-mono">{item.shortCode}</span>
                      <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
                    </div>
                    {category && (
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <span>{category.emoji}</span>
                        <span>{category.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        editData={editingCategory}
      />
      <AddItemModal
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        categories={categories}
        editData={editingItem}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <span className="font-semibold">{deleteConfirm.name}</span>?
              {deleteConfirm.type === 'category' && ' This will not delete items in this category.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, type: '', id: '', name: '' })}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={deleteConfirm.type === 'category' ? confirmDeleteCategory : confirmDeleteItem}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
