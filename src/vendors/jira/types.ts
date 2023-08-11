export interface Subtask {
    key: string,
    /**
    * 标准统一后的时间字段，非jira原有的字段
    */
    startDateStr: string,
    startDate: Date,
    /**
     * 标准统一后的时间字段，非jira原有的字段
     */
    endDateStr: string,
    endDate: Date,
    fields: {
        summary: string,
        status: {
            name: string,
        },
        /**
         * 工作量
         */
        customfield_10100: number,
        /**
         * 解决时间
         */
        resolutiondate: string,
        /**
         * 开始时间
         */
        customfield_11200: string,

        /**
         * dev 开始时间
         */
        customfield_11516: string,
        /**
         * 结束时间
         */
        customfield_10304: string,
        /**
         * 结束时间
         */
        customfield_15700: string,
        /**
         * 结束时间
         */
        duedate: string,
        parent: {
            key: string,
            fields: {
                summary: string
            }
        }
    }
}
export interface SearchResponse {
    issues: Subtask[],
}

export interface Task {
    summary: string,
    key: string,
    link: string,
    status: string,
    developer?: string,
    storyPoint: number,
    startDate: Date,
    devStartDate?: string,
    endDate: Date,
    resolutiondate?: string,
    weekWorkLoad?: number;
    subTask?: Task[],
    roleIndex?: number;
}