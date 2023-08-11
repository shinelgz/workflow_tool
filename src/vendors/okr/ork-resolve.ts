import { GSheet } from '../googlesheet';
import { config } from '../../config'
type resType = { type: string; obj: string; krs: any[]; };



function getSheet() {
    return new GSheet(config.SHEET_ID_36);
}

export async function getOKRList() {
    const list = (await getSheetData())?.slice(4, -6).filter(item => item.length >= 3);
    const result: resType[] = [];

    let curObj: resType = { type: '', obj: '', krs: [] };
    let curType = '';

    list?.forEach(([type, obj, kr, , status = '', mark = '']) => {
        if (type) {
            curType = type;
        }
        if (obj) {
            curObj = {
                type: curType,
                obj: obj.replace(/(O\d[：:])/g, '<br/>$1'),
                krs: [{ kr, status, mark }]
            }
            result.push(curObj);
        } else {
            curObj.krs.push({ kr, status, mark });
        }
    })
    return result;
}
/**
 * 
 * @returns 
 */
async function getSheetData() {
    const gsheet = getSheet();
    await gsheet.auth();
    // 获取第一个sheet
    const tabName = await gsheet.getSheetName(0);
    if (!tabName) {
        throw new Error('no any sheet!');;
    }

    return gsheet.get(tabName);
}