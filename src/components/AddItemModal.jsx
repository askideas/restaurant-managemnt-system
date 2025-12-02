import React, { useState } from 'react';
import { X, Loader2, ChevronDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const FOOD_TYPES = [
  { value: 'veg', label: 'Vegetarian', color: 'bg-green-500' },
  { value: 'nonveg', label: 'Non-Vegetarian', color: 'bg-red-500' },
  { value: 'egg', label: 'Egg', color: 'bg-yellow-500' }
];

const AddItemModal = ({ isOpen, onClose, onSave, categories, editData }) => {
  const [itemName, setItemName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [selectedType, setSelectedType] = useState('veg');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Update form when editData changes
  React.useEffect(() => {
    if (editData) {
      setItemName(editData.name || '');
      setShortCode(editData.shortCode || '');
      setSelectedType(editData.type || 'veg');
      setPrice(editData.price?.toString() || '');
      setSelectedCategory(editData.categoryId || '');
    } else {
      setItemName('');
      setShortCode('');
      setSelectedType('veg');
      setPrice('');
      setSelectedCategory('');
    }
    setSearchQuery('');
  }, [editData, isOpen]);

  const handleSave = async () => {
    if (!itemName.trim()) {
      toast.error('Please enter an item name');
      return;
    }
    if (!shortCode.trim()) {
      toast.error('Please enter a short code');
      return;
    }
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setLoading(true);
    try {
      const itemData = {
        name: itemName,
        shortCode: shortCode.toUpperCase(),
        type: selectedType,
        price: parseFloat(price),
        categoryId: selectedCategory,
      };

      if (editData) {
        // Editing existing item
        await onSave(editData.id, itemData);
      } else {
        // Adding new item
        itemData.createdAt = new Date().toISOString();
        await onSave(itemData);
      }

      // Reset form
      setItemName('');
      setShortCode('');
      setSelectedType('veg');
      setPrice('');
      setSelectedCategory('');
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter categories based on search query
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{editData ? 'Edit Item' : 'Add Item'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]"
              placeholder="Enter item name"
            />
          </div>

          {/* Item Short Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Short Code
            </label>
            <input
              type="text"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]"
              placeholder="Enter short code (e.g., CH01)"
              maxLength={10}
            />
          </div>

          {/* Category Dropdown with Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full px-4 py-2 border border-gray-200 flex items-center justify-between hover:border-gray-300 cursor-pointer"
              >
                <span className="text-gray-700">
                  {selectedCategoryData 
                    ? `${selectedCategoryData.emoji} ${selectedCategoryData.name}` 
                    : 'Select a category'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              
              {showDropdown && (
                <div className="absolute w-full mt-1 bg-white border border-gray-200 z-10 max-h-64 flex flex-col">
                  {/* Search Input */}
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search categories..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25] text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  {/* Category List */}
                  <div className="overflow-y-auto">
                    {filteredCategories.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        {searchQuery ? 'No categories found' : 'No categories available'}
                      </div>
                    ) : (
                      filteredCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setShowDropdown(false);
                            setSearchQuery('');
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 cursor-pointer ${
                            selectedCategory === category.id ? 'bg-gray-50' : ''
                          }`}
                        >
                          <span>{category.emoji}</span>
                          <span className="text-sm text-gray-700">{category.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#ec2b25]"
              placeholder="Enter price"
              min="0"
              step="0.01"
            />
          </div>

          {/* Food Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Food Type
            </label>
            <div className="space-y-2">
              {FOOD_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="foodType"
                    value={type.value}
                    checked={selectedType === type.value}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{type.label}</span>
                  <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#ec2b25] text-white hover:bg-[#d12620] transition-colors cursor-pointer flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;
