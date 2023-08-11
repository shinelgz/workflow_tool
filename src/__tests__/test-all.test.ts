import { describe, expect, test } from '@jest/globals';

import { Configuration } from "../config";
import { SEATALK_MESSAGE_TEMPLATE_LIST, iTaskType } from '../config/message-tpl';

import { setParams, refreshContent, refreshType } from '../params';


jest.useRealTimers();

describe('analyse-weekly-release', () => {

    let task: { run: () => Promise<boolean> };
    // let params: { refreshType: () => void; refreshContent: () => void };

    beforeAll(async () => {
        const config = await Configuration.loadConfig();
        process.env.seatalk = config.defaultSeatalkWebHook;
        task = await import('../index');
        setParams(config);
    }, 1000000)

    beforeEach(() => {
        process.env.type = '';
    });

    const type = process.env.type;
    const taskTypeList = type ? [type] : Object.keys(SEATALK_MESSAGE_TEMPLATE_LIST) as unknown as iTaskType[];

    taskTypeList.forEach(type => {
        test(type, async () => {
            process.env.type = type;
            changeTeam(type);
            refreshType();
            refreshContent();
            const res = await task.run();
            expect(res).toBe(true);
        }, 10000000);
    })
});

function changeTeam(type: string) {
    switch (type) {
        case 'team-weekly-schedule-gant':
        case 'team-schedule-keywork':
            setParams({ team: '' });
            break;
    }
}