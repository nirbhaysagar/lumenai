/**
 * SuperMemo-2 (SM-2) Algorithm Implementation
 * 
 * Used to calculate the next review interval for spaced repetition.
 * 
 * @param quality - The quality of the recall (0-5).
 *                  5 - perfect response
 *                  4 - correct response after a hesitation
 *                  3 - correct response recalled with serious difficulty
 *                  2 - incorrect response; where the correct one seemed easy to recall
 *                  1 - incorrect response; the correct one remembered
 *                  0 - complete blackout
 * @param previousInterval - The previous interval in days.
 * @param previousEaseFactor - The previous ease factor (minimum 1.3).
 * @param previousReviewCount - The number of times the item has been reviewed.
 * 
 * @returns An object containing the new interval, ease factor, and review count.
 */
export interface SM2Result {
    interval: number;
    easeFactor: number;
    reviewCount: number;
}

export function calculateSM2(
    quality: number,
    previousInterval: number,
    previousEaseFactor: number,
    previousReviewCount: number
): SM2Result {
    let interval: number;
    let easeFactor: number;
    let reviewCount: number;

    // Constrain quality to 0-5
    const q = Math.max(0, Math.min(5, quality));

    if (q >= 3) {
        // Correct response
        if (previousReviewCount === 0) {
            interval = 1;
        } else if (previousReviewCount === 1) {
            interval = 6;
        } else {
            interval = Math.round(previousInterval * previousEaseFactor);
        }
        reviewCount = previousReviewCount + 1;
    } else {
        // Incorrect response
        reviewCount = 0;
        interval = 1;
    }

    // Calculate new Ease Factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = previousEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

    // Ease Factor cannot go below 1.3
    if (easeFactor < 1.3) {
        easeFactor = 1.3;
    }

    return {
        interval,
        easeFactor,
        reviewCount
    };
}
