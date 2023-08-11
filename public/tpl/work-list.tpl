{{#each this}}
    <h3 style="font-size:14px;font-weight: lighter;">{{title}}:</h3>
    {{#if list}}
        <table style="border-collapse: separate;border-spacing: 0;min-width: 100%;border-color: gray;" >
            <thead>
                <tr style="font-weight:bold;text-align: left; background-color: #f5f6f9;">
                    <th style="width:20px;border-bottom: 1px solid #e2e6ec;padding: 4px 8px;"></th>
                    <th style="width:30%;border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">事项</th>
                    <th style="width:60%;border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">描述</th>
                    <th style="width:60%;border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">负责人</th>
                </tr>
            </thead>
            <tbody>
            {{#each list}}
                <tr>
                <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">{{row-index @index}}</td>
                {{#each this}}
                    {{#if link}}
                        <td style="border-bottom: 1px solid #e2e6ec;width:{{ceil-width @index}};padding: 4px 8px;"><a href="{{link}}">{{text}}</a></td>
                    {{else}}
                        <td style="border-bottom: 1px solid #e2e6ec;color:grey;width:{{ceil-width @index}};padding: 4px 8px;">{{text}}</td>
                    {{/if}}
                {{/each}}
                </tr>
            {{else}}
                <p>no data</p>    
            {{/each}}
            </tbody>
        </table>
    {{/if}}
{{else}}
    <p>no data</p>    
{{/each}}