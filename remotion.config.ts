/**
 * Remotion 설정 파일
 * 
 * 렌더링 옵션 및 Webpack 설정
 */

import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// 코덱 설정
Config.setCodec("h264");

// 크롬 헤드리스 옵션 (메모리 최적화)
Config.setChromiumHeadlessMode(true);

// 동시 렌더링 수 (CPU 코어에 맞게 조정)
Config.setConcurrency(4);
