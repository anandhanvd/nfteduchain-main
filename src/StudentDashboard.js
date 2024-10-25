import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { disconnectWallet } from './utils/wallet';
import { getFirestore, collection, getDocs, query, where, addDoc } from 'firebase/firestore';

const SectionButton = ({ title, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 mb-2 rounded-lg transition-colors ${
      isActive ? 'bg-blue-600 text-white' : 'bg-white text-blue-800 hover:bg-blue-100'
    }`}
  >
    {title}
  </button>
);

const courses = [
  'B Tech in Computer Science',
  'B Tech in Civil Engineering',
  'B Tech in Cyber Security'
];

const CertificateRequestForm = ({ onClose, institutions }) => {
  const [studentName, setStudentName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const db = getFirestore();
    try {
      const institution = institutions.find(inst => inst.id === selectedInstitution);
      
      if (!institution) {
        console.error('Selected institution not found');
        return;
      }

      const requestData = {
        studentName,
        registrationNumber,
        institutionId: selectedInstitution,
        institutionName: institution.name,
        course: selectedCourse,
        walletAddress,
        status: 'pending',
        createdAt: new Date()
      };

      console.log('Submitting request with data:', requestData);

      const docRef = await addDoc(collection(db, 'certificateRequests'), requestData);
      console.log('Document written with ID: ', docRef.id);

      onClose();
    } catch (error) {
      console.error('Error submitting certificate request:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={studentName}
        onChange={(e) => setStudentName(e.target.value)}
        placeholder="Student Name"
        required
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        value={registrationNumber}
        onChange={(e) => setRegistrationNumber(e.target.value)}
        placeholder="Registration Number"
        required
        className="w-full p-2 border rounded"
      />
      <select
        value={selectedInstitution}
        onChange={(e) => setSelectedInstitution(e.target.value)}
        required
        className="w-full p-2 border rounded"
      >
        <option value="">Select Institution</option>
        {institutions.map(inst => (
          <option key={inst.id} value={inst.id}>{inst.name}</option>
        ))}
      </select>
      <select
        value={selectedCourse}
        onChange={(e) => setSelectedCourse(e.target.value)}
        required
        className="w-full p-2 border rounded"
      >
        <option value="">Select Course</option>
        {courses.map(course => (
          <option key={course} value={course}>{course}</option>
        ))}
      </select>
      <input
        type="text"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
        placeholder="Wallet Address"
        required
        className="w-full p-2 border rounded"
      />
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Submit Request
        </button>
      </div>
    </form>
  );
};

const StudentDashboard = () => {
  const [activeSection, setActiveSection] = useState('request-certificate');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInstitutions = async () => {
      const db = getFirestore();
      const institutionsCollection = collection(db, 'users');
      const institutionsSnapshot = await getDocs(institutionsCollection);
      const institutionsList = institutionsSnapshot.docs
        .filter(doc => doc.data().userType === 'institution')
        .map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
      setInstitutions(institutionsList);
    };

    fetchInstitutions();
  }, []);

  const handleLogout = async () => {
    try {
      await disconnectWallet();
      localStorage.removeItem('userType');
      localStorage.removeItem('walletAddress');
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 p-8 font-sans">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-blue-900">Student Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <LogOut className="mr-2" /> Logout
        </button>
      </div>
      <div className="w-32 h-1 bg-blue-600 mb-8"></div>

      <div className="flex space-x-8">
        <div className="w-1/3">
          <SectionButton
            title="Request Certificate"
            isActive={activeSection === 'request-certificate'}
            onClick={() => setActiveSection('request-certificate')}
          />
          <SectionButton
            title="Create ViewNFT"
            isActive={activeSection === 'create-viewnft'}
            onClick={() => setActiveSection('create-viewnft')}
          />
          <SectionButton
            title="Received NFT's"
            isActive={activeSection === 'received-nfts'}
            onClick={() => setActiveSection('received-nfts')}
          />
        </div>
        <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">
            {activeSection === 'request-certificate' && 'Request Certificate'}
            {activeSection === 'create-viewnft' && 'Create ViewNFT'}
            {activeSection === 'received-nfts' && "Received NFT's"}
          </h2>
          {activeSection === 'request-certificate' && (
            <div>
              {!showRequestForm ? (
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Request Certificate
                </button>
              ) : (
                <CertificateRequestForm onClose={() => setShowRequestForm(false)} institutions={institutions} />
              )}
            </div>
          )}
          {activeSection === 'create-viewnft' && (
            <p>Create ViewNFT functionality will be displayed here.</p>
          )}
          {activeSection === 'received-nfts' && (
            <p>Received NFT's will be displayed here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
