// AdminSidebar.jsx
import { NavLink } from 'react-router-dom';

export default function AdminSidebar() {
  const navItems = [
    { name: 'Dashboard', icon: '📊', path: '/admin' },
    { name: 'Vendor Applications', icon: '📝', path: '/admin/applications' },
    { name: 'User Management', icon: '👥', path: '/admin/users' },
    { name: 'Reports', icon: '📈', path: '/admin/reports' },
  ];

  return (
    <div className="w-64 bg-white shadow-md">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-indigo-600">LocalCart Admin</h1>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center p-3 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100'}`
                }
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}