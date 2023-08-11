{{#each this}}
    <h3 style="font-weight: 400;font-size:12px;" >→ <b>{{type}}：</b><span style="color:grey;">{{obj}}</span></h3>
    <table style="border-collapse: separate;border-spacing: 0;min-width: 100%;border-color: gray;">
        <thead>
            <tr style="font-weight:bold;text-align: left; background-color: #f5f6f9;">
                <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;width:50%;">关键结果</td>
                <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;width:10%;">进展</td>
                <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;width:45%;">备注</td>
            </tr>
        </thead>
        <tbody style="color:#5b5959">
            {{#each krs}}
                <tr>
                    <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">{{kr}}</td>
                    <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">{{status}}</td>
                    <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">{{mark}}</td>
                </tr>
            {{/each}}
        </tbody>
    </table>
{{else}}
    <p>暂无数据</p>
{{/each}}