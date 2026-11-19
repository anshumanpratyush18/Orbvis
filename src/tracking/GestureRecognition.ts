import { HandData, GestureType, GestureResult, LANDMARK_INDEX } from '../types';
import { dist2D, calculatePalmSize } from '../utils/math';

export class GestureRecognizer {
  recognize(hand: HandData): GestureResult {
    const landmarks = hand.landmarks;
    if (!landmarks || landmarks.length < 21) {
      return { gesture: 'none', confidence: 0, hand: hand.handedness };
    }

    const palmSize = Math.max(0.08, calculatePalmSize(landmarks));
    const wrist = landmarks[LANDMARK_INDEX.WRIST];

    // Distance from wrist to fingertip vs wrist to PIP (Proximal Interphalangeal)
    const isFingerExtended = (tipIdx: number, pipIdx: number, mcpIdx: number) => {
      const tip = landmarks[tipIdx];
      const pip = landmarks[pipIdx];
      const mcp = landmarks[mcpIdx];
      
      const distTipWrist = dist2D(tip, wrist);
      const distPipWrist = dist2D(pip, wrist);
      const distMcpWrist = dist2D(mcp, wrist);

      // In any orientation, an extended finger has tip much farther from wrist than PIP & MCP
      return distTipWrist > distPipWrist * 1.15 && distTipWrist > distMcpWrist * 1.35;
    };

    const isThumbExtended = () => {
      const thumbTip = landmarks[LANDMARK_INDEX.THUMB_TIP];
      const thumbMcp = landmarks[LANDMARK_INDEX.THUMB_MCP];
      const indexMcp = landmarks[LANDMARK_INDEX.INDEX_FINGER_MCP];
      const distThumbIndex = dist2D(thumbTip, indexMcp);
      return distThumbIndex > palmSize * 0.7;
    };

    const indexExtended = isFingerExtended(
      LANDMARK_INDEX.INDEX_FINGER_TIP,
      LANDMARK_INDEX.INDEX_FINGER_PIP,
      LANDMARK_INDEX.INDEX_FINGER_MCP
    );
    const middleExtended = isFingerExtended(
      LANDMARK_INDEX.MIDDLE_FINGER_TIP,
      LANDMARK_INDEX.MIDDLE_FINGER_PIP,
      LANDMARK_INDEX.MIDDLE_FINGER_MCP
    );
    const ringExtended = isFingerExtended(
      LANDMARK_INDEX.RING_FINGER_TIP,
      LANDMARK_INDEX.RING_FINGER_PIP,
      LANDMARK_INDEX.RING_FINGER_MCP
    );
    const pinkyExtended = isFingerExtended(
      LANDMARK_INDEX.PINKY_TIP,
      LANDMARK_INDEX.PINKY_PIP,
      LANDMARK_INDEX.PINKY_MCP
    );
    const thumbExtended = isThumbExtended();

    // Scale-invariant pinch detection: thumb tip to index tip normalized by palm size
    const thumbTip = landmarks[LANDMARK_INDEX.THUMB_TIP];
    const indexTip = landmarks[LANDMARK_INDEX.INDEX_FINGER_TIP];
    const pinchRawDist = dist2D(thumbTip, indexTip);
    const pinchNormalized = pinchRawDist / palmSize;
    const isPinch = pinchNormalized < 0.38;

    let gesture: GestureType = 'none';

    if (isPinch) {
      gesture = 'pinch';
    } else if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      gesture = 'open_palm';
    } else if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      gesture = 'pointing';
    } else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      gesture = 'peace';
    } else if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      // Check thumbs up vs fist
      if (thumbExtended && thumbTip.y < wrist.y - palmSize * 0.4) {
        gesture = 'thumbs_up';
      } else {
        gesture = 'closed_fist';
      }
    }

    const rotation = this.getHandRotation(hand);

    return {
      gesture,
      confidence: hand.score,
      hand: hand.handedness,
      pinchDistance: pinchNormalized,
      rotation,
    };
  }

  recognizeAll(hands: HandData[]): GestureResult[] {
    return hands.map(h => this.recognize(h));
  }

  getHandDistance(hands: HandData[]): number {
    if (hands.length < 2) return 0;
    const h1 = hands[0].landmarks[LANDMARK_INDEX.MIDDLE_FINGER_MCP];
    const h2 = hands[1].landmarks[LANDMARK_INDEX.MIDDLE_FINGER_MCP];
    return dist2D(h1, h2) * 2.2;
  }

  getHandRotation(hand: HandData): number {
    if (!hand.landmarks || hand.landmarks.length < 21) return 0;
    const wrist = hand.landmarks[LANDMARK_INDEX.WRIST];
    const middleMcp = hand.landmarks[LANDMARK_INDEX.MIDDLE_FINGER_MCP];
    return Math.atan2(middleMcp.y - wrist.y, middleMcp.x - wrist.x);
  }
}
