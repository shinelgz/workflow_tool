

import axios from "axios";
import { cleanTime, formatDate, getDateByExpire, splitByHoliday } from "../../util";
import { SearchResponse, Subtask, Task } from "./types";
import { Debug } from "../../util/debug";

const url = 'https://{jira domain}/rest/api/2/search';
const filterApi = 'https://{jira domain}/rest/api/2/filter';
const viewUrl = 'https://{jira domain}/browse';

export enum TaskStatus {
    TODO = 'TO DO',
    Done = 'Done',
    Doing = 'Doing',
    Closed = 'Closed',
}
/**
 * 
 * @param developer 
 * @param date 2012-12-12 or a date instance
 * @returns 
 */

const debug = new Debug();
// debug.enable();
/**
 * 返回 task
 * @param developer 
 * @param startDate 
 * @param endDate 
 * @returns 
 */
export async function getJiraList(developer: string, startDate: string, endDate: string) {
    if (developer === 'xxxx') {
        debug.enable();
    } else {
        debug.close();
    }
    // 子项目列表
    const { data: { issues } } = await searchByDeveloper(developer, startDate, endDate);
    debug.forceLog(`raw data of jira for ${developer}: `, issues);
    // 标准化时间字段
    let list = solveDateFields(issues);
    // 去掉 法定假期
    list = splitSubtaskByHoliday(list);
    // 处理跨周期的需求为只本周期的需求
    list = pickupCurrentWeekSubTasks(list, startDate, endDate);
    // 按开始时间排序
    list = list.sort((issue1, issue2) => issue1.startDate.getTime() - issue2.startDate.getTime());

    // 抽取需要的字段
    const subTaskList = list.map((item) => {
        const {
            key: subKey, startDate, endDate,
            fields: {
                summary: subSummary,
                customfield_10100: subStoryPoint,
                status: { name: status },
                resolutiondate
            }
        } = item;

        const {
            customfield_10100: storyPoint,
            parent: { key, fields: { summary } }
        } = item.fields;

        return {
            // 任务名称展示时，以 task 的信息来展示
            summary,
            key,
            link: `${viewUrl}/${key}`, // parent key
            storyPoint: isTaskAvail(status) ? storyPoint : 0,
            status: solveToDo(status),
            developer,
            resolutiondate: resolutiondate,
            startDate,
            endDate,
            subTask: [{
                key: subKey,
                link: `${viewUrl}/${subKey}`,
                status: solveToDo(status),
                summary: subSummary,
                startDate,
                endDate,
                resolutiondate,
                storyPoint: subStoryPoint
            }],
        } as Task;
    });
    const taskList: Task[] = [];

    subTaskList.forEach(task => {
        mergeSubtask(taskList, task);
    })
    debug.forceLog(`data processed of jira for ${developer}: `, taskList);
    return taskList;

}

export async function getJiraBugList(developer: string, startDate: string, endDate: string) {


    const { data: { issues } } = await searchBugByDeveloper(developer, startDate, endDate);
    const bugList = issues.map((item) => {
        const { key, fields: { summary: title, customfield_10100: subStoryPoint, status: { name: status }, resolutiondate } } = item;
        return {
            key,
            summary: title,
            status: solveToDo(status),
        }
    });

    return bugList;
}
/**
 * 通过 filter 获取数据
 * @param filterId 
 * @returns 
 */
export async function getFilterList(filterId: string) {
    const { data: { issues } } = await axios.request<SearchResponse>({
        url: `${filterApi}/${filterId}`,
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer {jira auth token}'
        }
    });
    const issueList = issues.map((item) => {
        const { key, fields: { summary: title, customfield_10100: subStoryPoint, status: { name: status }, resolutiondate } } = item;
        return {
            key,
            summary: title,
            status: solveToDo(status),
        }
    });

    return issueList;
}
/**
 * Check if a task is available based on its status
 * @param task The task to check or the task status
 * @returns True if the task status is TODO, Done, or Doing; false otherwise
 */
export function isTaskAvail(task: Task | string): boolean {
    const status = solveToDo(typeof task === 'object' ? task.status : task);
    return status === solveToDo(TaskStatus.TODO) || status === TaskStatus.Done || status === TaskStatus.Doing;
}


async function searchByDeveloper(developer: string, startDateStr: string, endDateStr: string) {
    return axios.request<SearchResponse>({
        url,
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer {jira auth token}'
        },
        params: {
            jql: `type = Sub-task and assignee = "${developer}@{domain}" and(("Start Date">="${startDateStr}" and "Start Date"<="${endDateStr}") OR ("Dev Start Date">="${startDateStr}" and "Dev Start Date"<="${endDateStr}") OR (Due >="${startDateStr}" and Due <="${endDateStr}" ) OR("Dev Due Date" >= "${startDateStr}" and "Dev Due Date" <= "${endDateStr}"))`,
            /**
             * customfield_10100 工作量
             * customfield_11200  customfield_11516 开发开始时间
             * duedate, customfield_10304，customfield_15700 开发结束时间
             */
            fields: 'summary,status,customfield_10100,customfield_11200,duedate,customfield_10304,customfield_11516,parent,resolutiondate',
        }
    })
}

async function searchBugByDeveloper(developer: string, startDateStr: string, endDateStr: string) {
    return axios.request<SearchResponse>({
        url,
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer {jira auth token}'
        },
        params: {
            jql: `type = bug and assignee = "${developer}@{domain}" and "created">="${startDateStr}" and "created"<="${endDateStr}"`,
            fields: 'summary,status,customfield_10100,customfield_11200,customfield_10304,customfield_11516,parent,resolutiondate',
        }
    })
}

/**
 * 多个subtask合成一个task后，融合一下任务的状态
 * @param status 
 * @param oldStatus 
 * @returns 
 */
function solveStatus(status: string, oldStatus: string) {
    status = solveToDo(status);
    oldStatus = solveToDo(oldStatus);
    let text = '';
    if (status === TaskStatus.Doing || !oldStatus) {
        text = status;
    } else if (oldStatus === TaskStatus.Doing) {
        text = oldStatus;
    } else if (status === oldStatus) {
        text = status;
    } else {
        text = TaskStatus.Doing;
    }
    return text;

}
/**
 * 将jira 的 TO DO 处理为  Todo
 * @param status 
 * @returns 
 */
function solveToDo(status: string) {
    return status === TaskStatus.TODO ? 'Todo' : status;

}
/** 
 *  需要将跨周的需要拆出来。MMDDD
 *  去掉 无用状态的 subtask
 *  那些是跨周的？就是开始时间是上周的，但结束时间在本周，需要把在本周做的那部分提取出来，主要是提取开始时间和工作量
 *  算法为 结束时间 - 本周的开始时间 为工作量， 工作时间也改成 本周开始 至 subtask需求的结束时间
 *  另外，不要创建大于 5天的 subtask，EMMMMM。。。。
 */

function pickupCurrentWeekSubTasks(issues: Subtask[], startDate: string, endDate: string) {

    const cycleStartDate = cleanTime(new Date(startDate));
    const cycleEndDate = cleanTime(new Date(endDate));
    const list = issues.map(item => {
        const {
            //customfield_10100: storyPoint,
            status: { name: status }
        } = item.fields;
        const {
            startDate: devStartDate,
            endDate: devEndDate,
        } = item;
        // 可能已经 close了,或者时间不在本周期内（按假期分割后存在这种情况）
        if (!isTaskAvail(status) || devEndDate > cycleEndDate || devStartDate < cycleStartDate) {
            return null;
        }
        return item;
    })
    return list.filter(item => item !== null) as Subtask[]
}

/**
 * 处理时间字段，标准化为 startDate和endDate
 */
function solveDateFields(list: Subtask[]) {

    return list.map(subtask => {
        const {
            customfield_11516,
            customfield_10304,
            customfield_15700,
            customfield_11200,
            duedate,
            customfield_10100: storyPoint = 0,
        } = subtask.fields;

        const devStartDateStr = customfield_11200 ?? customfield_11516;
        let devEndDateStr = duedate ?? customfield_10304 ?? customfield_15700;
        // 没有结束时间 或者 结束时间比开始时间早
        devEndDateStr = devEndDateStr && devEndDateStr >= devStartDateStr ? devEndDateStr : formatDate(getDateByExpire(new Date(devStartDateStr), storyPoint))
        subtask.startDate = cleanTime(new Date(devStartDateStr));
        subtask.endDate = cleanTime(new Date(devEndDateStr));
        subtask.startDateStr = formatDate(subtask.startDate);
        subtask.endDateStr = formatDate(subtask.endDate);

        return subtask;
    });

}
/**
 * 如果两个subtask为同一个task的起始时间有交叉，则合并成一个,否则分为两个task
 * @returns Task[]
 */
function mergeSubtask(tasks: Task[], subtask: Task) {
    const { startDate: subTaskStartDate, endDate: subTaskEndDate, resolutiondate, key: subKey } = subtask;
    let isMerge = false;
    for (let i = 0, len = tasks.length; i < len; i++) {
        const task = tasks[i];
        const { endDate: endDate, status, key } = task;
        // 因为已经 task 按starDate 排序了，所以只要判断 subtask的开始时间 与task的结束时间是否有交集即可判断
        // 两个时间为前后相接，也算交叉，所以将时间往前移一天
        const cripoint = new Date(subTaskStartDate.getTime());
        cripoint.setDate(cripoint.getDate() - 1);

        if (key === subKey && cripoint <= endDate) {
            // 需要改为task的 开始时间和结束时间，以及工作量
            task.endDate = subTaskEndDate > endDate ? subTaskEndDate : endDate;
            task.storyPoint += subtask.storyPoint;
            task.status = solveStatus(status, task.status);
            task.subTask?.push(subtask.subTask![0]);
            // 本周任务的解决时间，以最后一个时间为任务的解决时间
            const preRD = task?.resolutiondate;
            if (!preRD || !resolutiondate) {
                task.resolutiondate = '';
            } else {
                task.resolutiondate = preRD > resolutiondate ? preRD : resolutiondate;
            }
            isMerge = true;
            break;
        }
    }
    // 没有合并 ，则为独立的task存入
    if (!isMerge) {
        tasks.push(subtask);
    }
    return tasks;
}

/**
 * 将subtask 按假期分拆成多个subtask
 * 算法为将时间段按某个假日（或连续的假日）分割成多段，然后再用这些多面的时间生成一样的subtask
 * 每一个 subtask 的工作量为 min(endDate - startDate + 1, storypoint)
 * @param list 
 * @returns 
 */
function splitSubtaskByHoliday(list: Subtask[]) {
    return list.map(subtask => {
        const dateSegments = splitByHoliday(subtask.startDate, subtask.endDate);
        return dateSegments.map(([startDate, endDate, ratio]) => {
            // 拆开了，要计算各段的时长占比来算工作量
            // const storyPoint = Math.min(
            //     subtask.fields.customfield_10100,
            //     Number(((endDate.getTime() - startDate.getTime()) / 86400000 + 1).toFixed(2))
            // );
            const storyPoint = Number((subtask.fields.customfield_10100 * ratio).toFixed(1))
            debug.info(subtask.fields.summary, subtask.fields.customfield_10100, (endDate.getTime() - startDate.getTime()) / 86400000 + 1)

            const newSubTask = createNewSubtask(subtask, { startDate, endDate, storyPoint });
            return newSubTask;
        })
    }).flat();
}


function createNewSubtask(subtask: Subtask, options: { startDate: Date, endDate: Date, storyPoint: number, }) {
    const { startDate, endDate, storyPoint, } = options;
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    const newFields = {
        ...subtask.fields,
        customfield_10100: storyPoint,
        customfield_11200: startDateStr,
        customfield_11516: startDateStr,
        customfield_15700: endDateStr,
        duedate: endDateStr
    };
    const newSubTask = {
        ...subtask,
        fields: newFields,
        startDate, endDate, storyPoint,
        startDateStr,
        endDateStr,
    };

    return newSubTask;
}