import { collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Transaction } from "../types";

export const subscribeToTransactions = (userId: string, callback: (transactions: Transaction[]) => void) => {
  const q = query(collection(db, "users", userId, "transactions"));
  return onSnapshot(q, (snapshot) => {
    const transactions: Transaction[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        date: data.date,
        amount: data.amount,
        content: data.content,
        category: data.category,
        imageUrl: data.imageUrl,
        type: data.type,
        isDeleted: data.isDeleted
      });
    });
    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(transactions);
  });
};

export const getTransactionByImageHash = async (userId: string, imageHash: string): Promise<Transaction | null> => {
  const q = query(collection(db, "users", userId, "transactions"), where("imageHash", "==", imageHash));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      date: data.date,
      amount: data.amount,
      content: data.content,
      category: data.category,
      imageUrl: data.imageUrl,
      type: data.type,
      isDeleted: data.isDeleted,
      imageHash: data.imageHash
    };
  }
  return null;
};

export const saveTransaction = async (userId: string, transaction: Transaction) => {
  const docRef = doc(db, "users", userId, "transactions", transaction.id);
  await setDoc(docRef, {
    ...transaction,
    userId
  });
};

export const updateTransaction = async (userId: string, transaction: Transaction) => {
  const docRef = doc(db, "users", userId, "transactions", transaction.id);
  await updateDoc(docRef, {
    ...transaction
  });
};

export const deleteTransaction = async (userId: string, transactionId: string) => {
  const docRef = doc(db, "users", userId, "transactions", transactionId);
  await updateDoc(docRef, {
    isDeleted: true
  });
};

export const permanentlyDeleteTransaction = async (userId: string, transactionId: string) => {
  const docRef = doc(db, "users", userId, "transactions", transactionId);
  await deleteDoc(docRef);
};

export const restoreTransaction = async (userId: string, transactionId: string) => {
  const docRef = doc(db, "users", userId, "transactions", transactionId);
  await updateDoc(docRef, {
    isDeleted: false
  });
};
