/**
 * seatalk 相关的工具类
 */
import axios from 'axios';
import transfer from './transfer';
import { interactiveCardMessage, markdownMessageReqeustOptionsType, textMessage, markdownMessage } from './message-template'

import type { messageMainOptionsType, textMessageRequestOptionsType } from './message-template'

type fields = 'title' | 'description' | 'button' | 'link';
/**
 * 发消息 https://{domain}/docs/messaging_send-message-to-bot-subscriber#Send%20a%20Plain%20Text%20Message-1
 * @param webhook 
 * @param content 发送内容
 */
export async function sendTextMessage(webhook: string, options: messageMainOptionsType): Promise<any> {
    return await transfer<textMessageRequestOptionsType<messageMainOptionsType>>(webhook, textMessage(options));

}

export async function sendMarkdownMessage(webhook: string, options: messageMainOptionsType): Promise<any> {
    return await transfer<markdownMessageReqeustOptionsType<messageMainOptionsType>>(webhook, markdownMessage(options));
}
/**
 * 
 * @param webhook 
 * @param options 
 */

export async function sendMessageCard(webhook: string, options: Record<fields, string>): Promise<any> {
    console.info(arguments);
    const { title, description, button, link } = options;
    try {
        const { data } = await axios.request({
            url: webhook,
            method: "post",
            data: interactiveCardMessage(title, description, button, link)
        });
        console.log(data);

    } catch (error) {
        throw (error);
    }
}