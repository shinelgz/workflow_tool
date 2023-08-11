import { config, tConfigKey } from "../config";
import { GSheet } from "../vendors/googlesheet";
import { getJiraList, isTaskAvail } from "../vendors/jira";
import { sendTextMessage } from "../vendors/seatalk";
import { formatDate, getDateListByDayWeekly, getDateStrByDay, wait } from "../util";
import { Task } from "../vendors/jira/types";

import { seatalk_webhook, content, getContent } from '../params';

const SHEET_NAME = 'weekly-schedule';
const TEAM_MEMBER_RANGE = 'Info!D1:D1';

const dataInitStartRow = 3;

export async function analyseManpower() {
    await sendTextMessage(seatalk_webhook!, { content: getContent(), at_all: true }).catch((error: any) => {
        console.error(error);
    });
}

export async function updateSchedule() {
    const gsheet = getSheet();
    await gsheet.auth();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 30);
    const dateList = getDateListByDayWeekly<string>(startDate, 1, 6, 'YYYY-MM-DD')
    console.info(dateList);
    const res = (await gsheet.get(`${SHEET_NAME}`))?.slice(dataInitStartRow - 1);
    const group: Record<string, { date: string, startRowIndex: number, data: any[] }> = {};
    let curGroupName = '';

    res?.forEach((item, index) => {
        if (item && item.length > 0) {
            const groupName = item[0].trim().split(/\s/).at(0);
            if (groupName && !group[groupName]) {
                curGroupName = groupName;
                group[curGroupName] = {
                    date: groupName,
                    startRowIndex: dataInitStartRow + index,
                    data: []
                };
            }
        }
        group[curGroupName] && group[curGroupName].data.push(item);
    });

    // 插入空的日期数据,并计算insertRowIndex
    let curRowIndex = dataInitStartRow;
    let allGroupArr: any[] = [];
    dateList.forEach(date => {
        if (group[date]) {
            curRowIndex += group[date].data.length;
        } else {
            group[date] = {
                date,
                startRowIndex: curRowIndex,
                data: []
            }
        }
        allGroupArr.push(group[date])
    });
    const developers: string[] = await getTeamMembers();

    let i = allGroupArr.length - 1;

    for (; i >= 0; i--) {
        const row = allGroupArr[i];
        const startdate = row.date;
        // console.info(row);
        const endDate = getDateStrByDay(5, new Date(startdate))

        const { data: { length }, startRowIndex } = row;
        //原来的数据条数
        await gsheet.deleteRow(startRowIndex, length, SHEET_NAME);
        await loadDataAndInsert(startdate, endDate, startRowIndex, developers);
        // 调用频率太高，会被拒绝
        (i % 6 === 0) && await wait(15);
    }
    await gsheet.update([[`最近更新时间：${formatDate(new Date(), 'YYYY-MM-DD hh:mi:ss')}`]], `${SHEET_NAME}!C1:C1`)
}
/**
 * 
 * @param date 
 * @param insertRowIndex 
 */
async function loadDataAndInsert(startDate: string, endDate: string, insertRowIndex: number, developers: string[]) {
    const gsheet = getSheet();
    // 加载所有的开发者的数据
    const { taskList, subTaskSummaries } = await getSchedule(startDate, endDate, developers);
    let res;
    // 无数据
    if (taskList.length === 0) {
        if (startDate > getDateStrByDay(1)) {
            return;
        }
        res = [[`${startDate} \n ~ \n ${endDate}`, 1, '本周无排期']];
    } else {
        res = taskList.map(item => {
            const { dateRange, index, link, summary, startDate, storyPoint, endDate, resolutiondate, status, developer, weekWorkLoad } = item;
            return [dateRange, index, `=HYPERLINK("${link}","${summary}")`, formatDate(startDate), storyPoint, formatDate(endDate), resolutiondate, status, developer, weekWorkLoad]
        });
    }

    const rowCnt = res.length + 1;
    await gsheet.createRow(insertRowIndex, rowCnt, SHEET_NAME);
    await wait(5);
    await gsheet.append(res, `${SHEET_NAME}!A${insertRowIndex}:H${insertRowIndex}`, 'OVERWRITE');
    await wait(5);
    await gsheet.mergeCeil(insertRowIndex, rowCnt, 1, 1, SHEET_NAME);
    const colorOptions = await calcUpdateCeilOptions(res, insertRowIndex, SHEET_NAME);
    if (colorOptions.length > 0) {
        await gsheet.batchUpdate(colorOptions);
        await wait(5);
    }
    const commentOptions = await calcUpdateSummaryCommentOptions(subTaskSummaries, insertRowIndex, SHEET_NAME);
    const mergeOptions = await calcWorkLoadCeilMergeOptions(res, insertRowIndex, SHEET_NAME);
    const allOptions = commentOptions.concat(mergeOptions)
    if (allOptions.length > 0) {
        await gsheet.batchUpdate(colorOptions.concat(allOptions));
    }
}

export async function getSchedule(startDate: string, endDate: string, developers: string[]) {
    // 加载所有的开发者的数据
    const all: Promise<any>[] = developers.map(developer => getJiraList(developer, startDate, endDate));
    let subTaskSummaries: string[] = [];
    const now = getDateStrByDay(1);
    const isFuture = startDate > now;
    const taskList = (await Promise.all(all)).map((group: Task[], index: number) => {
        //sss group.sort((task1: Task, task2: Task) => {
        //     // 按 开始时间 排序
        //     return +new Date(task1.startDate.sort().at(0)!) - +new Date(task2.startDate.sort().at(0)!)
        // });
        // 汇总工作量,并将周工作量放在第一个task上，其他 task没有周工作，在sheet上合并单元格显示
        if (group.length >= 1) {
            group[0].weekWorkLoad = group
                .filter(task => isTaskAvail(task)).reduce((total, task) => total + task.storyPoint, 0)
        }
        group.forEach(task => { task.roleIndex = index });
        return group;
    }).flat().map((task: Task, index: number) => {
        const {
            link, summary, storyPoint,
            startDate: tStartDate,
            endDate: tEndDate,
            developer, status, resolutiondate, weekWorkLoad,
            roleIndex,
        } = task;

        const subtaskListStr = task.subTask?.map((item, index) => `${index + 1}. ${item.summary}, ${item.storyPoint}, ${item.status}`).join('；\n') ?? '';
        subTaskSummaries.push('subtask列表：\n' + subtaskListStr);
        return {
            dateRange: index === 0 ? `${startDate} \n ~ \n ${endDate}${isFuture ? '(预)' : ''}` : '',
            index: index + 1,
            // hyperlink: `=HYPERLINK("${key}","${summary.replace(/"/g, '\'')}")`,
            link,
            summary: summary.replace(/"/g, '\''),
            startDate: tStartDate, //sss.sort().at(0),
            storyPoint,
            endDate: tEndDate, //sss.sort((i: any, j: any) => i - j).at(0),
            resolutiondate: resolutiondate ? formatDate(new Date(resolutiondate!)) : '',
            status,
            developer,
            weekWorkLoad: weekWorkLoad ?? '',
            roleIndex,
        };
    })
    return { taskList, subTaskSummaries };
}
async function calcUpdateSummaryCommentOptions(commentList: string[], startRowIndex: number, sheetName: string) {
    const options: any[] = [];
    const gsheet = getSheet();
    const sheetId = await gsheet.getSheetIdByName(sheetName);
    commentList.forEach((comment, index) => {
        if (!comment) {
            return [];
        }
        options.push({
            repeatCell: {
                range: {
                    sheetId,
                    startRowIndex: startRowIndex + index - 1,
                    endRowIndex: startRowIndex + index,
                    startColumnIndex: 2,
                    endColumnIndex: 3
                },
                cell: {
                    note: comment
                },
                fields: 'note'
            }
        })
    });
    return options;
}
/**
 * 
 * @param dataList 
 * @param startRowIndex 
 * @param sheetName 
 */
async function calcUpdateCeilOptions(dataList: any[][], startRowIndex: number, sheetName: string) {
    const options: any[] = [];
    let color;
    const gsheet = getSheet();
    const sheetId = await gsheet.getSheetIdByName(sheetName);
    dataList.forEach((item, index) => {
        if (!item[6] || !item[5]) {
            return [];
        }
        if ((+new Date(item[5]) + 2 * 86400000) >= +new Date(item[6])) {
            color = '#000000'
        } else {
            color = '#ff0000'
        }
        options.push({
            repeatCell: {
                range: {
                    sheetId,
                    startRowIndex: startRowIndex + index - 1,
                    endRowIndex: startRowIndex + index,
                    startColumnIndex: 6,
                    endColumnIndex: 7
                },
                cell: {
                    userEnteredFormat: {
                        textFormat: {
                            foregroundColor: {
                                red: parseInt(color.substring(1, 3), 16) / 255,
                                green: parseInt(color.substring(3, 5), 16) / 255,
                                blue: parseInt(color.substring(5, 7), 16) / 255
                            }
                        }
                    },
                },
                fields: 'userEnteredFormat.textFormat'
            }
        })
        color === '#ff0000' && options.push({
            repeatCell: {
                range: {
                    sheetId,
                    startRowIndex: startRowIndex + index - 1,
                    endRowIndex: startRowIndex + index,
                    startColumnIndex: 6,
                    endColumnIndex: 7
                },
                cell: {
                    note: '比计划晚了2+天，延期完成，注意及时切换 subtask 状态'
                },
                fields: 'note'
            }
        })
    })
    return options;
}

async function calcWorkLoadCeilMergeOptions(dataList: any[], startRowIndex: number, sheetName: string) {
    const gsheet = getSheet();
    const sheetId = await gsheet.getSheetIdByName(sheetName);
    const positionList: number[] = [];
    const endRow = startRowIndex + dataList.length - 1;
    dataList.forEach((item, index) => {
        // the week work load
        if (item[9]) {
            positionList.push(startRowIndex + index - 1)
        }
    })

    return positionList.map((startRowIndex, index, arr) => {
        return {
            mergeCells: {
                range: {
                    sheetId,
                    startRowIndex,
                    endRowIndex: arr[index + 1] ?? endRow,
                    startColumnIndex: 9,
                    endColumnIndex: 10
                },
                mergeType: 'MERGE_ALL'
            }
        }
    });

}

export async function getTeamMembers(): Promise<string[]> {
    const gsheet = getSheet();
    await gsheet.auth();
    return (await gsheet.get(TEAM_MEMBER_RANGE))?.flat().at(0)?.split(',').map((name: string) => name.trim()).slice(1) ?? [];

}


function getSheet() {
    return new GSheet(config.SHEET_ID_39);
}