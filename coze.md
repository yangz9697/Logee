执行工作流
执行已发布的工作流。​
接口说明​
此接口为非流式响应模式，对于支持流式输出的节点，应使用接口​执行工作流（流式响应）获取流式响应。调用接口后，你可以从响应中获得 debug_url，访问链接即可通过可视化界面查看工作流的试运行过程，其中包含每个执行节点的输入输出等详细信息，帮助你在线调试或排障。​
扣子专业版用户调用此接口时，支持通过 is_async 参数异步运行工作流，适用于工作流执行耗时较长，导致运行超时的情况。异步运行时，工作流整体超时时间限制由 3 分钟延长至 24 小时，LLM 节点由 3 分钟延长至 5 分钟，其他节点的超时时间限制不变，详细说明可参考​工作流使用限制。异步运行后可通过本接口返回的 execute_id 调用​查询工作流异步执行结果API 获取工作流的执行结果。​
限制说明​
不支持通过此 API 执行包括以下节点的工作流。​
消息节点​
开启了流式输出的结束节点​
问答节点​
通过 API 方式执行工作流前，应确认此工作流已发布，执行从未发布过的工作流时会返回错误码 4200。创建并发布工作流的操作可参考​使用工作流。​
异步运行的参数 is_async 仅限扣子专业版用户使用，否则调用此接口会报错 6003 Workflow execution with is_async=true is a premium feature available only to Coze Professional users.​
调用此 API 之前，应先在扣子平台中试运行此工作流，如果试运行时需要关联智能体，则调用此 API 执行工作流时，也需要指定智能体ID。通常情况下，执行存在数据库节点、变量节点等节点的工作流需要关联智能体。​
​

​
​
基础信息​
​
请求方式​
POST​
请求地址​
​
https://api.coze.cn/v1/workflow/run​
​
权限​
run​
确保调用该接口使用的个人令牌开通了 run 权限，详细信息参考​鉴权方式。​
接口说明​
执行已发布的工作流。​
​
Header​
​
参数​
取值​
说明​
Authorization​
Bearer $Access_Token​
用于验证客户端身份的访问令牌。你可以在扣子平台中生成访问令牌，详细信息，参考​准备工作。​
Content-Type​
application/json​
解释请求正文的方式。​
​
​
​
Body​
​
参数​
类型​
是否必选​
说明​
workflow_id​
String ​
必选​
待执行的 Workflow ID，此工作流应已发布。​
进入 Workflow 编排页面，在页面 URL 中，workflow 参数后的数字就是 Workflow ID。例如 https://www.coze.com/work_flow?space_id=42463***&workflow_id=73505836754923***，Workflow ID 为 73505836754923***。​
parameters​
JSON Object​
可选​
工作流开始节点的输入参数及取值，你可以在指定工作流的编排页面查看参数列表。​
bot_id​
​
String ​
​
可选​
​
需要关联的智能体ID。 部分工作流执行时需要指定关联的 Bot，例如存在数据库节点、变量节点等节点的工作流。​
​
​​

​
​
进入智能体的开发页面，开发页面 URL 中 bot 参数后的数字就是智能体ID。例如 https://www.coze.com/space/341****/bot/73428668*****，Bot ID 为 73428668*****。 ​
确保调用该接口使用的令牌开通了此智能体所在空间的权限。​
确保该智能体已发布为 API 服务。​
​
ext​
Map[String][String]​
​
可选​
用于指定一些额外的字段，以 Map[String][String] 格式传入。例如某些插件 会隐式用到的经纬度等字段。​
目前仅支持以下字段：​
latitude：String 类型，表示经度。​
longitude：String 类型，表示纬度。​
user_id：String 类型，表示用户 ID。​
is_async​
Boolean​
可选​
是否异步运行。异步运行后可通过本接口返回的 execute_id 调用​查询工作流异步执行结果API 获取工作流的最终执行结果。​
true：异步运行。​
false：（默认）同步运行。​
异步运行的参数 is_async 仅限扣子专业版使用，否则调用此接口会报错 6003 Workflow execution with is_async=true is a premium feature available only to Coze Professional users.
​
app_id​
String​
可选​
工作流所在的应用 ID。仅运行应用中的工作流时，才需要设置此 ID。​
你可以通过应用的业务编排页面 URL 中获取应用 ID，也就是 URL 中 project-ide 参数后的一串字符，例如 https://www.coze.cn/space/739174157340921****/project-ide/743996105122521****/workflow/744102227704147**** 中，应用的 ID 为 743996105122521****。​
​
返回结果​
如果接口响应的 HTTP 状态码为 504，表示工作流执行超时，具体的超时时间限制可参考​工作流使用限制。你可以优化工作流编排逻辑，缩短单节点或整体执行时长。如果状态码为 200，表示请求成功，响应信息如下。​
​
参数​
类型​
说明​
code​
Integer​
调用状态码。 ​
0 表示调用成功。 ​
其他值表示调用失败。你可以通过 msg 字段判断详细的错误原因。​
msg​
String​
状态信息。API 调用失败时可通过此字段查看详细错误信息。​
data​
String​
工作流执行结果，通常为 JSON 序列化字符串，部分场景下可能返回非 JSON 结构的字符串。仅在同步执行工作流（is_async=false）时返回。​
debug_url​
String​
工作流试运行调试页面。访问此页面可查看每个工作流节点的运行结果、输入输出等信息。​
execute_id​
String​
异步执行的执行 ID。仅在异步执行工作流（is_async=true）时返回。​
可通过 execute_id 调用​查询工作流异步执行结果API 获取工作流的最终执行结果。​
token​
Integer​
预留字段，无需关注。​
cost​
String ​
预留字段，无需关注。​
​
示例​
请求示例​
​
curl --location --request POST 'https://api.coze.cn/v1/workflow/run' \​
--header 'Authorization: Bearer pat_hfwkehfncaf****' \​
--header 'Content-Type: application/json' \​
--data-raw '{​
    "workflow_id": "73664689170551*****",​
    "parameters": {​
        "user_id":"12345",​
        "user_name":"George"​
    }​
}'​
​
​
正常返回示例​
​
{​
    "code": 0,​
    "cost": "0",​
    "data": "{\"output\":\"北京的经度为116.4074°E，纬度为39.9042°N。\"}",​
    "debug_url": "https://www.coze.cn/work_flow?execute_id=741364789030728****&space_id=736142423532160****&workflow_id=738958910358870****",​
    "msg": "Success",​
    "token": 98​
}​
​
​
异常返回示例​
​
{​
    "code": 4000,​
    "msg": "The parameter workflow_id must be greater than 0. Please check your input."​
}​
​
错误码​
如果成功调用扣子的 API，返回信息中 code 字段为 0。如果状态码为其他值，则表示接口调用失败。此时 msg 字段中包含详细错误信息，你可以参考​错误码文档查看对应的解决方法。