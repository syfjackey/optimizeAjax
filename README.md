# optimize-ajax

### 封装 axios,拦截相关错误

### 解决问题

-   设置 token,选择发送位置
-   监听错误响应

### 如何使用

    <script src="./lib/optimize-ajax.js"></script>
    import OptimizeAjax from './lib/optimize-ajax.js'

    OptimizeAjax.init(config)
    const result = await OptimizeAjax.request({reqConfig},errFn,returnType)
    const result = await OptimizeAjax.all([OptimizeAjax.request1,OptimizeAjax.request2])

### 支持 Vue

    import OptimizeAjax from './lib/optimize-ajax.js'
    Vue.use(OptimizeAjax, config)
    const result = this.$ajax.request({reqConfig},errFn,returnType)

### 配置 config

    {
        mountKey?:string        // Vue挂载符 默认为 $ajax
        baseURL?: string        // 基础请求路径
        timeout?: number        // 超时时间 单位:ms
        tokenConfig?: {         // token设置
            key: string         // token对应键 还支持 "获取键|发送键"
            from: string        // 从哪个位置获取token值  sessionStorage|localStorage
            to: string          // 发送位置  header|params|data
        }
        listenerConfig?: {      // 错误监听配置
            key: string         // 响应码对应键
            message: string     // 响应码提示
            listener: {         // 监听配置
              key(){            // 响应码

              }
            }
        }
        isCommonData?: boolean  // get方式 data params 互通
        returnType?: boolean    // 返回类型 [err,result] | result  默认 result
        cancelConfig?: {        // 重复请求配置
          code:number,          // 取消响应码
          type:string           // 取消方式  after before none  取消之后响应 取消之前 不取消  默认取消之前
        }
        errorCode?: number      // 错误响应码
    }

### 示例

    //监听响应码错误
    {
        mountKey:'$ajax',
        timeout:200,
        listenerConfig:{
          key:'resultCode',
          message:'message'
          '-1'(){
            console.log('监听到了变化!')
          }
        }  
    }

### Api

#### OptimizeAjax.request(reqConfig,errFn,returnType)

    let result = await OptimizeAjax.request(reqConfig:object,errFn:function,returnType:boolean)

#### reqConfig   
    {
        method?: string
        url: string
        params?: object
        data?: object
        tokenKey?: string
        tokenFrom?: string
        tokenTo?: string
        nativeOptions?: object   //axios 请求配置
        isCommonData?: boolean
    }

##### 示例*example*

    let result1 = await OptimizeAjax.request({url:'http://127.0.0.1/api/test'})
    let result2 = await OptimizeAjax.request({url:'http://127.0.0.1/api/test'},err=>console.log(err))
    let [err,result3] = await OptimizeAjax.request({url:'http://127.0.0.1/api/test'},err=>console.log(err),true)

#### OptimizeAjax.all()

    OptimizeAjax.all([OptimizeAjax.request1,OptimizeAjax.request2])

##### 示例*example*

    let ajax1=OptimizeAjax.request(reqConfig)
    let ajax2=OptimizeAjax.request(reqConfig)
    let [result1,result2] = await OptimizeAjax.all([ajax1,ajax2])
