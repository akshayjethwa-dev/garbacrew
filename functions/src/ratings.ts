import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { SCORE, clampScore } from "./constants";

const db = getFirestore();

interface RatingDoc {
  planId: string;
  fromUid: string;
  toUid: string;
  toRole: "host" | "guest";
  showedUp: boolean;
  vibe: number;       // 1-5
  wouldRepeat: boolean;
  punctuality: number; // 1-5
  createdAt: FirebaseFirestore.Timestamp;
}

/**
 * When a rating is submitted, apply the score delta to the target.
 */
export const onRatingCreated = onDocumentCreated(
  "ratings/{ratingId}",
  async (event) => {
    const rating = event.data?.data() as RatingDoc | undefined;
    if (!rating) return;

    const targetRef = db.collection("users").doc(rating.toUid);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) return;

    const target = targetSnap.data()!;

    // Calculate delta based on rating
    let delta = 0;
    if (rating.toRole === "host") {
      if (rating.vibe === 5) delta += SCORE.HOST_5_STAR;
      if (!rating.showedUp) delta += SCORE.HOST_NO_SHOW;
    } else {
      if (rating.vibe === 5) delta += SCORE.GUEST_5_STAR;
      if (!rating.showedUp) delta += SCORE.GUEST_NO_SHOW;
    }

    if (delta === 0) return;

    const field = rating.toRole === "host" ? "hostScore" : "guestScore";
    const currentValue = target[field] ?? 50;

    await targetRef.update({
      [field]: clampScore(currentValue + delta),
      lastRatedAt: FieldValue.serverTimestamp(),
    });

    // Log the event
    await db.collection("scoreEvents").add({
      type: "rating_applied",
      ratingId: event.params.ratingId,
      fromUid: rating.fromUid,
      toUid: rating.toUid,
      toRole: rating.toRole,
      delta,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
);