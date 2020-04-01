import { getRandomInt } from './number';
import { Song } from '../service/data-types/common.types';

export function inArray(arr: any[], target: any): boolean {
    return arr.indexOf(target) !== -1;
}

export function shuffle<T>(arr: T[]): T[] {
    const result = arr.slice();
    for (let i = 0; i < result.length; i++) {
        // 0和i直间的一个随机数
        const j = getRandomInt([0, i]);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function findIndex(list: Song[], currentSong: Song): number {
    return list.findIndex(item => item.id === currentSong.id);
}
