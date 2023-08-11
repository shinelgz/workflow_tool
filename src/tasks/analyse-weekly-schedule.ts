import { TemplateList, getAllTeamMembers, isTest, getAllTeamsConfig, switchConfig } from "../config";
import { getChinaDateDay, getDateStrByDay, increaseByDays } from "../util";
import { Debug } from "../util/debug";
import { render } from "../util/handlebas-helpers";
import { getSchedule } from "./analyse-weekly-manpower";
import { team } from "../params";
import { getTeamOkrContent } from "./analyse-weekly-team-email-report";
const debug = new Debug();
// 算排期表的天数
const DAY_CNT = 14
const TOTAL_CEIL_CNT = DAY_CNT * 2 + 1;
/**
 * 团队人力视图
 * @param schedueDate 
 * @returns 
 */
export async function createTeamSchedule(schedueDate: Date) {
    const { members: teams } = getAllTeamMembers();
    const dateList = getDateList(schedueDate);
    const allConfig = getAllTeamsConfig();
    const teamConfig = allConfig[`gant-${team}`];
    const teamNames = teamConfig['TEAM'].split(',')
    const data: any[] = [];
    for (const name of teamNames) {
        data.push({ name: `${allConfig[name]['TEAM_NAME']} 项目`, step: TOTAL_CEIL_CNT });
        data.push(...await getTeamCurrentSchedule(teams[name], schedueDate));
    }
    return render({ schedules: data, dateList }, TemplateList.scheduleGantTpl);
}
/**
 * 团队OKR工作
 * @returns 
 */
export async function createTeamsKeyWork() {
    const allConfig = getAllTeamsConfig();
    const teamConfig = allConfig[`gant-${team}`];
    const teamNames = teamConfig['TEAM'].split(',')
    const result = [];
    for (const name of teamNames) {
        // 切换到对应团队的配置
        const config = switchConfig(name);
        // 获取数据
        const okr = await getTeamOkrContent();
        const res = render({ title: `${config.TEAM_NAME} 重要工作进展`, okr }, TemplateList.teamsOkrTpl);
        result.push(res);
    }
    return result.join('');
}
/**
 * 人力视图和OKR工作情况
 * @param date 
 * @returns 
 */
export async function createScheduleAndKeyWork(date: Date) {
    const schedule = await createTeamSchedule(date);
    const keyWork = await createTeamsKeyWork();
    return render({ schedule, keyWork }, TemplateList.scheduleAndOkrTpl);
}

export function getScheduleGantEmailTitle(schedueDate: Date) {
    const allConfig = getAllTeamsConfig();
    const teamName = team;
    const teamConfig = allConfig[`gant-${team}`]
    const name = teamConfig['TEAM_NAME'];
    return `${name} 人力视图 - ${getDateStrByDay(1, schedueDate)}~${getDateStrByDay(DAY_CNT, schedueDate)}`;
}

export function getScheduleAndOkrEmailTitle(schedueDate: Date) {
    const allConfig = getAllTeamsConfig();
    const teamName = team;
    const teamConfig = allConfig[`gant-${team}`]
    const name = teamConfig['TEAM_NAME'];
    return `${name} 人力视图&重要工作进展 - ${getDateStrByDay(1, schedueDate)}~${getDateStrByDay(DAY_CNT, schedueDate)}`;
}

export function getTeamMemberList() {
    if (isTest) {
        return [];
    }
    const allConfig = getAllTeamsConfig();
    const teamConfig = allConfig[`gant-${team}`];
    const teamNames = teamConfig['TEAM'].split(',')

    const { members, cc, owners } = getAllTeamMembers();
    const names: string[] = [];
    teamNames.forEach((team: string) => {
        names.push(...members[team]);
        names.push(...cc[team]);
        names.push(...owners[team]);
    });

    return Array.from(new Set(names)).filter(name => name !== '').map(name => `${name}@{domain}`);

}
/**
 * 获取当周的排期情况
 * @param teamMembers 
 * @returns 
 */
async function getTeamCurrentSchedule(teamMembers: string[], schedueDate: Date) {

    const startDate = getDateStrByDay(1, schedueDate);
    const endDate = getDateStrByDay(DAY_CNT, schedueDate);
    const { taskList } = await getSchedule(startDate, endDate, teamMembers);
    const scheduleByMember: Record<string, Record<'summary' | 'link' | 'start' | 'step' | 'startDate' | 'storyPoint', any>[]> = {};
    taskList.forEach(({ link, summary, startDate, storyPoint, endDate, developer, roleIndex }, index) => {
        if (!storyPoint) return;
        if (!scheduleByMember[developer!]) {
            scheduleByMember[developer!] = [];
        }
        const start = (getChinaDateDay(startDate, schedueDate) - 1) * 2
        // console.info(developer, startDate.toLocaleString(), endDate.toLocaleString(), Math.ceil(storyPoint / 0.5), (((endDate.getTime() - startDate.getTime()) / 86400000) + 1) / 0.5);
        scheduleByMember[developer!].push({
            summary, link, start, startDate,
            // 按工作量画工时图
            // step: Math.ceil(storyPoint / 0.5),
            // 按起始时间画工时图
            step: Math.ceil(Math.min((((endDate.getTime() - startDate.getTime()) / 86400000) + 1) / 0.5, 14)),
            storyPoint
        })
    })

    teamMembers.forEach(name => {
        if (!scheduleByMember[name]) {
            scheduleByMember[name] = [];
        }
    })
    const firtDate = new Date(startDate);
    return Object.keys(scheduleByMember).map(name => {
        if (name === 'junhan.shi') {
            debug.enable();
        } else debug.close();
        const schedule = calculateInterval(scheduleByMember[name], name, firtDate);
        debug.info(schedule);
        return { name, schedule }
    })
}

/**
 * 计算表格的合并，合并情况由start,step决定
 * @param intervals 
 * @param firtDate 排期表的第一天
 * @returns {
 *  start 开始列索引，即开始合并的单元格索引
 *  step  合并列数，即合并的单元格格数
 * }
 */
function calculateInterval(intervals: any[], name: string, firtDate: Date) {
    if (!intervals || intervals.length === 0) return padEmptySchedule(DAY_CNT, firtDate);
    // 先按开始时间排序
    const sortedIntervals = intervals.sort((a, b) => a.start - b.start);

    const firtInterval = sortedIntervals.at(0);
    firtInterval.date = createDateByCeilStart(firtDate, firtInterval.start)
    const res = [firtInterval];

    sortedIntervals.reduce((preInterval, interval, index) => {
        debug.info(1, preInterval, interval, index);
        // if (index === 0) return preInterval;
        const lastEnd = preInterval.start + preInterval.step;
        // 如果没有连接
        if (interval.start > lastEnd) {
            res.push(...createEmptyStep(lastEnd, interval.start - (lastEnd), name, firtDate))
            interval.date = createDateByCeilStart(firtDate, interval.start)
            res.push(interval);
            // 刚好连接
        } else if (interval.start === lastEnd) {
            interval.date = createDateByCeilStart(firtDate, interval.start)
            res.push(interval)
        } else {
            // 有交叉
            preInterval.step = Math.max(preInterval.start + preInterval.step, interval.start + interval.step) - preInterval.start
            if (Array.isArray(preInterval.summary)) {
                preInterval.summary.push({ summary: interval.summary, link: interval.link, storyPoint: interval.storyPoint });
            } else {
                preInterval.summary = [{ summary: preInterval.summary, link: preInterval.link, storyPoint: preInterval.storyPoint }, { summary: interval.summary, link: interval.link, storyPoint: interval.storyPoint }];
            }
            // 因为更新的是preinterval的step，所以返回这个作为下一轮的参照物
            return preInterval;
        }
        return interval;
    });
    // 补开头
    if (res[0].start !== 0) {
        res.unshift(...createEmptyStep(0, res[0].start, name, firtDate))
    }
    // 补结尾
    let last = res.at(-1);
    let lastStepIndex = last.start + last.step;
    if (lastStepIndex < TOTAL_CEIL_CNT - 4) {
        res.push(...createEmptyStep(lastStepIndex, TOTAL_CEIL_CNT - 4 - lastStepIndex + 1, name, firtDate))
    }
    // 补周未
    last = res.at(-1);
    lastStepIndex = last.start + last.step;
    if (lastStepIndex < TOTAL_CEIL_CNT - 2) {
        res.push(...createEmptyStep(lastStepIndex, TOTAL_CEIL_CNT - 2 - lastStepIndex + 1, name, firtDate))
    }
    return res;
}
/**
 * 获取本周的日期，从周一到周日的列表
 * @returns []
 */
function getDateList(schedueDate: Date) {
    const list = new Array(DAY_CNT).fill(0);
    return list.map((item, index) => getDateStrByDay(index + 1, schedueDate, 'MM-DD'));

}
/**
 * 如果没有任何排期信息，则直接留空，返回空step数组
 * @param days 
 * @returns 
 */
function padEmptySchedule(days: number, firtDate: Date) {
    return new Array(days).fill(0).map((item, index) => ({
        step: 2,
        start: index,
        date: createDateByCeilStart(firtDate, index * 2)
    }))
}

/**
 * 为了美化格式，没有排期的空格就不进行合并
 * @param start 
 * @param step 
 */
function createEmptyStep(start: number, step: number, name: string, firtDate: Date) {
    debug.info(arguments);
    const res = [];
    let stepLeft = step;
    let newStart = start;
    if (start % 2 != 0) {
        // 剩下半格
        res.push({
            start,
            step: 1,
            date: createDateByCeilStart(firtDate, start - 1)
        })
        stepLeft -= 1;
        newStart += 1;
    }
    // 双格一跳
    for (let i = 0, cnt = stepLeft / 2; i < cnt; i++) {
        res.push({
            start: newStart,
            step: 2,
            date: createDateByCeilStart(firtDate, newStart)
        })
        newStart += 2;
    }
    debug.info(res);
    return res;
}

function createDateByCeilStart(date: Date, start: number) {
    return increaseByDays(date, (start) / 2)
}