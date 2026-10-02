import { auth, db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export interface LivenessResult {
  success: boolean;
  similarity: number;
  embedding?: number[];
  message: string;
}

/**
 * Upload selfie frames to Cloud Function for AWS Rekognition CompareFaces.
 *
 * In production, the Cloud Function handles:
 * 1. Receiving 3 frames (front, left, right)
 * 2. Calling AWS Rekognition CompareFaces between front+left, front+right
 * 3. Computing average similarity
 * 4. Returning result
 */
export async function verifySelfie(
  frames: string[] // base64 encoded images
): Promise<LivenessResult> {
  try {
    // Call your Cloud Function
    const response = await fetch(
      "https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/verifySelfie",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          frames,
          userId: auth.currentUser?.uid,
        }),
      }
    );

    const data = await response.json();

    // Update Firestore based on result
    if (data.similarity > 90) {
      const userRef = doc(db, "users", auth.currentUser!.uid);
      await updateDoc(userRef, {
        isVerified: true,
        selfieVerified: true,
        selfieEmbedding: data.embedding,
      });
    }

    return {
      success: data.similarity > 90,
      similarity: data.similarity,
      embedding: data.embedding,
      message: getVerificationMessage(data.similarity),
    };
  } catch (error) {
    console.error("Selfie verification error:", error);
    return {
      success: false,
      similarity: 0,
      message: "Verification failed. Please try again.",
    };
  }
}

function getVerificationMessage(similarity: number): string {
  if (similarity > 90) return "✅ Identity verified!";
  if (similarity >= 75) return "Under manual review. We'll notify you soon.";
  return "Verification failed. Please ensure good lighting and try again.";
}

/**
 * Liveness prompts — random sequence.
 */
export const LIVENESS_PROMPTS = [
  { id: "blink", text: "Blink once", icon: "👁️" },
  { id: "smile", text: "Smile", icon: "😊" },
  { id: "turn_left", text: "Turn head left", icon: "⬅️" },
  { id: "turn_right", text: "Turn head right", icon: "➡️" },
  { id: "nod", text: "Nod your head", icon: "⬆️" },
];

export function getRandomPrompts(count: number = 3) {
  const shuffled = [...LIVENESS_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}