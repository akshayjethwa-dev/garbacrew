import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../lib/firebase";
import * as ImageManipulator from "expo-image-manipulator";

export async function uploadProfilePhoto(uid: string, localUri: string): Promise<string> {
  try {
    // Resize and compress the image
    const manipulated = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: 1080, height: 1080 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Convert to blob
    const response = await fetch(manipulated.uri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const storageRef = ref(storage, `users/${uid}/profile.jpg`);
    await uploadBytes(storageRef, blob, {
      contentType: "image/jpeg",
    });

    // Get the download URL
    return await getDownloadURL(storageRef);
  } catch (error: any) {
    console.error("Photo upload error:", {
      code: error.code,
      message: error.message,
      serverResponse: error.serverResponse,
    });
    throw new Error(
      error.code === "storage/unauthorized"
        ? "You don't have permission to upload. Please check your Firebase Storage rules."
        : "Failed to upload photo. Please try again."
    );
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