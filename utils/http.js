class http {
    // 后端基地址
    static BASE_URL = "";

    /**
     * @description: 将小程序api封装成Promise
     * @param {any} func js api，例如tt.login
     * @param {*} options 传入api的参数
     * @return {*}
     */
    promisify(func, options = {}) {
        return new Promise((resolve, reject) => {
            func({
                ...options,
                success(res) {
                    resolve(res);
                },
                fail(err) {
                    reject(err);
                },
            });
        });
    }

    /**
     * @description: 封装tt.request方法
     * @param {RequestData} options
     * @return {*}
     */
    async request(options) {
        const urlRegexp =
            /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
        const {
            url
        } = options;

        // 处理URL
        if (url && !urlRegexp.test(url)) {
            options.url = new URL(url, http.BASE_URL).href;
        }

        // 设置默认请求头
        const headers = {
            "Content-Type": "application/json",
            ...options.header,
            'Accept': 'application/json',
        };

        // 添加授权请求头
        // const token = tt.getStorageSync("token");
        // if (token) {
        //     headers.Authorization = `bearer ${token}`;
        // }
        options.header = headers;

        try {
            const res = await this.promisify(tt.request, options);
            return res.data;
        } catch (error) {
            // 处理401错误的不同情况
            if (error.statusCode === 401 && error.data && error.data.code) {
                const {
                    code
                } = error.data;
                switch (code) {
                    case "INVALID":
                        // token无效，清除token并跳转登录
                        tt.removeStorageSync("token");
                        tt.removeStorageSync("openid");
                        tt.removeStorageSync("unionid");
                        tt.showToast({
                            title: "token无效，请重新登录",
                            icon: "fail",
                        });
                        tt.navigateTo({
                            url: "/pages/login/login",
                        });
                        break;

                    case "EXPIRED":
                        // token过期，可以尝试刷新token后重试
                        tt.showToast({
                            title: "token已过期，请重新登录",
                            icon: "fail",
                        });
                        // 这里可以实现token刷新逻辑或跳转登录
                        break;

                    case "NO_PERMISSION":
                        // 无权限
                        tt.showToast({
                            title: "无权限访问",
                            icon: "fail",
                        });
                        break;
                }
            }

            throw error;
        }
    }

    async get(url, data, options = {}) {
        return await this.request({
            url,
            method: "GET",
            data,
            ...options,
        });
    };

    async post(url, data, options = {}) {
        return await this.request({
            url,
            method: "POST",
            data,
            ...options,
        });
    };

    async put(url, data, options = {}) {
        return await this.request({
            url,
            method: "PUT",
            data,
            ...options,
        });
    };

    async del(url, data, options = {}) {
        return await this.request({
            url,
            method: "DELETE",
            data,
            ...options,
        });
    };
}

export default new http();