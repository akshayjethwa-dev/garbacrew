import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../lib/firebase";
import * as ImageManipulator from "expo-image-manipulator";

export async function uploadProfilePhoto(uid: string, localUri: string): Promise<string> {
  try {
    const manipulated = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: 1080, height: 1080 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    const response = await fetch(manipulated.uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `users/${uid}/profile.jpg`);
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });

    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Photo upload error:", error);
    throw new Error("Failed to upload photo");
  }
}

export async function deleteProfilePhoto(uid: string): Promise<void> {
  try {
    const storageRef = ref(storage, `users/${uid}/profile.jpg`);
    await deleteObject(storageRef);
  } catch (error) {
    // File may not exist — ignore
  }
}