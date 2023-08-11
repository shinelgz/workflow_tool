/**
 * 
 * @param content 
 * @returns 
 */

import { messageMainOptionsType, markdownMessageReqeustOptionsType } from "./types";

export function markdownMessage({ 
    content, 
    at_all, 
    mentioned_email_list, 
    mentioned_list
}: messageMainOptionsType): markdownMessageReqeustOptionsType<messageMainOptionsType> {
    return {
        tag: 'markdown',
        markdown: {
            content,
            at_all,
            mentioned_email_list,
            mentioned_list 
        }

    }
}