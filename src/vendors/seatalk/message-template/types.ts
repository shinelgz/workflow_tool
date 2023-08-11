export type textMessageRequestOptionsType<T> = {
    tag: 'text',
    text: T
};

export type imageMessageRequestOptionsType<T> = {
    tag: 'image',
    image_base64: T
};

export type markdownMessageReqeustOptionsType<T> = {
    tag: 'markdown',
    markdown: T
}

export type messageMainOptionsType = {
    content: string,
    mentioned_email_list?: string[],
    mentioned_list?: string[],
    at_all?: boolean,
}