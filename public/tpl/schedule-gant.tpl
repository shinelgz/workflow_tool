
<span style="color:grep;"><i>此数据为自动采集生成，因国家假期或个人休假等因素可能导致排期显示不准，请忽略</i></span>
<br/><br/>


{{#if schedules.schedule}}
<p>There are not any data, please concat </p>
{{else}}

<h2 style="font-weight:400;font-size: 16px;background-color: #000000;font-style: italic;color: #fff;padding: 5px 10px;" >
    团队人力视图
</h2>

<table style="border-collapse: separate;border-spacing: 0;min-width: 100%;border-color: gray;width:900px;">
    <thead>
        <tr style="font-weight:bold;text-align: center; background-color: #000000;color:#ffffff; height:40px;line-height:40px;">
            <th style="border-left: 1px solid #D9D9D9;border-right: 1px solid #D9D9D9;width:20px;">-</th>
            {{#each dateList}}
                <th colspan=2 style="border-right: 1px solid #D9D9D9;width:{{gant-hander-ceil-width 14 @index}}%">{{this}}</th>
            {{/each}}
        </tr>
        <tr style="height:5px;background-color:#434343">
            <th style="border-left: 1px solid #D9D9D9;border-right: 1px solid #D9D9D9;border-bottom: 1px solid #e2e6ec;"></th>
            {{#each dateList}}
                <th  style="border-right: 2px solid #D9D9D9;border-bottom: 1px solid #e2e6ec;width:{{gant-hander-ceil-width 7 @index}}%;"></th>
                <th  style="border-right: 1px solid #D9D9D9;border-bottom: 1px solid #e2e6ec;width:{{gant-hander-ceil-width 7 @index}}%;"></th>
            {{/each}}
        </tr>
    </thead>
    <tbody>
    {{#each schedules}}
        <tr style="border-bottom: 1px solid #e2e6ec;">
            <td {{group-category-row-options step schedule}}>
                {{name}} 
                {{#if link}}
                    &nbsp;&nbsp;<a style="color:#fbe96c" href="{{link}}">查看详细排期</a>
                {{/if}}
            </td>
            {{#each schedule}}
                <td colspan={{step}} style="border-bottom: 1px solid #e2e6ec;border-right: 1px solid #cccccc;padding: 4px 8px;min-width:50px;max-width:200px;background-color:{{gant-background @index summary storyPoint start date}}">{{render-summary summary link storyPoint date}}</td>
            {{/each}}
        </tr>
    {{else}}
        <tr><td colspan=14><p>There are not any data, please concat </p></td></tr>
    {{/each}}
    </tbody>
</table>
{{/if}}