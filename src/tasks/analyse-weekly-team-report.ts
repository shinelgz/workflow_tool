import { GSheet } from '../vendors/googlesheet';
import { config } from '../config'
import { formatDate, getDateOfWeekDay, getDateStrByDay } from '../util';



enum Status {
    checked = '1',
    sent = '2',
}
const leaderCheckCeil = 'J1:J1';

export async function copyWeeklyReportSheet() {
    const gsheet = getSheet();
    await gsheet.auth();

    const newName = formatDate(getDateOfWeekDay(1), 'YYYY-MM-DD');
    const res = await gsheet.copySheet('tpl', newName);
    res && gsheet.moveTo(res?.data.sheetId!, 0);
}
export async function isChecked() {
    const value = (await getSheetDataListFor38(leaderCheckCeil))?.[0]?.[0];
    return value === Status.checked || value === Status.sent;
}

export async function isSent() {
    const value = (await getSheetDataListFor38(leaderCheckCeil))?.[0]?.[0];
    return value === Status.sent;
}

export async function isCurrentWeeklyReportOfNewReport() {
    const gsheet = getSheet();
    await gsheet.auth();
    const tabName = await gsheet.getSheetName(0);
    console.info(tabName, getDateStrByDay(1))
    return getDateStrByDay(1) === tabName
}

export async function updateSentStatus() {
    const gsheet = getSheet();
    await gsheet.auth();
    await gsheet.update([[Status.sent]], leaderCheckCeil);
}
/**
 * 检查周报填写结果
 * @returns 
 */
export async function checkTeamReportResult() {
    const data = await getTeamMemberChecklist();
    const result = [];
    const todoOwner: string[] = [];
    const checks = data?.at(0);
    const names = data?.at(1);
    checks?.forEach((item: string, index: number) => {
        result.push(item === 'TRUE' ? `🎉🎉 ${names?.[index]} 已完成` : `🙀❌ ${names?.[index]} 未完成`);
        if (item === 'FALSE') {
            todoOwner.push(names?.[index] ?? '');
        }
    });
    if (todoOwner.length === 0) {
        result.push('\n👏👏👏 很棒，都完成了！');
    } else {
        result.push('\n📢 请及时更新一下~');
    }
    return { result, todoOwner }
}

/**
 * 
 * @returns 获取数据文档最新内容
 */
async function getSheetDataListFor38(range = '') {
    const gsheet = getSheet();
    await gsheet.auth();
    // 获取第一个sheet
    const tabName = await gsheet.getSheetName(0);
    if (!tabName) {
        throw new Error('no any sheet!');;
    }
    const queryRange = range ? `${tabName}!${range}` : tabName;
    return gsheet.get(queryRange);
}

/**
 * 
 * @returns 获取团队填写 check 情况
 */
async function getTeamMemberChecklist() {
    return await getSheetDataListFor38('E1:I2');
}

function getSheet() {
    return new GSheet(config.SHEET_ID_38);

}