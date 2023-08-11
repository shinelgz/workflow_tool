//https://{domain}/api/get/release/list-by-date-range?startTime=1679906204631&endTime=1680278399999&team=



/**
 * seatalk 相关的工具类
 */
import axios from 'axios';

export default async function transfer<T>(url: string, params: T): Promise<any> {
    console.info(arguments);
    try {
        const res = await axios.request({
            url,
            method: 'get',
            params

        });
        console.log(res.data);
        return res;

    } catch (error) {
        throw (error);
    }
}