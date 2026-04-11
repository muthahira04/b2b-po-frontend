import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left */}
      <div>
        <h2 className="text-sm font-medium text-gray-500">
          Welcome back, <span className="text-gray-900 font-semibold">{user?.name}</span>
        </h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="ml-2 p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;