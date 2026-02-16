import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, query, where, deleteDoc, Timestamp } from 'firebase/firestore';
import { Transaction, Account, User } from '@/types';

// Firebase configuration - replace with your own values
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Auth functions
export const firebaseSignIn = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return mapFirebaseUser(userCredential.user);
};

export const firebaseSignUp = async (email: string, password: string): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return mapFirebaseUser(userCredential.user);
};

export const firebaseSignOut = async (): Promise<void> => {
  await signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, (firebaseUser) => {
    callback(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
  });
};

const mapFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  displayName: firebaseUser.displayName || undefined,
  photoURL: firebaseUser.photoURL || undefined,
});

// Firestore functions
export const syncTransactions = async (userId: string, transactions: Transaction[]): Promise<void> => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');

  for (const transaction of transactions) {
    if (!transaction.synced) {
      await setDoc(doc(transactionsRef, transaction.id), {
        ...transaction,
        date: Timestamp.fromDate(new Date(transaction.date)),
        createdAt: Timestamp.fromDate(new Date(transaction.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(transaction.updatedAt)),
        synced: true,
      });
    }
  }
};

export const fetchTransactions = async (userId: string): Promise<Transaction[]> => {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const snapshot = await getDocs(transactionsRef);

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      date: data.date.toDate().toISOString(),
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: data.updatedAt.toDate().toISOString(),
      synced: true,
    } as Transaction;
  });
};

export const syncAccounts = async (userId: string, accounts: Account[]): Promise<void> => {
  const accountsRef = collection(db, 'users', userId, 'accounts');

  for (const account of accounts) {
    await setDoc(doc(accountsRef, account.id), {
      ...account,
      createdAt: Timestamp.fromDate(new Date(account.createdAt)),
    });
  }
};

export const fetchAccounts = async (userId: string): Promise<Account[]> => {
  const accountsRef = collection(db, 'users', userId, 'accounts');
  const snapshot = await getDocs(accountsRef);

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt.toDate().toISOString(),
    } as Account;
  });
};

export const deleteTransactionFromCloud = async (userId: string, transactionId: string): Promise<void> => {
  const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
  await deleteDoc(transactionRef);
};

export const deleteAccountFromCloud = async (userId: string, accountId: string): Promise<void> => {
  const accountRef = doc(db, 'users', userId, 'accounts', accountId);
  await deleteDoc(accountRef);
};

export { auth, db };
