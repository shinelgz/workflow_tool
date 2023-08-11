import handlebars from 'handlebars';
import fs from 'fs';
import { formatDate } from '.';
import { isHoliday } from '../vendors/apihubs';

handlebars.registerHelper('row-index', index => index + 1);

handlebars.registerHelper('group-bg', (step: number) => step === 0 ? 'background-color:#f7f7f7;' : '')

handlebars.registerHelper('replace-nn', (text: string) => text.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'));

handlebars.registerHelper('ceil-width', (index: number) => {
    if (index === 0) {
        return '30%';
    }
    if (index === 1) {
        return '60%'
    }
    return '5%'
})

handlebars.registerHelper('render-summary', (
    summary: string | Record<string, string>[] | undefined,
    link: string,
    storyPoint: number,
    date: Date,
) => {
    if (!summary) {
        return '';
    }
    if (Array.isArray(summary)) {
        return summary.map((m, index) => `<a href="${m.link}">${index + 1}. ${m.summary}  </a>`).join('<br/>');
    }
    return `<a href="${link}">${summary} </a>`;

});

handlebars.registerHelper('gant-background', (index: number, summary: string | undefined, storyPoint: number, start: number, date: Date) => {

    const holiday = isHoliday(formatDate(date, 'YYYY-MM-DD'))
    if (summary) {
        return storyPoint > 3 ? '#58A55C' : (storyPoint > 1 ? '#78A55A' : '#BDD5AC');
    }
    if (holiday) {
        return '#f1f2f4';
    }
    return '#ffffff';

})

handlebars.registerHelper('gant-hander-ceil-width', (width, index) => {
    if ((index - 5) % 7 === 0 || (index - 6) % 7 === 0) {
        return width / 2;
    }
    return width
})

handlebars.registerHelper('group-category-row-options', (step, schedule) => {
    const common = 'text-align:center;border-left: 1px solid #D9D9D9;border-right: 1px solid #D9D9D9;border-bottom: 1px solid #e2e6ec;padding: 8px 8px;font-weight:bold';
    if (!schedule) {
        return `colspan=${step} style="${common};text-align:left;background-color:#F29D38;color:#ffffff;"`;
    }
    return `style="${common}"`;
})

export function render(data: Object, htmlTpl: string) {
    const tpl = fs.readFileSync(htmlTpl).toString();
    const template = handlebars.compile(tpl, { noEscape: true });
    return template(data);
}