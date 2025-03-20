import React, { useEffect, useState } from 'react';
import { UserName, USERS } from '../types';
import { getSelectedUser, setSelectedUser } from '../utils/localStorage';
import { User } from 'lucide-react';

interface UserSelectorProps {
  onUserChange: (username: UserName) => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ onUserChange }) => {
  const [selectedUser, setSelectedUserState] = useState<UserName>(() => getSelectedUser());

  useEffect(() => {
    // Initialize from localStorage when component mounts
    setSelectedUserState(getSelectedUser());
  }, []);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUser = e.target.value as UserName;
    setSelectedUserState(newUser);
    setSelectedUser(newUser); // Save to localStorage
    onUserChange(newUser);
  };

  return (
    <div className="flex items-center justify-center mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
      <div className="flex items-center space-x-3">
        <User className="h-6 w-6 text-blue-500" />
        <span className="font-medium text-gray-700">Current User:</span>
        <select
          value={selectedUser}
          onChange={handleUserChange}
          className="ml-2 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          {USERS.map((user) => (
            <option key={user} value={user}>
              {user}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
