// VendorApplications.jsx
import { useState } from 'react';
import ApplicationCard from './ApplicationCard'

const mockApplications = [
  {
    id: 1,
    businessName: "Fresh Groceries",
    owner: "John Doe",
    email: "john@freshgroceries.com",
    category: "Food & Beverage",
    submitted: "2023-05-15",
    status: "pending",
    documents: ["license.pdf", "id_front.jpg"]
  },
  // More applications...
];



export default function VendorApplications() {
  const [applications, setApplications] = useState(mockApplications);
  const [selectedTab, setSelectedTab] = useState('pending');

  const filteredApplications = applications.filter(
    app => selectedTab === 'all' || app.status === selectedTab
  );

  const handleStatusChange = (id, newStatus) => {
    setApplications(applications.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    ));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Vendor Applications</h2>
        <div className="flex space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-md ${selectedTab === tab 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-12 bg-gray-100 p-4 font-medium">
          <div className="col-span-3">Business</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Submitted</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Actions</div>
        </div>
        
        {filteredApplications.length > 0 ? (
          filteredApplications.map((application) => (
            <ApplicationCard 
              key={application.id} 
              application={application}
              onStatusChange={handleStatusChange}
            />
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            No {selectedTab} applications found
          </div>
        )}
      </div>
    </div>
  );
}