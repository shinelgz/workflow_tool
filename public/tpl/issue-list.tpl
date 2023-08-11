

{{#if this}}
    <table  style="border-collapse: separate;border-spacing: 0;min-width: 100%;border-color: gray;">
        <thead><tr style="font-weight:bold;text-align: left; background-color: #f5f6f9;">
            <td style="border-bottom: 1px solid #e2e6ec;width:20px;padding: 4px 8px;"></td>
            <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">Issues</td>
            <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">状态</td>
        </tr></thead>
        <tbody>
        {{#each this}}
            <tr style="border-bottom: 1px solid #e2e6ec;">
                <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">{{row-index @index}}</td>
                <td  style="border-bottom: 1px solid #e2e6ec;width:80%;padding: 4px 8px;" class="cell_{{@index}}"><a href="https://{domain}/browse/{{key}}">{{summary}}</a></td> 
                <td style="border-bottom: 1px solid #e2e6ec;padding: 4px 8px;">{{status}}</td> 
            </tr>
        {{/each}}
        </tbody>
    </table>
{{else}}
    <p style="color:grey">     上周没产生 Bug Issues ！</p>    
{{/if}}