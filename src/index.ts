/**
 * 工程主入口，因为配置是动态加载，所以本文件头不准import其他文件。
 */

import { Configuration } from "./config";

export async function run() {

    const taskType = process.env.type;
    console.info('task type: ', taskType);

    const config = await Configuration.loadConfig()

    const { analyseManpower, updateSchedule } = await import("./tasks/analyse-weekly-manpower");
    const {
        sendWeeklyCollectionMessage,
        sendWeeklyCollectionMessageByMarkdown,
        sendWeeklyCollectionCheckResultMessage,
        sendWeeklyCollectionCheckListMessage,
        sendWeeklyCheckCollectionMessage,
        checkTeamReportResultMessage,
        sendTeamReportNoticeMessage,
        sendWeeklyReleasePlan,
        sendOnFailureMessage,
        sendTeamWeeklyEmailReport,
        sendTeamWeeklySchedule,
        sendTeamScheduleAndKeyWork,
    } = await import("./tasks/sendWeeklyCollectionMessage");

    console.info('load config: ', config);

    switch (taskType) {
        case 'markdown':
            await sendWeeklyCollectionMessageByMarkdown();
            break;
        /**
         * options 收集发布验收点，群信息提醒 
         * @param tasktype
         * @param content
         * @param team
         * @param seatalk_webhook
         */
        case 'collect-check-list':
            await sendWeeklyCheckCollectionMessage();
            break;
        /**
         * options 发布验收点填写情况，群信息提醒 
         * @param tasktype
         * @param content
         * @param team
         * @param seatalk_webhook
         */
        case 'check-list-result':
            await sendWeeklyCollectionCheckListMessage();
            break;
        /**
         * options 发布后验收结果，发送群信息
         * @param tasktype
         * @param content
         * @param team
         * @param seatalk_webhook
         */
        case 'check-release-result':
            await sendWeeklyCollectionCheckResultMessage();
            break;
        /**
         * options 在指定群提醒填写周报
         * @param tasktype
         * @param content
         * @param team
         * @param seatalk_webhook
         */
        case 'team-report-notice':
            await sendTeamReportNoticeMessage();
            break;
        /**
         * options 检查团队周报的填写情况，群提醒 
         * @param tasktype
         * @param content
         * @param team
         * @param seatalk_webhook
         */
        case 'check-team-report-result':
            await checkTeamReportResultMessage();
            break;
        /**
         * options 发送排期表到指定群
         * @param tasktype
         * @param content
         * @param team
         * @param seatalk_webhook
         */
        case 'weekly-schedule':
            await analyseManpower();
            break;
        /** options 更新排期表
         * @param tasktype
         * @param team
         * @param seatalk_webhook
         */
        case 'update-schedule':
            await updateSchedule();
            break;
        /** options 当周发布计划，发送到指定群
        * @param tasktype
        * @param content
        * @param team
        * @param seatalk_webhook
        */
        case 'weekly-release-plan':
            await sendWeeklyReleasePlan();
            break;

        case 'send_on_failure':
            await sendOnFailureMessage();
            break;
        /** 团队周报，邮件发送
        * @param tasktype
        * @param team
         */
        case 'team-weekly-report':
            await sendTeamWeeklyEmailReport();
            break;
        /**
         * 团队人力视图
         * @param tasktype
         * @param team
         */
        case 'team-weekly-schedule-gant':
            await sendTeamWeeklySchedule();
            break;
        /**
         * 团队人力视图及工作情况
         * @param tasktype
         * @param team
         */
        case 'team-schedule-keywork':
            await sendTeamScheduleAndKeyWork();
            break;
        default:
            await sendWeeklyCollectionMessage();
    }

    return true;

};

if (process.env.jest !== 'true') {
    run();
}