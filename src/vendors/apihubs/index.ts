import { formatDate } from "../../util";
import { CacheMgr } from "../../util/cache"
import { getHolidayList, holidayResponseType } from "./transfer"

const cache = new CacheMgr<holidayResponseType[]>();
const key = '__holiday_list';
/**
 * 指定日期是否为假期
 * @param date YYYY-MM-DD | Date
 */
export function isHoliday(date: string | Date) {

    const theDate = new Date(date);
    const year = theDate.getFullYear();
    const datestr = Number(formatDate(theDate, 'YYYYMMDD'));

    const list = cache.has(key) ? cache.get(key) : getHolidayList(year);

    const dateOption = list.find(item => item.date === datestr);

    return dateOption?.workday === 2;

}