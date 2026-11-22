export function timeToSeconds(time: string): number {
    const [h, m, s = '0'] = time.split(':');
    return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

export function normalizeTime(time: string): string {
    return time.length === 5 ? `${time}:00` : time;
}
