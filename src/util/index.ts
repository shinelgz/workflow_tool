import { isHoliday } from "../vendors/apihubs";

export function getDateStrByDay(weekDayIndex: number, date = new Date(), formatter = 'YYYY-MM-DD') {
    const d = getDateOfWeekDay(weekDayIndex, date);
    return formatDate(d, formatter)
}

export function getDateOfWeekDay(weekDayIndex: number, date = new Date()) {
    const cpyDate = cleanTime(new Date(date));
    const day = cpyDate.getDay();
    cpyDate.setDate(cpyDate.getDate() - day + weekDayIndex);
    return cpyDate;
}
export function getDateListByDayWeekly<T extends Date | string>(date: Date, day: number, cycle: number, formatter?: string): T[] {
    if (cycle < 1) {
        return [];
    }
    function out(date: Date) {
        return (formatter ? formatDate(date, formatter) : date) as T;
    }
    const ret: T[] = [];
    const cpyDate = new Date(date);
    const week = cpyDate.getDay();
    cpyDate.setDate(cpyDate.getDate() - week + day);
    ret.push(out(cpyDate));
    while (cycle > 1) {
        cpyDate.setDate(cpyDate.getDate() - 7);
        ret.push(out(cpyDate));
        cycle--;
    }
    return ret;
}

export function formatDate(date: Date, express = 'YYYY-MM-DD') {
    const YYYY = `${date.getFullYear()}`;
    const mm = `${date.getMonth() + 1}`;
    const MM = `${mm.toString().padStart(2, '0')}`;
    const dd = `${date.getDate()}`;
    const DD = `${dd.toString().padStart(2, '0')}`;

    const hh = `${date.getHours()}`.padStart(2, '0');
    const mi = `${date.getMinutes()}`.padStart(2, '0');
    const ss = `${date.getSeconds()}`.padStart(2, '0');
    return express.replace(/YYYY/g, YYYY).replace(/mm/g, mm).replace(/MM/g, MM).replace(/dd/g, dd).replace(/DD/g, DD)
        .replace(/hh/g, hh).replace(/mi/g, mi).replace(/ss/g, ss)
}

export async function wait(second: number) {
    return new Promise(resolve => setTimeout(resolve, second * 1000));
}

export function cleanTime(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

export function getChinaDateDay(date: Date, fromDate?: Date) {
    let from = getDateOfWeekDay(1, fromDate ?? date);
    date = cleanTime(date);
    from = cleanTime(from);
    const day = Math.ceil((date.getTime() - from.getTime()) / 86400000 + 1);
    const day2 = date.getDay();
    // console.info(day2, day, date.toString(), fromDate?.toString())
    return day;
    // return day === 0 ? 7 : day;
}
/**
 * 通过 工作量 计划任务结束时间
 * @param date 
 * @param day 
 * @returns 
 */
export function getDateByExpire(date: Date, day: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + Math.ceil(day) - 1);
    return d;
}

/**
 * 在date的基础上，再增加 days 天，并返回该 date 对象
 * @param date 
 * @param days 
 * @returns 
 */
export function increaseByDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);

    return d;
}
/**
 * 将时间段按 某个假日（或连续的假日）的时间 分割成小时间段，即是切去假日的日期。
 * @param start 
 * @param end 
 * @returns 
 */
export function splitByHoliday(start: Date, end: Date): [Date, Date, number][] {
    let group: [Date, Date, number][] = [];
    const startDate = new Date(start);
    let startPoint = new Date(start);
    // 总工作天数
    let totalCnt = 0;
    let endPoint;
    while (startDate <= end) {
        if (isHoliday(startDate)) {
            //切断
            if (startPoint && endPoint) {
                const dayCnt = getDayCnt(startPoint, endPoint);
                group.push([startPoint, endPoint, dayCnt]);
                totalCnt += dayCnt;
                endPoint = null;
            }
            // 加一天
            startDate.setDate(startDate.getDate() + 1);
            startPoint = new Date(startDate);
        } else {
            endPoint = new Date(startDate);
            // 加一天
            startDate.setDate(startDate.getDate() + 1);
        }
    }
    if (startPoint && endPoint) {
        const dayCnt = getDayCnt(startPoint, endPoint);
        group.push([startPoint, endPoint, dayCnt]);
        totalCnt += dayCnt;
    }
    group = group.map(([start, end, dayCnt]) => [start, end, Number((dayCnt / totalCnt).toFixed(10))])
    return group;
}

/**
 * 在给出的日期中找出第一个工作日，包含本身
 * @param start 
 */
export function findFirstWorkDay(start: Date) {
    const d = new Date(start);
    const year = d.getFullYear();
    const month = d.getMonth();
    const date = d.getDate();
    let i = 0;
    while (i < 20) {
        const n = new Date(year, month, date + i);
        if (!isHoliday(formatDate(n))) {
            return n;
        }
        i += 1;
    }
    // 20 天内找不到工作日？不太可能的。所以还是保底给个时间。
    return d;
}

function getDayCnt(start: Date, end: Date) {
    return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}