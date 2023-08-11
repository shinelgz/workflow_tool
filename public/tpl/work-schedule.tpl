
{{#if this}}
    <p style="color:grey">本周【{{dateRange}}】排期为上周五确认的需求，不足一周的可能存在为上周某个 subtask 工作的延续，以及其他非 Coding 的事情，比如需求评审对齐等。</p>    
    <table  style="border-collapse: separate;border-spacing: 0;min-width: 100%;border-color: gray;">
        <thead>
            <tr style="font-weight:bold;text-align: left; background-color: #f5f6f9;">
                <th style="width:20px;border-bottom: 1px solid #e2e6ec;padding: 4px 8px;"></th>
                <th style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">Task</th>
                <th style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">开始时间</th>
                <th style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">结束时间</th>
                <th style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">工作量</th>
                <th style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">负责人</th>
            </tr>
        </thead>
        <tbody>
         {{#each list}}
            <tr style="color: grey;{{group-bg step}};">
                <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">{{row-index @index}}</td>
                <td style="border-bottom: 1px solid #e2e6ec;width:70%;padding: 4px 8px;" class="cell_{{@index}}"><a href="{{link}}">{{summary}}</a></td> 
                <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">{{startDate}}</td> 
                <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">{{endDate}}</td> 
                <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">{{storyPoint}}</td>
                <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">{{developer}}</td>  
            </tr>
            <tr class="step_{{step}}"  style="{{group-bg step}};border-bottom: 1px solid #e2e6ec;">
                <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;"></td>
                <td style="border-bottom: 1px solid #e2e6ec;color:grey;padding: 4px 8px;" colspan="5">{{subTaskSummary}}</td>
            </tr>
        {{/each}}
        </tbody>
    </table>
{{else}}
    <p style="color:grey">  排期情况暂未确定</p>
{{/if}}