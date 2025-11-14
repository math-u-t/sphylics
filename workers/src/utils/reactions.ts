/**
 * Reaction System Utilities
 * 常設リアクション + 季節限定リアクション
 */

import { PERMANENT_REACTIONS, SEASONAL_REACTIONS, SeasonalReaction } from '../types';

/**
 * 季節限定リアクションが有効かチェック
 */
export function isSeasonalReactionActive(reaction: SeasonalReaction, date: Date = new Date()): boolean {
  const month = date.getMonth() + 1; // 0-indexed to 1-indexed
  const day = date.getDate();

  // 同じ月内の期間
  if (reaction.startMonth === reaction.endMonth) {
    return (
      month === reaction.startMonth &&
      day >= reaction.startDay &&
      day <= reaction.endDay
    );
  }

  // 年をまたぐ期間（12月から2月など）
  if (reaction.startMonth > reaction.endMonth) {
    return (
      (month === reaction.startMonth && day >= reaction.startDay) ||
      (month === reaction.endMonth && day <= reaction.endDay) ||
      (month > reaction.startMonth || month < reaction.endMonth)
    );
  }

  // 複数月にまたがる期間
  return (
    (month === reaction.startMonth && day >= reaction.startDay) ||
    (month === reaction.endMonth && day <= reaction.endDay) ||
    (month > reaction.startMonth && month < reaction.endMonth)
  );
}

/**
 * 現在有効な季節限定リアクションを取得
 */
export function getActiveSeasonalReactions(date: Date = new Date()): SeasonalReaction[] {
  return SEASONAL_REACTIONS.filter(reaction => isSeasonalReactionActive(reaction, date));
}

/**
 * リアクション名が有効かチェック
 */
export function isValidReaction(reactionName: string, date: Date = new Date()): boolean {
  // 常設リアクションをチェック
  if (reactionName in PERMANENT_REACTIONS) {
    return true;
  }

  // 季節限定リアクションをチェック
  const activeSeasonalReactions = getActiveSeasonalReactions(date);
  return activeSeasonalReactions.some(r => r.name === reactionName);
}

/**
 * リアクション名から絵文字を取得
 */
export function getReactionEmoji(reactionName: string, date: Date = new Date()): string | null {
  // 常設リアクション
  if (reactionName in PERMANENT_REACTIONS) {
    return PERMANENT_REACTIONS[reactionName as keyof typeof PERMANENT_REACTIONS];
  }

  // 季節限定リアクション
  const seasonal = SEASONAL_REACTIONS.find(r => r.name === reactionName);
  if (seasonal && isSeasonalReactionActive(seasonal, date)) {
    return seasonal.emoji;
  }

  return null;
}

/**
 * 利用可能な全リアクションを取得
 */
export function getAllAvailableReactions(date: Date = new Date()): {
  permanent: { [key: string]: string };
  seasonal: SeasonalReaction[];
} {
  return {
    permanent: { ...PERMANENT_REACTIONS },
    seasonal: getActiveSeasonalReactions(date),
  };
}
