declare module 'optimizeAjax' {
    class optimizeAjax {
        static all(ajax: Array<Promise<any>>): Array<any>
        static request(config: {
            method?: string
            url: string
            params?: object
            data?: object
            tokenKey?: string
            tokenFrom?: string
            tokenTo?: string
            nativeOptions?: object
            isCommonData?: boolean
        },errFn?:(err:any)=>any, returnType?: boolean): Promise<any>
        static init(config: {
            baseURL?: string
            timeout?: number
            tokenConfig?: {
                key: string
                from: string
                to: string
            }
            listenerConfig?: {
                key: string
                message: string
                listener: object
            }
            isCommonData?: boolean
            returnType?: boolean
            cancelConfig?: object
            errorCode?: number
        }): null
    }
    export default optimizeAjax
}
