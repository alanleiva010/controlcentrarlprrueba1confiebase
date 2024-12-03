import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export async function uploadTransactionFile(file: File, transactionId: string): Promise<string> {
  const extension = file.name.split('.').pop();
  const path = `transactions/${transactionId}/attachment.${extension}`;
  return uploadFile(file, path);
}