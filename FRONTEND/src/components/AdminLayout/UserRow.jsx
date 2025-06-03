// UserRow.jsx
import { useState } from 'react';

export default function UserRow({  onToggleBlock }) {
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  
  const user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    lastActive: user.lastActive || 'N/A',
    transactions: user.transactions || 0,
    status: user.status || 'active',
  }
  const isActive = user.status === 'active';
  const isBlocked = user.status === 'blocked';
  const isVendor = user.role === 'vendor';
  const isAdmin = user.role === 'admin';
  const isSuperAdmin = user.role === 'superadmin';
  const isUser = user.role === 'user';
  



  const handleBlock = () => {
    onToggleBlock(user.id);
    setIsBlockModalOpen(false);
    setBlockReason('');
  };

  return (
    <>
      <div className="grid grid-cols-12 p-4 border-b items-center">
        <div className="col-span-3 flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium">{user.name}</div>
          </div>
        </div>
        <div className="col-span-3 text-sm text-gray-600">{user.email}</div>
        <div className="col-span-1">
          <span className={`px-2 py-1 rounded-full text-xs ${
            user.role === 'vendor' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {user.role}
          </span>
        </div>
        <div className="col-span-2 text-sm">{user.lastActive}</div>
        <div className="col-span-1 text-center">{user.transactions}</div>
        <div className="col-span-2 flex items-center justify-between">
          <span className={`px-2 py-1 rounded-full text-xs ${
            user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {user.status}
          </span>
          <button 
            onClick={() => setIsBlockModalOpen(true)}
            className={`px-3 py-1 rounded text-sm ${
              user.status === 'active' 
                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {user.status === 'active' ? 'Block' : 'Unblock'}
          </button>
        </div>
      </div>

      {/* Block Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">
                  {user.status === 'active' ? 'Block User' : 'Unblock User'}
                </h3>
                <button 
                  onClick={() => setIsBlockModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {user.status === 'active' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for blocking
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  >
                    <option value="">Select a reason</option>
                    <option value="spam">Spam or fake account</option>
                    <option value="abuse">Abusive behavior</option>
                    <option value="policy">Policy violation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
              
              <p className="mb-4">
                {user.status === 'active'
                  ? `Are you sure you want to block ${user.name}? They will lose access to their account.`
                  : `Are you sure you want to unblock ${user.name}? They will regain access to their account.`}
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlock}
                  className={`px-4 py-2 rounded-md text-white ${
                    user.status === 'active' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {user.status === 'active' ? 'Confirm Block' : 'Confirm Unblock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}