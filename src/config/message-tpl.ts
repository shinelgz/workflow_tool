export const SEATALK_MESSAGE_TEMPLATE_LIST = {
    'markdown': '这是 markdown 模板消息',
    'collect-check-list': '【今天完成】请大家填下一下这周发布的验收清单:\n https://docs.google.com/spreadsheets/d//edit \n #{result}',
    'check-list-result': '【发布后验收清单】填写情况如下：\n #{result} \n 链接：https://docs.google.com/spreadsheets/d//edit',
    'check-release-result': '【今天】发布后验收结果如下：#{result} \n 链接：https://docs.google.com/spreadsheets/d//edit',
    'team-report-notice': '【15:00前完成】请大家整理一下周工作内容，感谢。  https://docs.google.com/spreadsheets/d/1bozgoI--',
    'check-team-report-result': '周报完成情况：\n #{result} \n 链接：https://docs.google.com/spreadsheets/d/1bozgoI--',
    'weekly-schedule': '本周排期已输出，请查阅（请及时排好期）：\n https://docs.google.com/spreadsheets/d/${SHEET_ID_39}#gid=34647989',
    'update-schedule': '',
    'weekly-release-plan': '本周的发布计划：\n #{result}',
    'send_on_failure': '发生错误了',
    'team-weekly-report': '',
    'team-weekly-schedule-gant': '',
    'team-schedule-keywork': '',
    'default': '这是一条普通消息',

};

export type iTaskType = keyof typeof SEATALK_MESSAGE_TEMPLATE_LIST;