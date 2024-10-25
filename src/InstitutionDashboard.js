import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { disconnectWallet } from './utils/wallet';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where, getDoc, addDoc, arrayUnion } from 'firebase/firestore';
import { PinataSDK } from "pinata-web3";

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

const InstitutionDashboard = () => {
  const [activeSection, setActiveSection] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [institutionName, setInstitutionName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchInstitutionInfo = async () => {
    const db = getFirestore();
    const institutionId = localStorage.getItem('userId');
    
    if (!institutionId) {
      console.error('No userId found in localStorage');
      // Handle the case where there's no userId, e.g., redirect to login
      // navigate('/login');
      return;
    }

    try {
      const institutionDoc = await getDoc(doc(db, 'users', institutionId));
      if (institutionDoc.exists()) {
        setInstitutionName(institutionDoc.data().name);
      } else {
        console.error('No institution document found for id:', institutionId);
        // Handle the case where no document exists for this id
      }
    } catch (error) {
      console.error('Error fetching institution info:', error);
      // Handle the error, e.g., show an error message to the user
    }
  };

  const fetchRequests = async () => {
    const db = getFirestore();
    
    console.log('Fetching all requests');

    try {
      const requestsCollection = collection(db, 'certificateRequests');
      const requestsSnapshot = await getDocs(requestsCollection);
      
      console.log('Number of requests found:', requestsSnapshot.size);

      const requestsList = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('Processed requests:', requestsList);

      setRequests(requestsList);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

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

  const handleDelete = async (requestId) => {
    const db = getFirestore();
    try {
      await deleteDoc(doc(db, 'certificateRequests', requestId));
      setRequests(requests.filter(request => request.id !== requestId));
      console.log('Request deleted successfully');
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setActiveSection('issue-certificate');
  };

  return (
    <div className="min-h-screen bg-blue-50 p-8 font-sans">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-blue-900">Institution Dashboard</h1>
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
            title="Issue Certificate"
            isActive={activeSection === 'issue-certificate'}
            onClick={() => setActiveSection('issue-certificate')}
          />
          <SectionButton
            title="Manage Certificates"
            isActive={activeSection === 'manage-certificates'}
            onClick={() => setActiveSection('manage-certificates')}
          />
          <SectionButton
            title="Requests"
            isActive={activeSection === 'requests'}
            onClick={() => setActiveSection('requests')}
          />
        </div>
        <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
          {activeSection === 'issue-certificate' && (
            <IssueCertificateSection selectedRequest={selectedRequest} />
          )}
          {activeSection === 'manage-certificates' && (
            <p>Manage Certificates functionality will be displayed here.</p>
          )}
          {activeSection === 'requests' && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Pending Requests</h3>
              <p>Total requests: {requests.length}</p>
              {requests.length > 0 ? (
                <ul className="space-y-2">
                  {requests.map(request => (
                    <li key={request.id} className="border p-2 rounded mb-4">
                      <p><strong>Student:</strong> {request.studentName}</p>
                      <p><strong>Registration Number:</strong> {request.registrationNumber}</p>
                      <p><strong>Course:</strong> {request.course}</p>
                      <p><strong>Wallet Address:</strong> {request.walletAddress}</p>
                      <p><strong>Institution:</strong> {request.institutionName}</p>
                      <p><strong>Status:</strong> {request.status}</p>
                      <div className="mt-2">
                        <button
                          onClick={() => handleApprove(request)}
                          className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDelete(request.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div>
                  <p>No pending requests at the moment.</p>
                  <button 
                    onClick={fetchRequests} 
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Refresh Requests
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const IssueCertificateSection = ({ selectedRequest }) => {
  const [certificateImage, setCertificateImage] = useState(null);
  const [ipfsHash, setIpfsHash] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [finalUri, setFinalUri] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [cgpa, setCgpa] = useState('');
  const [semMarks, setSemMarks] = useState({
    sem1: '', sem2: '', sem3: '', sem4: '', sem5: '', sem6: ''
  });
  const [institutionWalletAddress, setInstitutionWalletAddress] = useState('');

  const pinata = new PinataSDK({
    pinataJwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzZmQ3ZTUyZS1hYmI4LTQ0NWItODM3Ni02NTRmNjI0OGZhMzkiLCJlbWFpbCI6Iml0Y2h5ZmVldGZsaWNrc0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiYjU1ODQyMTQ4OTAzYThmZWJmMTUiLCJzY29wZWRLZXlTZWNyZXQiOiJjNzcyNGM0YjNhYTdiYTYwNmMzZTg5M2I3OWU0MDk5NTFmM2YwZDY3NTM5YmRmMGFkMTg3MmFmMjJjNzVkOWUyIiwiZXhwIjoxNzYxNDA1ODYyfQ.GnDh-jQk2w1Buk7KQA-AB5iIOk1hHpaQS2_tK4_WBJQ",
    pinataGateway: "https://gateway.pinata.cloud",
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCertificateImage(file);
      setIpfsHash('');
      setImageUri('');
    }
  };

  const handleUploadToIPFS = async () => {
    if (!certificateImage) {
      alert('Please select an image first');
      return;
    }

    setIsUploading(true);

    try {
      const upload = await pinata.upload.file(certificateImage);
      console.log('Upload response:', upload);
      setIpfsHash(upload.IpfsHash);
      setImageUri(`ipfs://${upload.IpfsHash}`);
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      alert(`Failed to upload image to IPFS: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateFinalUri = async () => {
    if (!imageUri) {
      alert('Please upload the certificate image first');
      return;
    }

    setIsUploading(true);

    const certificateData = {
      ...selectedRequest,
      institutionWalletAddress,
      cgpa,
      semMarks,
      certificateImageUri: imageUri,
    };

    try {
      const jsonString = JSON.stringify(certificateData);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], 'certificate_data.json', { type: 'application/json' });

      const upload = await pinata.upload.file(file);
      console.log('Final URI upload response:', upload);
      setFinalUri(`ipfs://${upload.IpfsHash}`);
    } catch (error) {
      console.error('Error generating final URI:', error);
      alert(`Failed to generate final URI: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalUri) {
      alert('Please generate the final URI first');
      return;
    }

    // Add your logic here to submit the certificate data
    console.log('Certificate data:', {
      ...selectedRequest,
      institutionWalletAddress,
      cgpa,
      semMarks,
      certificateImageUri: imageUri,
      finalUri,
    });

    // Reset form or navigate to a different page after submission
  };

  const handleSemMarksChange = (e, semester) => {
    setSemMarks({
      ...semMarks,
      [semester]: e.target.value,
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-800 mb-4">Issue Certificate</h2>
      {selectedRequest ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="studentName">
              Student Name
            </label>
            <input
              type="text"
              id="studentName"
              value={selectedRequest.studentName}
              readOnly
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="registrationNumber">
              Registration Number
            </label>
            <input
              type="text"
              id="registrationNumber"
              value={selectedRequest.registrationNumber}
              readOnly
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="course">
              Course
            </label>
            <input
              type="text"
              id="course"
              value={selectedRequest.course}
              readOnly
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="walletAddress">
              Wallet Address
            </label>
            <input
              type="text"
              id="walletAddress"
              value={selectedRequest.walletAddress}
              readOnly
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="institutionName">
              Institution Name
            </label>
            <input
              type="text"
              id="institutionName"
              value={selectedRequest.institutionName}
              readOnly
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Institution Wallet Address
            </label>
            <input
              type="text"
              value={institutionWalletAddress}
              onChange={(e) => setInstitutionWalletAddress(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              CGPA
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          {/* Add semester marks fields */}
          {[1, 2, 3, 4, 5, 6].map((sem) => (
            <div key={sem} className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Semester {sem} Marks
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={semMarks[`sem${sem}`]}
                onChange={(e) => handleSemMarksChange(e, `sem${sem}`)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
          ))}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Upload Certificate Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          {certificateImage && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">Image preview:</p>
              <img
                src={URL.createObjectURL(certificateImage)}
                alt="Certificate preview"
                className="mt-2 max-w-xs"
              />
              <button
                type="button"
                onClick={handleUploadToIPFS}
                disabled={isUploading}
                className={`mt-2 ${isUploading ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-700'} text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
              >
                {isUploading ? 'Uploading...' : 'Upload to IPFS'}
              </button>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Image URI
            </label>
            <input
              type="text"
              value={imageUri}
              readOnly
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <button
              type="button"
              onClick={handleGenerateFinalUri}
              disabled={isUploading || !imageUri}
              className={`${isUploading || !imageUri ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
            >
              Generate Final URI
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Final URI
            </label>
            <input
              type="text"
              value={finalUri}
              readOnly
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Issue Certificate
          </button>
        </form>
      ) : (
        <p>No request selected. Please approve a request from the Requests section.</p>
      )}
    </div>
  );
};

export default InstitutionDashboard;
