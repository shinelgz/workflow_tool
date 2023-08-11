/**
 * seatalk 相关的工具类
 */
import axios from 'axios';

export default async function transfer<T>(webhook: string, data: T ): Promise<any> {
    console.info(arguments);
    try {
        const res = await axios.request({
            url: webhook,
            method: 'post',
            data

        });
        console.log(res.data);
        return res;

    } catch (error) {
        throw (error);
    }
}