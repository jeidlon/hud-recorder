/**
 * Remotion Entry Point
 * 
 * Remotion CLI가 이 파일을 entry point로 사용합니다.
 * `npx remotion render src/remotion/index.ts HUDOverlay out.mp4`
 */

import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
