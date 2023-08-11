/**
 * 
 * @param content 
 * @returns 
 */

import { textMessageRequestOptionsType, messageMainOptionsType } from "./types";

export function textMessage({ 
    content, 
    at_all, 
    mentioned_email_list, 
    mentioned_list
}: messageMainOptionsType): textMessageRequestOptionsType<messageMainOptionsType> {
    return {
        tag: 'text',
        text: {
            content,
            at_all,
            mentioned_email_list,
            mentioned_list 
        }

    }
}