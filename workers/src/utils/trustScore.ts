/**
 * Trust Score Calculation System
 * trustScore = 0.4 * ageScore + 0.3 * userScore + 0.3 * commentScore
 */

import { TrustScoreData, Env } from '../types';

/**
 * Age Score計算（サービス稼働時間ベース）
 * 新しいチャット: 0.0
 * 1日経過: 0.2
 * 1週間経過: 0.5
 * 1ヶ月経過: 0.8
 * 3ヶ月以上: 1.0
 */
export function calculateAgeScore(createdAt: number): number {
  const now = Date.now();
  const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);

  if (ageInDays < 1) {
    return 0.2 * ageInDays; // 0-0.2
  } else if (ageInDays < 7) {
    return 0.2 + 0.3 * ((ageInDays - 1) / 6); // 0.2-0.5
  } else if (ageInDays < 30) {
    return 0.5 + 0.3 * ((ageInDays - 7) / 23); // 0.5-0.8
  } else if (ageInDays < 90) {
    return 0.8 + 0.2 * ((ageInDays - 30) / 60); // 0.8-1.0
  } else {
    return 1.0;
  }
}

/**
 * User Score計算（アクティブユーザー数ベース）
 * 0-5人: 0.0-0.3
 * 6-20人: 0.3-0.6
 * 21-50人: 0.6-0.8
 * 51人以上: 0.8-1.0
 */
export function calculateUserScore(userCount: number): number {
  if (userCount <= 0) {
    return 0.0;
  } else if (userCount <= 5) {
    return 0.3 * (userCount / 5); // 0.0-0.3
  } else if (userCount <= 20) {
    return 0.3 + 0.3 * ((userCount - 5) / 15); // 0.3-0.6
  } else if (userCount <= 50) {
    return 0.6 + 0.2 * ((userCount - 20) / 30); // 0.6-0.8
  } else if (userCount <= 100) {
    return 0.8 + 0.2 * ((userCount - 50) / 50); // 0.8-1.0
  } else {
    return 1.0;
  }
}

/**
 * Comment Score計算（コメント総数ベース）
 * 0-10件: 0.0-0.3
 * 11-50件: 0.3-0.6
 * 51-200件: 0.6-0.8
 * 201件以上: 0.8-1.0
 */
export function calculateCommentScore(commentCount: number): number {
  if (commentCount <= 0) {
    return 0.0;
  } else if (commentCount <= 10) {
    return 0.3 * (commentCount / 10); // 0.0-0.3
  } else if (commentCount <= 50) {
    return 0.3 + 0.3 * ((commentCount - 10) / 40); // 0.3-0.6
  } else if (commentCount <= 200) {
    return 0.6 + 0.2 * ((commentCount - 50) / 150); // 0.6-0.8
  } else if (commentCount <= 500) {
    return 0.8 + 0.2 * ((commentCount - 200) / 300); // 0.8-1.0
  } else {
    return 1.0;
  }
}

/**
 * Trust Score計算（加重平均）
 */
export function calculateTrustScore(
  ageScore: number,
  userScore: number,
  commentScore: number
): number {
  const trustScore = 0.4 * ageScore + 0.3 * userScore + 0.3 * commentScore;
  return Math.min(Math.max(trustScore, 0), 1); // 0-1の範囲にクランプ
}

/**
 * チャットの信頼スコアを計算
 */
export async function calculateChatTrustScore(
  chatLink: string,
  createdAt: number,
  env: Env
): Promise<TrustScoreData> {
  // ユーザー数を取得（KVから）
  const usersKey = `chat:${chatLink}:users`;
  const usersList = await env.KV.list({ prefix: usersKey });
  const userCount = usersList.keys.length;

  // コメント数を取得（KVから）
  const commentsKey = `chat:${chatLink}:comments`;
  const commentsList = await env.KV.list({ prefix: commentsKey });
  const commentCount = commentsList.keys.length;

  // 各スコアを計算
  const ageScore = calculateAgeScore(createdAt);
  const userScore = calculateUserScore(userCount);
  const commentScore = calculateCommentScore(commentCount);
  const trustScore = calculateTrustScore(ageScore, userScore, commentScore);

  const result: TrustScoreData = {
    chatLink,
    ageScore,
    userScore,
    commentScore,
    trustScore,
    calculatedAt: new Date().toISOString(),
  };

  // スコアをKVに保存
  await env.KV.put(
    `trust:${chatLink}`,
    JSON.stringify(result),
    { expirationTtl: 3600 } // 1時間キャッシュ
  );

  return result;
}

/**
 * 保存された信頼スコアを取得（キャッシュがあればそれを返す）
 */
export async function getTrustScore(
  chatLink: string,
  env: Env
): Promise<TrustScoreData | null> {
  const cached = await env.KV.get(`trust:${chatLink}`);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}
