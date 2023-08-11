import { config } from './config';
import { SEATALK_MESSAGE_TEMPLATE_LIST, iTaskType } from './config/message-tpl';

let { seatalk_webhook = config.defaultSeatalkWebHook, team = '' } = process.env;

let icontent = process.env.content!;
let type = process.env.type as iTaskType;

refreshContent();

export function setContent(txt: string) {
    icontent = txt;
}

export function refreshContent() {
    if (SEATALK_MESSAGE_TEMPLATE_LIST[type]) {
        icontent = SEATALK_MESSAGE_TEMPLATE_LIST[type];
    }
}

export function setType(type: iTaskType) {
    type = type;
}

export function refreshType() {
    type = process.env.type as iTaskType;
}

export function setParams(params: Record<string, string>) {
    const { defaultSeatalkWebHook: iSeatalk_webhook, team: iTeam, content: iiContent } = params;
    if (iSeatalk_webhook) {
        seatalk_webhook = iSeatalk_webhook;
    }
    if (iTeam) {
        team = params.team;
    }
    if (iiContent) {
        icontent = iiContent;
    }
}


/**
 * 支持 content 从env 读取参数 ，通过 ${params_name}读取
 */
const contentor = new Proxy({ content: icontent }, {
    get(): string {
        const { env } = process;
        return icontent?.replace(/(?:\${([0-9a-z_-]+)})/gi, (match: string, name: string) => {
            const value = { ...env, ...config }[name];
            if (!value) {
                console.error('name is not defined in env or config ');
            }
            return value ?? '';
        });
    },
});
export const content = contentor.content;

export function getContent() {
    return contentor.content;
}

export { seatalk_webhook, type, team };
