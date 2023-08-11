import { google, sheets_v4, } from 'googleapis';
import { CacheMgr } from '../../util/cache';

const auth = new google.auth.GoogleAuth({
    keyFile: 'keys.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
});

const cacheMgr = new CacheMgr();
/**
 *
 */
export class Transfer {
    id = '';
    client: sheets_v4.Sheets | undefined;
    /**
     *
     * @param id
     */
    constructor(id: string) {
        if (!id) {
            throw new Error('id mush be a  not empty string')
        }
        this.id = id;
        if (cacheMgr.has(this.id)) {
            this.client = cacheMgr.get(id);
        }
    }
    /**
     * 誰
     * @returns
     */
    async auth() {
        if (this.client) {
            return;
        }
        const clientObject = await auth.getClient();
        this.client = google.sheets({ version: 'v4', auth: clientObject });
        // 避免重构认证
        cacheMgr.set(this.id, this.client);
    }
    /**
     * 获取所有的tab 名字
     * @returns
     */
    async getSheetListProfile() {
        if (!this.client) {
            console.error('call auth() first');
            return;
        }
        const key = `profile_${this.id}`;
        let sheets: sheets_v4.Schema$Sheet[];
        if (cacheMgr.has(key)) {
            sheets = cacheMgr.get(key);
        } else {
            const res = await this.client.spreadsheets.get({ spreadsheetId: this.id });
            sheets = res.data.sheets!;
            cacheMgr.set(key, sheets);
        }
        // console.info('sheet list:', sheets);
        return (sheets ?? []).map(item => item.properties);
    }
    /**
     *
     * @param sheetIndex
     * @returns
     */
    async getSheetName(sheetIndex: number) {
        const list = await this.getSheetListProfile();
        return list?.at(0)?.title;
    }
    /**
     *
     * @param range
     * @returns
     */
    async get<T = any[]>(range = '') {
        if (!this.client) {
            console.error('call auth() first');
            return;
        }
        const ret = await this.client.spreadsheets.values.get({
            spreadsheetId: this.id,
            range,
        });
        const {
            data: { values, majorDimension, range: orange },
        } = ret;
        // console.info('load data from sheet: ', values, majorDimension, orange, ret)
        return (values ?? []) as T;
    }
    /**
     * 
     * @param range 
     * @returns 
     */
    async getFullData(range = '') {
        if (!this.client) {
            console.error('call auth() first');
            return;
        }
        const ret = await this.client.spreadsheets.get({
            spreadsheetId: this.id,
            includeGridData: true,
            ranges: [range],
        });
        return ret.data.sheets?.at(0)?.data?.at(0)?.rowData as sheets_v4.Schema$RowData[];
    }
    /**
     * 
     * @param values 
     * @param range 
     * @param insertDataOption 
     * @returns 
     */
    async append(values: any[], range: string, insertDataOption: 'OVERWRITE' | 'INSERT_ROWS') {
        const request = {
            spreadsheetId: this.id,  // TODO: Update placeholder value.
            insertDataOption,
            range,
            valueInputOption: 'USER_ENTERED',  // TODO: Update placeholder value.
            resource: { values, },
        };
        const response = await this.client?.spreadsheets.values.append(request);

        return response;
    }
    /**
     * 创建一行
     * @param rowIndex 
     * @returns 
     */
    async createRow(rowIndex: number, rowCount: number, tabName: string) {
        if (rowCount < 1) {
            return;
        }
        return this.batchUpdate([{
            insertDimension: {
                range: {
                    sheetId: await this.getSheetIdByName(tabName),
                    dimension: 'ROWS',
                    startIndex: rowIndex - 1,
                    endIndex: rowIndex + rowCount - 1
                },
                inheritFromBefore: null
            }
        }]);
    }
    /**
     * 创建一行
     * @param rowIndex 
     * @returns 
     */
    async deleteRow(rowIndex: number, rowCount: number, tabName: string) {
        if (rowCount < 1) {
            return;
        }
        return this.client?.spreadsheets.batchUpdate({
            spreadsheetId: this.id,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: await this.getSheetIdByName(tabName),
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex - 1 + rowCount
                        }
                    }
                }]
            }
        });
    }
    async mergeCeil(startRowIndex: number, rowCount: number, startColumnIndex: number, columnCount: number, sheetName: string) {
        return this.batchUpdate([{
            mergeCells: {
                range: {
                    sheetId: await this.getSheetIdByName(sheetName),
                    startRowIndex: startRowIndex - 1,
                    endRowIndex: startRowIndex - 1 + rowCount,
                    startColumnIndex: startColumnIndex - 1,
                    endColumnIndex: startColumnIndex - 1 + columnCount
                },
                mergeType: 'MERGE_ALL'
            }
        }]);
    }

    async update(values: any[], range: string) {
        const request = {
            spreadsheetId: this.id,  // TODO: Update placeholder value.
            range,
            valueInputOption: 'USER_ENTERED',  // TODO: Update placeholder value.
            resource: { values, },
        };
        const response = await this.client?.spreadsheets.values.update(request);

        return response;
    }
    async batchUpdate(requests: any[]) {
        return this.client?.spreadsheets.batchUpdate({
            spreadsheetId: this.id,
            requestBody: {
                requests
            }
        });
    }

    async getSheetIdByName(name: string) {
        const sheet = (await this.getSheetListProfile())?.find(item => item?.title === name);

        return sheet?.sheetId;

    }

    async copySheet(name: string, newName?: string, index?: number) {
        if (await this.isExist(newName!)) {
            return;
        }
        // 更新了 sheet 基本结构，清除缓存
        this.cleanCache();
        const sheetId = await this.getSheetIdByName(name) as number;
        const res = await this.client?.spreadsheets.sheets.copyTo({
            spreadsheetId: this.id,
            sheetId,
            requestBody: {
                destinationSpreadsheetId: this.id
            }
        });
        if (newName) {
            await this.rename(res?.data.sheetId as number, newName);
        }

        return res;
    }

    async rename(sheetId: number, name: string) {
        return this.updateProperties([{
            property: {
                sheetId,
                title: name
            },
            fields: 'title'
        }])
    }
    async moveTo(sheetId: number, index: number) {
        return this.updateProperties([{
            property: {
                sheetId,
                index
            },
            fields: 'index'
        }])
    }

    async updateProperties(properties: Record<string, any>[]) {
        // 更新了 sheet 基本结构，清除缓存
        this.cleanCache();
        const requests: any[] = properties.map(({ property, fields }) => {
            return {
                updateSheetProperties: {
                    properties: property,
                    fields
                }
            }
        })
        return this.batchUpdate(requests);
    }
    async isExist(name: string) {
        const ret = !!(name && await this.getSheetIdByName(name));
        console.info(`sheet ${name} is exist?`, ret)
        return ret;
    }

    cleanCache() {
        const key = `profile_${this.id}`;
        cacheMgr.del(key);
    }
}
