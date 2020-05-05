import axios from 'axios'
class OptimizeAjax {
  static init({
    baseURL = '',
    timeout = 2000,
    tokenConfig = {
      key: '', from: 'sessionStorage', to: 'header'
    },
    listenerConfig = {
      key: 'code',
      message: 'message',
      listener: {}
    },
    isCommonData = true,
    returnType = false,
    cancelConfig = {
      code: -7, type: 'after'
    },
    errorCode = -8,
  } = {}) {
    this._requestCacheList = []
    this._initStatus = 'INIT'
    this._tokenKey = tokenConfig.key || 'token|token'
    this._tokenFrom = tokenConfig.from || 'sessionStorage'
    this._tokenTo = tokenConfig.to || 'header'
    this._isCommonData = isCommonData
    this._returnType = returnType
    this._cancelType = cancelConfig.type || 'after'
    this._errorCode = errorCode
    this._cancelCode = cancelConfig.code || -7
    this._listenerKey = listenerConfig.key || 'code'
    this._listenerMessage = listenerConfig.message || 'message'
    this._errorListener = listenerConfig.listener || {}
    this._instance = axios.create({
      baseURL,
      timeout,
      withCredentials: true
    });
    this._initInterceptorsRequest()
    this._initInterceptorsResponse()
  }
  static _initInterceptorsRequest() {
    this._instance.interceptors.request.use(
      config => {
        // 创建一个当前请求的取消代码 
        let cancel
        config.cancelToken = new axios.CancelToken(function (c) { cancel = c })
        let requestKey
        if (this._cancelType !== 'none') {
          requestKey = this._createRequestKey(config)
          this._stopRepeatRequest(requestKey, cancel)
        }
        config.requestKey = requestKey
        return config
      }
      , function (error) {
        return Promise.reject(error);
      });
  }
  static _isType(val, type) {
    return type.toLowerCase() === Object.prototype.toString.call(val).split(' ')[1].replace(']', '').toLowerCase()
  }
  static _hashStr(str) {
    let hash = 1315423933211
    for (let i = str.length - 1; i >= 0; i--) {
      let ch = str.charCodeAt(i)
      hash ^= (hash << 5) + ch + (hash >> 2)
    }
    return hash & 0x7fffffff
  }
  static _createRequestKey({ url, data, params }) {
    let dataNumber = 0
    if (this._isType(data, 'formdata')) {
      dataNumber += this._hashStr(JSON.stringify(data.keys()))
      for (const val of data.values()) {
        if (this._isType(val, 'filelist')) {
          for (const f of val) {
            dataNumber += parseInt(f.size, 10)
          }
          continue
        }
        if (this._isType(val, 'file')) {
          dataNumber += parseInt(val.size, 10)
          continue
        }
        dataNumber += this._hashStr(JSON.stringify(val))
      }
    } else {
      dataNumber = this._hashStr(JSON.stringify(data))
    }
    let paramsNumber = this._hashStr(JSON.stringify(params))
    return `u${this._hashStr(url)}d${dataNumber + paramsNumber}`
  }
  static _stopRepeatRequest(requestKey, cancel) {
    let rObj = this._requestCacheList.find(reqObj => {
      return reqObj.requestKey === requestKey
    })
    !rObj ? this._requestCacheList.push({ requestKey, cancel }) : this._cancelQuest(rObj, cancel);
  }
  static _cancelQuest(rObj, cancel) {
    if (this._cancelType === 'before') {
      cancel({ code: this._cancelCode, message: '请求中止' })
    } else {
      rObj.cancel({ code: this._cancelCode, message: '请求中止' })
      rObj.cancel = cancel
    }
  }
  static _removeRequestCache(requestKey) {
    this._requestCacheList = this._requestCacheList.filter(reqObj => {
      return reqObj.requestKey !== requestKey
    })
  }
  static _checkCode(code, message) {   
    if (Object.keys(this._errorListener).includes(code)) {
      let error = { code, message }
      this._errorListener[code]()
      return error
    }
    return null
  }
  static _initInterceptorsResponse() {
    this._instance.interceptors.response.use((response) => {
      this._removeRequestCache(response.config && response.config.requestKey)
      let resData = response.data      
      let code = `${resData[this._listenerKey]}`
      let message = resData[this._listenerMessage] || '网络异常'
      let error = this._checkCode(code, message)
      return error ? Promise.reject(error) : resData
    }, (error) => {
      !axios.isCancel(error) && this._removeRequestCache(error.config && error.config.requestKey)
      let rejError = axios.isCancel(error) ? error.message : {
        code: error.response ? error.response.status : this._errorCode,
        message: error.message || '网络异常'
      };
      this._checkCode(rejError.code, rejError.message)
      return Promise.reject(rejError);
    });
  }
  static async _sendAjax(options, returnType, errFn) {
    if (returnType) {
      try {
        let resData = await this._instance.request(options);
        return [null, resData]
      } catch (error) {
        errFn && errFn()
        return [error, null]
      }
    } else {
      return new Promise((resolve, reject) => {
        this._instance.request(options).then(res => {
          resolve(res);
        }).catch((err) => {
          errFn && errFn(err)
        })
      })
    }
  }
  static async request({
    method = 'get',  // 调用方法
    url,
    params = {},
    data = {},
    tokenKey = this._tokenKey,
    tokenFrom = this._tokenFrom,
    tokenTo = this._tokenTo || "header",
    nativeOptions = {},
    isCommonData = this._isCommonData
  }, errFn = () => null, returnType = this._returnType) {
    if (this._initStatus !== 'INIT') {
      this.init()
    }
    let options = { url, method, headers: {}, data, params }
    if (tokenKey && typeof tokenKey === 'string') {
      const tokens = tokenKey.split('|')
      let key = tokens[1] || tokens[0]
      let tokenSite = tokenTo && typeof tokenTo === 'string' ? tokenTo.split('|') : ['header']
      let token = window[tokenFrom][tokens[0]];
      tokenSite.forEach(site => {
        switch (site) {
          case 'data':
            options.data = { [key]: token, ...options.data }
            break;
          case 'params':
            options.params = { [key]: token, ...options.params }
            break;
          default:
            options.headers[key] = token
            break;
        }
      })

      if (nativeOptions.headers) {
        options.headers = {
          ...nativeOptions.headers,
          ...options.headers,
        }
      }
    }
    if (isCommonData && method === 'get') {
      options.params = { ...options.data, ...options.params }
    }
    if (nativeOptions && this._isType(nativeOptions, 'object')) {
      options = { ...nativeOptions, ...options }
    }
    return this._sendAjax(options, returnType, errFn)
  }
  static async all(arr) {
    let result = []
    let count = 0
    return new Promise((resolve, reject) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i].then((data) => {
          result[i] = data;
          count++
          if (count === arr.length) {
            resolve(result)
          }
        }, reject)
      }
    })
  }
  static install(Vue, options = {}) {
    this.init(options)
    let mountKey = options.mountKey && typeof options.mountKey === 'string' ? options.mountKey : '$ajax'
    if (Vue.prototype[mountKey]) console.warn(`${mountKey}已存在,原功能将被覆盖!`);
    Vue.prototype[mountKey] = this
  }
}
export default OptimizeAjax