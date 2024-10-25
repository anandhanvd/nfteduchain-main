import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './logo.png';
import { connectWallet } from './utils/wallet';
import { addUserToDatabase } from './utils/database';

const LoginPage = () => {
  const [userType, setUserType] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!userType) {
      alert('Please select a user type');
      return;
    }
    if (!name) {
      alert(`Please enter ${userType === 'student' ? 'student name' : userType === 'institution' ? 'institution name' : 'verifier name'}`);
      return;
    }

    setIsLoading(true);

    try {
      const { walletAddress } = await connectWallet();
      await addUserToDatabase(walletAddress, userType, name);
      alert('Login successful and user data stored!');
      // Redirect based on user type
      if (userType === 'student') {
        navigate('/student-dashboard');
      }
      if (userType === 'institution') {
        navigate('/institution-dashboard');
      }
      if (userType === 'verifier') {
        navigate('/verifier-dashboard');
      }
      // Add other user type redirections here
    } catch (error) {
      console.error('Login or database error:', error);
      alert('Error logging in or saving data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left section */}
      <div className="w-1/2 flex flex-col items-center justify-center bg-white p-12">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold mb-6 text-center">Welcome</h1>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select user type</option>
              <option value="student">Student</option>
              <option value="institution">Institution</option>
              <option value="verifier">Verifier</option>
            </select>
          </div>
           {/* Conditional input field for name based on selected userType */}
           {userType && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {userType === 'student' ? 'Student Name' : userType === 'institution' ? 'Institution Name' : 'Verifier Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter ${userType === 'student' ? 'student name' : userType === 'institution' ? 'institution name' : 'verifier name'}`}
              />
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login with MetaMask Wallet'}
          </button>
        </div>
      </div>

      {/* Right section with image */}
      <div className="w-1/2 bg-blue-600 flex items-center justify-center">
        <img
          src={logo} // Update this path with the actual path to your image
          alt="EduChain Image"
          className="w-[23rem] h-[23rem] object-contain"
        />
      </div>
    </div>
  );
};

export default LoginPage;
