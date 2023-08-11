import axios from "axios";
import { data } from './data';

export interface holidayResponseType {
    date: number;
    workday: number;
}

/**
 * https://api.apihubs.cn/holiday/get?year=2023&workday=2&weekend=2&cn=1&size=100
 * @param year 
 */
export function getHolidayList(year = new Date().getFullYear()) {
    return data.data.list as unknown as holidayResponseType[];

    // const { data } = await axios.get<{ code: number, data: { list: holidayResponseType[] } }>(`https://api.apihubs.cn/holiday/get?field=date,workday&year=${year}&cn=1&size=366`, {
    //     responseType: 'json'
    // });
    // if (data.code === 0) {
    //     return data.data.list
    // } else {
    //     return [];
    // }
}
