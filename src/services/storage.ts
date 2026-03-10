import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export const uploadReceiptImage = async (userId: string, base64DataUrl: string, filename: string): Promise<string> => {
  const storageRef = ref(storage, `receipts/${userId}/${filename}`);
  await uploadString(storageRef, base64DataUrl, 'data_url');
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};
