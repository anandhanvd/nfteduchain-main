import { db } from './firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

export const addUserToDatabase = async (walletAddress, userType, name) => {
  try {
    // Reference to the document with walletAddress as the document ID
    const userDocRef = doc(db, 'users', walletAddress);

    // Check if the document already exists
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      console.log('User already exists in the database.');
      return; // If the user already exists, do nothing
    }

    // Add the user if they don't exist already
    await setDoc(userDocRef, {
      walletAddress,
      userType,
      name,
      createdAt: Timestamp.now(),
    });

    console.log('User added to the database successfully');
  } catch (error) {
    console.error('Error adding user to database:', error);
    throw error;
  }
};
