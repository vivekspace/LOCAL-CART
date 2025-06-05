import { useState } from 'react';

export default function ApplicationCard({ application, onStatusChange }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  return (
    <>
      <div className="grid grid-cols-12 p-4 border-b items-center">
        <div className="col-span-3 font-medium">{application.businessName}</div>
        <div className="col-span-2">{application.owner}</div>
        <div className="col-span-2">{application.category}</div>
        <div className="col-span-2">{application.submitted}</div>
        <div className="col-span-2">
          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[application.status]}`}>
            {application.status}
          </span>
        </div>
        <div className="col-span-1 flex justify-end space-x-2">
          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="p-1 text-gray-500 hover:text-indigo-600"
          >
            👁️
          </button>
          {application.status === 'pending' && (
            <div className="flex space-x-1">
              <button 
                onClick={() => onStatusChange(application.id, 'approved')}
                className="p-1 text-green-500 hover:text-green-700"
              >
                ✓
              </button>
              <button 
                onClick={() => onStatusChange(application.id, 'rejected')}
                className="p-1 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{application.businessName}</h3>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Business Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Owner:</span> {application.owner}</p>
                    <p><span className="font-medium">Email:</span> {application.email}</p>
                    <p><span className="font-medium">Category:</span> {application.category}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Documents</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {application.documents.map((doc, index) => (
                      <div key={index} className="border p-2 rounded flex items-center">
                        <span className="mr-2">📄</span>
                        <span className="truncate">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {application.status === 'pending' && (
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      onStatusChange(application.id, 'rejected');
                      setIsPreviewOpen(false);
                    }}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      onStatusChange(application.id, 'approved');
                      setIsPreviewOpen(false);
                    }}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}