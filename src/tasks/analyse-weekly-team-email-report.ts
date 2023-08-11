import { GSheet } from '../vendors/googlesheet';
import { config, TemplateList, isTest } from '../config'

import { formatDate, getDateStrByDay } from '../util';
import handlebars from 'handlebars';
import fs from 'fs';
import { getSchedule, getTeamMembers } from './analyse-weekly-manpower';
import { getJiraBugList } from '../vendors/jira';
import { getOKRList } from '../vendors/okr/ork-resolve';
import { isChecked, isCurrentWeeklyReportOfNewReport, isSent, updateSentStatus } from './analyse-weekly-team-report';
import { sheets_v4 } from 'googleapis';
import { CacheMgr } from '../util/cache';

type reportDataType = { title: string, list: any[] };

const SUMMARY_TITLE = '本周概要';
const cacheMgr = new CacheMgr();
/**
 * 获取邮件成员列表
 * @returns string[]
 */
export async function getTeamMemberEmail() {
    if (isTest) {
        return [];
    }
    return (await getTeamMembers()).concat(config.WEEK_MAIL_OTHER_RECIVERS.split(',')).map(name => `${name}@{domain}`);
}
export async function getEmailContent() {
    await import('../util/handlebas-helpers');
    const header = getEmailHeaderContent();
    const summary = await getTeamWorkSummary();
    const teamWork = await getTeamWorkContent();
    const bugList = await getTeamIssuesContent();
    const keyWork = await getTeamOkrContent();
    const schedule = await getTeamCurrentScheduleContent();
    return render({ header, summary, teamWork, bugList, keyWork, schedule, teamOwner: config.TEAM_OWNER }, TemplateList.mailTpl);

}
export async function shouldSendReport() {
    if (isTest) return () => { };
    const newest = await isCurrentWeeklyReportOfNewReport();
    const checked = await isChecked();
    if (!newest || !checked) {
        throw new Error('周报内容还没准备好!');
    }
    const sent = await isSent();
    if (sent) {
        throw new Error('周报已发过，不能重复发!');
    }

    return updateSentStatus;
}

export function getEmailTitle() {
    const [lastStartDate, lastEndDate] = getLastWeekDateRange();
    return `${config.TEAM_NAME} 团队工作周报 ~【${lastStartDate}-${lastEndDate}】`;
}

function getEmailHeaderContent() {
    const [lastStartDate, lastEndDate] = getLastWeekDateRange();
    return render({ dateRange: `${lastStartDate}-${lastEndDate}`, teamName: config.TEAM_NAME }, TemplateList.headerTpl);
}
async function getTeamWorkContent() {
    const data = await getTeamWorkReportData();
    const list = data.filter(item => item.title !== SUMMARY_TITLE);
    return render(list, TemplateList.wokerTpl);
}
async function getTeamWorkSummary() {
    const data = await getTeamWorkReportData();
    const summaries = data.filter(item => item.title === SUMMARY_TITLE);
    const summary = summaries[0].list[0][0];
    if (summary?.text) {
        return render([summary], TemplateList.summaryTpl);
    }
    return '';
}
async function getTeamIssuesContent() {
    const data = await getTeamIsssuesFromJira();
    return render(data, TemplateList.issueTpl);
}

export async function getTeamOkrContent() {
    const data = await getOKRList();
    return render(data, TemplateList.okrTpl);
}
async function getTeamCurrentScheduleContent() {
    const developers: string[] = await getTeamMembers();
    const startDate = getDateStrByDay(1);
    const endDate = getDateStrByDay(7);
    const { taskList, subTaskSummaries } = await getSchedule(startDate, endDate, developers);
    const list = taskList.map(({ link, summary, startDate, storyPoint, endDate, developer, roleIndex }, index) => {
        const subTaskSummary = subTaskSummaries[index].replace(/,\s*[\.\d]+,\s*[^；]*\s*；?/g, '；');
        return { summary, link, startDate: formatDate(startDate), endDate: formatDate(endDate), storyPoint, developer, subTaskSummary, step: (roleIndex as number) % 2 }

    })
    return render({ dateRange: `${startDate} ~ ${endDate}`, list }, TemplateList.scheduleTpl);
}
/**
 * 将团队工作内容处理化 [{title, list: [{text, link?}]}]
 */
async function getTeamWorkReportData() {
    const key = `_8765432_${config.SHEET_ID_38}`
    if (cacheMgr.has(key)) {
        return cacheMgr.get(key) as reportDataType[];
    }
    const data = await getSheetFullDataOfWorkList();
    const result: reportDataType[] = [];
    const reg = /#.+【([^】]+)】/
    let index = -1;
    data?.filter(item => item.values?.at(0)?.formattedValue).forEach(item => {
        const { values } = item;
        const mth = values![0].formattedValue?.match(reg);
        if (mth && mth.length > 0) {
            index++;
            result.push({ title: mth[1], list: [] });
        } else if (index !== -1) {
            // 可能数据长度不足
            values?.push({}, {}, {})
            const [
                { formattedValue, hyperlink },
                { formattedValue: formattedValue2, textFormatRuns },
                { formattedValue: formattedValue3 }
            ] = values!;

            result[index].list.push([
                { text: formattedValue, link: hyperlink },
                { text: extractFormatter(formattedValue2!, textFormatRuns) },
                { text: formattedValue3 }
            ]);
        }
    });
    cacheMgr.set(key, result);
    return result;
}
/**
 * 获取团队的一周的bug列表
 */
async function getTeamIsssuesFromJira() {
    const developers: string[] = await getTeamMembers();
    const [lastStartDate, lastEndDate] = getLastWeekDateRange();
    const all = developers.map(developer => getJiraBugList(developer, lastStartDate, lastEndDate));
    return (await Promise.all(all)).flat();
}

function render(data: Object, htmlTpl: string) {
    const tpl = fs.readFileSync(htmlTpl).toString();
    const template = handlebars.compile(tpl, { noEscape: true });
    return template(data);
}

/**
 * 
 * @returns 
 */
async function getSheetFullDataListFor38() {
    const gsheet = getSheet();
    await gsheet.auth();
    // 获取第一个sheet
    const tabName = await gsheet.getSheetName(0);
    if (!tabName) {
        throw new Error('no any sheet!');;
    }

    return gsheet.getFullData(tabName);
}

/**
 * 
 * @returns 获取团队工作内容
 */
async function getSheetFullDataOfWorkList() {
    const list = await getSheetFullDataListFor38();
    list?.splice(0, 2);
    return list;
}


function getLastWeekDateRange() {
    const lastWeekDate = new Date(Date.now() - 1 * 7 * 24 * 60 * 60 * 1000);
    const lastStartDate = getDateStrByDay(1, lastWeekDate);
    const lastEndDate = getDateStrByDay(7, lastWeekDate);
    return [lastStartDate, lastEndDate]
}

function extractFormatter(text: string, formatter?: sheets_v4.Schema$TextFormatRun[]) {
    if (!formatter || !text) {
        return text;
    }
    let cursor = 0;
    formatter?.forEach((cur, index, arr) => {
        const { startIndex, format } = cur;
        if (startIndex !== undefined && startIndex !== null && format?.link) {
            const endIndex = arr[index + 1]?.startIndex;

            const formatText = endIndex ? text.slice(startIndex + cursor, endIndex + cursor) : text.slice(startIndex + cursor);
            const formatRes = `<a href="${format.link.uri}">${formatText}</a>`;
            text = text.slice(0, startIndex + cursor) + formatRes + (endIndex ? text.slice(endIndex + cursor) : '');
            cursor += formatRes.length - formatText.length;
        }
    })
    return text;
}

function getSheet() {
    return new GSheet(config.SHEET_ID_38);
}