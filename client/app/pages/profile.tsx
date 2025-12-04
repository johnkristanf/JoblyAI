import  { useState } from 'react';
import { Check, X, Edit2, User, Mail, Loader2 } from 'lucide-react';
import { useUserStore } from '~/store/userStore';



const ProfilePage = () => {
  const {user, loading, setLoading} = useUserStore();

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  const startEdit = (field, currentValue) => {
    setEditingField(field);
    setTempValue(currentValue || '');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  const saveEdit = async (field) => {
    if (tempValue.trim() === user[field]) {
      cancelEdit();
      return;
    }

    setLoading(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update user data
      setUser(prev => ({
        ...prev,
        [field]: tempValue.trim()
      }));
      
      setEditingField(null);
      setTempValue('');
    } catch (error) {
      console.error('Failed to update:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    
    // Simulate upload
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser(prev => ({
          ...prev,
          avatar_url: reader.result
        }));
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload:', error);
      setLoading(false);
    }
  };

    // Show a loading indicator overlay when loading is true
    if (loading) {
        return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-lg text-gray-500 font-medium">
                Loading profile...
            </div>
        </div>
        );
    }

    if ( !loading && !user ) {
        return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-lg text-gray-500 font-medium">
            No user data found.
            </div>
        </div>
        );
    }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full mx-auto px-4">
        <div className="flex flex-col mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <h2 className="text-md text-blue-600 font-normal mt-1">Your personal information and settings</h2>
      </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 ">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-24 rounded-t-xl"></div>
          
          {/* Avatar Section */}
          <div className="px-6 sm:px-8 pb-5">
            <div className="flex flex-col items-center -mt-12">
              <div className="relative group">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || 'User'}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-3xl border-4 border-white shadow-lg">
                    {user.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                
                {/* Upload overlay */}
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={loading}
                  />
                  {loading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Edit2 className="w-6 h-6 text-white" />
                  )}
                </label>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">Click avatar to change</p>
            </div>
          </div> 

          {/* Editable Fields */}
          <div className="mt-6 space-y-6 px-5">
            {/* Full Name */}
            <div className="group">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Full Name
                </label>
                {editingField !== 'full_name' && (
                  <button
                    onClick={() => startEdit('full_name', user.full_name)}
                    className="text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={loading}
                  >
                    <Edit2 className="w-5 h-5 hover:cursor-pointer hover:opacity-75" />
                  </button>
                )}
              </div>
              
              {editingField === 'full_name' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="flex-1 px-3 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    autoFocus
                    disabled={loading}
                  />
                  <button
                    onClick={() => saveEdit('full_name')}
                    disabled={loading}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={loading}
                    className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-gray-900 text-sm">
                    {user.full_name || 'Not set'}
                  </p>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="group">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </label>
                {editingField !== 'email' && (
                  <button
                    onClick={() => startEdit('email', user.email)}
                    className="text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={loading}
                  >
                    <Edit2 className="w-5 h-5 hover:cursor-pointer hover:opacity-75" />
                  </button>
                )}
              </div>
              
              {editingField === 'email' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="flex-1 px-3 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    autoFocus
                    disabled={loading}
                  />
                  <button
                    onClick={() => saveEdit('email')}
                    disabled={loading}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={loading}
                    className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-gray-900 text-sm">
                    {user.email || 'Not set'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100 mx-5 mb-8">
            <p className="text-xs text-blue-700">
              <strong>Tip:</strong> Click the edit icon next to any field to update your information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;