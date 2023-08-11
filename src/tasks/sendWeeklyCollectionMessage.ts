/**
 * 工程主入口
 */
import { sendMarkdownMessage, sendTextMessage } from '../vendors/seatalk';
import { checkResultWork, willCopyWeeklyCollectSheet, getReleasePlanTip, preparationWork, shouldSendCollectMessage } from './analyse-weekly-release';
import { checkTeamReportResult, copyWeeklyReportSheet } from './analyse-weekly-team-report';

// 默认参数
import { seatalk_webhook as webhook, content, getContent } from '../params';
import { config } from '../config';
import { formatDate, getDateOfWeekDay, splitByHoliday, wait } from '../util';
import { sendEmail } from '../vendors/email';
import { getEmailContent, getEmailTitle, getTeamMemberEmail, shouldSendReport } from './analyse-weekly-team-email-report';
import { createScheduleAndKeyWork, createTeamSchedule, getScheduleAndOkrEmailTitle, getScheduleGantEmailTitle, getTeamMemberList } from './analyse-weekly-schedule';

export async function sendOnFailureMessage(message = '') {
    await sendTextMessage(config.defaultSeatalkWebHook, { content: `pipeline failure! \n ${message}` }).catch((error: any) => {
        console.error(error);
    });
    return true;
}

/**
 * 发送 text 类型的消息
 */
export async function sendWeeklyCollectionMessage() {
    await sendTextMessage(webhook, { content: getContent(), at_all: true }).catch((error: any) => {
        console.error(error);
    });
    return true;
}

/**
 * 发送 收集周报结果 的消息
 */
export async function checkTeamReportResultMessage() {
    const { result, todoOwner } = await checkTeamReportResult();
    await sendTextMessage(webhook, { content: getContent().replace('#{result}', result.join('\n')), at_all: true, mentioned_email_list: todoOwner }).catch((error: any) => {
        console.error(error);
    });
    return true;
}
export async function sendTeamReportNoticeMessage() {
    await copyWeeklyReportSheet();
    await sendTextMessage(webhook, { content: getContent(), at_all: true }).catch((error: any) => {
        console.error(error);
    });
    return true;
}

/**
 * 发送 【收集发布验收清单】 的消息
 */
export async function sendWeeklyCheckCollectionMessage() {
    await willCopyWeeklyCollectSheet();
    //copy and move is slowly， wait it pelase.
    await wait(3);
    await shouldSendCollectMessage().then(async () => {
        const result = await getReleasePlanTip();
        //提醒需要填写的同学
        const { todoOwn } = await checkResultWork(true);
        return sendTextMessage(webhook, { content: getContent().replace('#{result}', result.join('\n')), at_all: true, mentioned_email_list: todoOwn }).catch((error: any) => {
            console.error(error);
        });
    }).catch((error: any) => {
        console.error(error);
    })
    return true;
}

/**
 * 发送 【收集验收清单的结果】 消息
 */
export async function sendWeeklyCollectionCheckListMessage(): Promise<boolean> {
    await shouldSendCollectMessage().then(async () => {
        const { result, todoOwner } = await preparationWork() ?? [];
        return sendTextMessage(webhook, { content: getContent().replace('#{result}', result.join('\n\r')), at_all: true, mentioned_email_list: todoOwner }).catch((error: any) => {
            console.error(error);
        });
    }).catch((error: any) => {
        console.error(error);
    })
    return true;
}
/**
 * 发送 【发布后验收的结果】 消息
 */
export async function sendWeeklyCollectionCheckResultMessage() {
    await checkResultWork().then(async ({ result, todoOwn }) => {
        return sendTextMessage(webhook, { content: getContent().replace('#{result}', result.join('\n\r')), at_all: true, mentioned_email_list: todoOwn }).catch((error: any) => {
            console.error(error);
        });
    }).catch((error: any) => {
        console.error(error);
    })
    return true;
}
/**
 * 发送 markdown 类型的消息
 */
export async function sendWeeklyCollectionMessageByMarkdown() {
    await sendMarkdownMessage(webhook, {
        content: getContent(),
        at_all: true
    }).catch((error: any) => {
        console.error(error);
    })
    return true;
}
/**
 * 发布每周的发布计划
 */
export async function sendWeeklyReleasePlan() {
    const result = await getReleasePlanTip()
    await sendTextMessage(webhook, {
        content: getContent().replace('#{result}', result.join('\n\r')), at_all: true
    })
    return true;
}
/**
 * 发送团队周报
 */
export async function sendTeamWeeklyEmailReport() {
    return shouldSendReport().then(async done => {
        const title = getEmailTitle();
        const content = await getEmailContent();
        const recivers = await getTeamMemberEmail();
        try {
            await sendEmail(title, content, recivers);
            await done();
        } catch (e: any) {
            sendOnFailureMessage(`发送周报出错：${e.toString()}`);
        }
        return true;
    }).catch((e) => {
        console.error(e);
    })
}

/**
 * 发送团队排期表
 */
export async function sendTeamWeeklySchedule() {

    const schedueDate = new Date();
    // schedueDate.setDate(schedueDate.getDate() - 21);

    const title = getScheduleGantEmailTitle(schedueDate);
    const recivers = getTeamMemberList();
    let content = await createTeamSchedule(schedueDate);

    try {
        await sendEmail(title, content, recivers);

    } catch (e: any) {
        sendOnFailureMessage(`发送周排期邮件出错：${e.toString()} `);
    }
    return true;
}
/**
 * 发送团队近期人力视图及OKR工作情况
 */
export async function sendTeamScheduleAndKeyWork() {

    const schedueDate = new Date();
    // schedueDate.setDate(schedueDate.getDate() - 21);

    const title = getScheduleAndOkrEmailTitle(schedueDate);
    const recivers = getTeamMemberList();
    let content = await createScheduleAndKeyWork(schedueDate);

    try {
        await sendEmail(title, content, recivers);

    } catch (e: any) {
        sendOnFailureMessage(`发送周排期邮件出错：${e.toString()} `);
    }
    return true;
}