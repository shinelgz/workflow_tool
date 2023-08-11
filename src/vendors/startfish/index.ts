
import { getDateOfWeekDay } from '../../util';
import transfer from './transfer';

const RELEASE_PLAN_API = 'https://{domain}/api/get/release/list-by-date-range'
const CODE_CHECK = 'https://{domain}/api/get/release/info';

interface ReleasePlans {
    release_date: string,
    full_release_date: string,
    id: number,
    team: string
}

export async function getCurrentWeekReleasePlans(): Promise<ReleasePlans[]> {
    const startTime = getDateOfWeekDay(1).getTime();
    const endTime = getDateOfWeekDay(5).getTime();
    const { data: { data } } = await transfer(RELEASE_PLAN_API, {
        startTime,
        endTime,
        team: ''
    })

    return data.map((item: Record<string, string | number>) => {
        item.full_release_date = `20${item.release_date}`.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3')
        return item;
    })

}

export async function getHasReleaseBusizList(releaseDate: string) {
    const { data: { data: { content } } } = await transfer(CODE_CHECK, {
        release_date: releaseDate,
        team: ''
    })
    return JSON.parse(content);
}

