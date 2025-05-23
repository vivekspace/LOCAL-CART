// UserManagement.jsx
import { useState } from 'react';
import UserRow from './UserRow';

const mockUsers = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "customer",
    lastActive: "2023-05-20",
    status: "active",
    transactions: 12
  },
  {
    id: 2,
    name: "Bob's Hardware",
    email: "bob@hardware.com",
    role: "vendor",
    lastActive: "2023-05-18",
    status: "blocked",
    transactions: 45
  },
  // More users...
];

export default function UserManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });

  const filteredUsers = users.filter(user => {
    return (
      (filters.role === 'all' || user.role === filters.role) &&
      (filters.status === 'all' || user.status === filters.status) &&
      (filters.search === '' || 
       user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
       user.email.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  const toggleBlockUser = (userId) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'blocked' : 'active' }
        : user
    ));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <input
          type="text"
          placeholder="Search users..."
          className="px-4 py-2 border rounded-md"
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
      </div>

      <div className="flex space-x-4 mb-6">
        <select
          className="px-4 py-2 border rounded-md"
          value={filters.role}
          onChange={(e) => setFilters({...filters, role: e.target.value})}
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="vendor">Vendors</option>
        </select>

        <select
          className="px-4 py-2 border rounded-md"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-12 bg-gray-100 p-4 font-medium">
          <div className="col-span-3">User</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-1">Role</div>
          <div className="col-span-2">Last Active</div>
          <div className="col-span-1">Transactions</div>
          <div className="col-span-2">Status</div>
        </div>
        
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <UserRow 
              key={user.id} 
              user={user} 
              onToggleBlock={toggleBlockUser} 
            />
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            No users match your filters
          </div>
        )}
      </div>
    </div>
  );
}