import { resolve } from "path";
import { GSheet } from "../vendors/googlesheet";

const { team } = process.env;

export const runMode = process.env.mode;

export const isTest = runMode === 'test';
/**
 * 默认配置
 */


export const config = {
    defaultSeatalkWebHook: '',
    SHEET_ID_39: '',
    SHEET_ID_38: '',
    SHEET_ID_37: '',
    SHEET_ID_36: '',
    WEEK_MAIL_OTHER_RECIVERS: '',
    TEAM_OWNER: '',
    TEAM_NAME: '',
    TEAM_MEMBER: '',
    SCHEDULE_DETAIL_LINK: '',
};

export type tConfigKey = keyof typeof config;

type rowRecord = [teamName: string, key: tConfigKey, value: string];
// type Mailkey = Exclude<tConfigKey, 'defaultSeatalkWebHook'>;
let origConfig: any[] | undefined;
export const Configuration = {
    // for test
    conf: '1xDdxWjq8fdVbW5UxI9z1vptPpFeCsqfj',

    loadConfig: async function () {

        const gsheet = new GSheet(this.conf);
        await gsheet.auth();

        const res = (await gsheet.get(`${1}`))?.slice(1);
        origConfig = res;

        res?.forEach(([teamName, key, value]: rowRecord) => {
            if (key === 'defaultSeatalkWebHook') {
                config.defaultSeatalkWebHook = value;
            }
            if (key && teamName === team) {
                config[key] = value?.trim();
            }
        });
        return config;
    }

};
/**
 * 多团队的成员
 * @returns 
 */
export function getAllTeamMembers() {
    const members: Record<string, string[]> = {};
    const cc: Record<string, string[]> = {};
    const owners: Record<string, string[]> = {};
    origConfig?.forEach(([teamName, key, value]: rowRecord) => {
        if (key === 'TEAM_MEMBER') {
            members[teamName] = value.split(',')
        }
        if (key === 'TEAM_OWNER') {
            owners[teamName] = value.split(',')
        }
        if (key === 'WEEK_MAIL_OTHER_RECIVERS') {
            cc[teamName] = value.split(',');
        }
    })
    return { members, cc, owners };
}
export function getAllScheduleLink() {
    const link: Record<string, string> = {};
    origConfig?.forEach(([teamName, key, value]: rowRecord) => {
        if (key === 'SCHEDULE_DETAIL_LINK') {
            link[teamName] = value
        }

    })
    return link;
}

export function getAllTeamsConfig() {
    const conf: Record<string, Record<string, any>> = {};
    origConfig?.forEach(([teamName, key, value]: rowRecord) => {
        if (!teamName || !key) {
            return;
        }
        if (!conf[teamName]) {
            conf[teamName] = {};
        }
        conf[teamName][key] = value;;
    });
    return conf;
}

export function switchConfig(team: string) {

    clear();

    origConfig?.forEach(([teamName, key, value]: rowRecord) => {
        if (key === 'defaultSeatalkWebHook') {
            config.defaultSeatalkWebHook = value;
        }
        if (key && teamName === team) {
            config[key] = value?.trim();
        }
    });
    return config;
}

export const TemplateList = {
    wokerTpl: `${resolve('./')}/public/tpl/work-list.tpl`,
    issueTpl: `${resolve('./')}/public/tpl/issue-list.tpl`,
    okrTpl: `${resolve('./')}/public/tpl/okr.tpl`,
    headerTpl: `${resolve('./')}/public/tpl/header.tpl`,
    mailTpl: `${resolve('./')}/public/tpl/mail-content.tpl`,
    scheduleTpl: `${resolve('./')}/public/tpl/work-schedule.tpl`,
    summaryTpl: `${resolve('./')}/public/tpl/summary.tpl`,
    scheduleGantTpl: `${resolve('./')}/public/tpl/schedule-gant.tpl`,
    teamsOkrTpl: `${resolve('./')}/public/tpl/teams-okr.tpl`,
    scheduleAndOkrTpl: `${resolve('./')}/public/tpl/schedule-okr.tpl`,
}

function clear() {
    let name: tConfigKey;
    for (name in config) {
        config[name] = '';
    }
}