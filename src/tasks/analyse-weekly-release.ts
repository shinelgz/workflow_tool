
import { config } from "../config";
import { GSheet } from "../vendors/googlesheet";
import { getCurrentWeekReleasePlans, getHasReleaseBusizList } from "../vendors/startfish";
import { formatDate, getDateOfWeekDay } from "../util";
import { CacheMgr } from "../util/cache";

interface ProjRet {
    name: string,
    owner: string,
    release: boolean,
    okCnt: number,
    errCnt: number,
    cannotCnt: number,
    notCompleteCnt: number;
}


const fieldCount = 7;

/*
[
    [
        mod_number | checker : number | boolean | ''
        mod_name: string | ''
        point : string | ''
        indicator: string,
        pic : string,
        type : '系统红线' | '新增功能' | '改动功能',
        result : '正常' | '异常' | '无法验证'
    ]
*/
const cache/*: { data37?: { data?: string[][], checkdate: any[] } }*/ = new CacheMgr();
const CACHE_Key = 'data73';

/**
 * 分析发布的验收提前工作情况
 * @returns 
 */
export async function preparationWork(): Promise<{ result: string[]; todoOwner: string[]; }> {
    const { data, /*checkdate: [firstDate]*/ } = await getSheetDataListFor37();

    const result: string[] = [];
    const todoOwner: string[] = [];
    data?.forEach((item: string[], index: number, arr: string[][]) => {
        const isModRow = item[0] && !Number.isNaN(Number(item[0]));
        // 说明该行是模块的开始
        if (isModRow) {
            const isCheck = arr[index + 1][0] === 'TRUE' || arr[index + 2][0] === 'TRUE';
            result.push(`${isCheck ? '✅ 已完成' : '❌ 未完成'}：${item[1]}，@${item[4]}`);
            if (!isCheck) {
                todoOwner.push(`${item[4]}@{domain}`);
            }
        }
    })
    return { result, todoOwner };
}
/**
 * 发布后，验收结果
 */
export async function checkResultWork(ignoreCheckTime = false): Promise<{ result: string[], todoOwn: string[] }> {
    const { data, checkdate: [, secondDate, thirdDate] } = await getSheetDataListFor37();

    if (!ignoreCheckTime && !isRightDateByToday(secondDate) && !isRightDateByToday(thirdDate)) {
        throw new Error('not the right date');
    }

    const projResult: ProjRet[] = [];
    const todoOwn: string[] = [];
    let currModule = 0;
    data?.forEach((item: string[], index: number, arr: string[][]) => {
        const isModRow = item[0] && !Number.isNaN(Number(item[0]));
        if (!item[3]) {
            return;
        }
        // 说明该行是模块的开始
        if (isModRow) {
            // 是否有发布
            const release = arr[index + 1][0] === 'TRUE' && arr[index + 2][0] === 'FALSE';
            projResult[(item[0] as unknown as number)] = createProjRet(item[1], item[4], release)
            currModule = Number(item[0]);
        }
        // 该模块有发布
        const curProj = projResult[currModule];
        if (projResult[currModule].release === true) {
            // 没结果
            const checkRet = item[6]?.trim();
            switch (checkRet) {
                case '异常':
                    curProj.errCnt += 1;
                    break;
                case '正常':
                    curProj.okCnt += 1;
                    break;
                case '无法验证':
                    curProj.cannotCnt += 1;
                    break;
                default:
                    curProj.notCompleteCnt += 1;
                    item[4] && todoOwn.push(`${item[4]}@{domain}`)
                    break;
            }
        }
    })
    const result: string[] = projResult.map(item => checkResultFormatter(item));
    if (todoOwn.length > 0) {
        result.push('请未完成验收的及时处理并切换状态！');
    }
    console.info(result, todoOwn);

    return { result, todoOwn }
}
/**
 * 是否可以发送收集验收清单的消息
 */
export async function shouldSendCollectMessage() {
    const { checkdate: [firstDate] } = await getSheetDataListFor37();
    if (!isRightDateByToday(firstDate)) {
        throw new Error('not the right date');
    }
}
/**
 * 固定周三发布，基本日期的发布暂时不考虑在内，所以在copy该sheet时，也只考虑周三
 * 如果不是发布前一天，或者本周没有发布，就不会进行COPY
 */
export async function willCopyWeeklyCollectSheet() {
    const gsheet = getSheet();
    await gsheet.auth();
    const plans = await getCurrentWeekReleasePlans();
    //过虑出周三的发版计划
    const plan = plans.filter(plan => (new Date(plan.full_release_date)).getDay() === 3);
    // 没有计划就不进行copy了
    if (!plan) {
        return;
    }
    //sheet有变化 ，清理 一下缓存
    cache.del(CACHE_Key);
    // 有三周的发版计划
    const newName = formatDate(getDateOfWeekDay(3), 'YYYY.MM.DD');
    // 会自动判断去重
    const res = await gsheet.copySheet('tpl', newName);
    await res && gsheet.moveTo(res?.data.sheetId!, 0);
}

export async function hasReleasePlan() {
    const list = await getCurrentWeekReleasePlans();
    return list.length > 0;
}
/**
 * 发布提醒 
 * @returns 
 */
export async function getReleasePlanTip() {
    const list = await getCurrentWeekReleasePlans();
    const all = list.map(async (item, index: number) => {
        return getReleaseBus(item.release_date).then(res => {
            const mys = filterMyBuz(res);
            if (mys.length > 0) {
                return `发布日期：${item.full_release_date}，\n涉及业务：${mys.join('、')}，\n发布的CodeCheck清单：https://{domain}/release-checker?date=${item.release_date}&team=`;
            } else {
                return null;
            }
        });
    });
    const ret = await Promise.all(all);
    return ret.filter(item => item !== null).map((tip, index) => `${index + 1}: ${tip}`)
}

async function getReleaseBus(date: string) {
    // const plans = await getCurrentWeekReleasePlans()
    const { release_plans } = await getHasReleaseBusizList(date)
    const result = Object.keys(release_plans).map((key: string) => {
        if (release_plans[key].is_deleted || Object.keys(release_plans[key].jira_tickets ?? {}).length === 0) {
            return '';
        }
        const res = key.match(/(\w+)-/);
        if (res?.[1]) {
            return res[1].toLocaleLowerCase();
        }
        return key.split('.')[1];
    })

    return Array.from(new Set(result)).filter(item => item);

}
/**
 * 
 * @returns 获取数据
 */
async function getSheetDataListFor37() {
    const gsheet = getSheet();
    await gsheet.auth();
    // 获取第一个sheet
    const tabName = await gsheet.getSheetName(0);
    if (!tabName) {
        throw new Error('no any sheet!');;
    }
    if (cache.has(CACHE_Key)) {
        return cache.get(CACHE_Key);
    }

    const sheetData = await gsheet.get(tabName);
    //检查结果的日期，因为发布日期会改变，所以检查日期为标签页日期以 + 此处的日期
    const checkResultDateExt = sheetData?.[0][5];

    sheetData?.splice(0, 3).map((item: string[]) => item.fill('', item.length, fieldCount));
    cache.set(CACHE_Key, { data: sheetData, checkdate: createChecklist(tabName, checkResultDateExt) });
    return cache.get(CACHE_Key);
}

/**
 * 
 * @param name 
 * @param owner 
 * @param release 
 * @returns 
 */
function createProjRet(name: string, owner: string, release: boolean) {
    return {
        name,
        owner,
        release,
        okCnt: 0,
        errCnt: 0,
        cannotCnt: 0,
        notCompleteCnt: 0,
    }
}
/**
 * 
 * @param item 
 * @returns 
 */
function checkResultFormatter(item: ProjRet) {
    if (!item.release) {
        return `🌏 ${item.name} 无发布；`;
    }
    if (item.cannotCnt === 0 && item.errCnt === 0 && item.notCompleteCnt === 0) {
        return `✅ ${item.name} 验收正常，验证点 ${item.okCnt} 个；`;
    } else {
        return `❌ ${item.name} 未完成验收，正常 ${item.okCnt} 个，异常 ${item.errCnt} 个，无法验收 ${item.cannotCnt} 个，未完成验收 ${item.notCompleteCnt} 个；`
    }
}
/**
 * 跟着文档的tab的日期，才发送消息
 * @param date 
 * @returns 
 */
function isRightDateByToday(date: Date) {
    if (!date) {
        return false;
    }
    const now = new Date();
    return now.getFullYear() === date.getFullYear()
        && now.getMonth() === date.getMonth()
        && now.getDate() === date.getDate();
}

/**
 * 
 * @param dtstr 
 * @param exdtstr 
 * @returns [发送【收集验收清单】时间，发送【验收结果】结果， 发送【验收结果】结果]
 */
function createChecklist(dtstr: string, exdtstr: string) {
    const first = new Date(dtstr);
    const second = new Date(dtstr);
    const third = exdtstr ? new Date(exdtstr) : null;

    first.setDate(first.getDate() - 1);
    console.info(dtstr, first, second, third);

    return [first, second, third];
}

function filterMyBuz(buzs: string[]) {
    const my = 'lbs|lcs|lfs|lps|pis|smr|tracking|wbc'.split('|');
    return buzs.filter(buz => !!my.find((item => item === buz)));
}

function getSheet() {
    return new GSheet(config.SHEET_ID_37);
}