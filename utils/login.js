import http from "./http";
// 是否登录开发者服务端
let isDeveloperServerLogin = false;
// 是否登录抖音主端
let isDouyinLogin = false;
class LoginController {
  _token = "";
  _openid = "";
  _unionid = "";

  /**
   * @description: 登录函数，首先调用tt.login获取code，并向开发者服务端请求登录
   * @param {*} force 当用户未登录抖音app时，是否强制调起抖音app登录界面
   * @return {*}
   */
  async login(force = true) {
    if (isDeveloperServerLogin) {
      return;
    }
    let loginData = null;
    try {
      // 是否强制调起抖音的登录窗口
      loginData = await http.promisify(tt.login, { force });
      isDouyinLogin = loginData.isLogin;
    } catch (err) {
      console.error(err);
      tt.showToast({
        icon: "fail",
        title: "开发者取消登录抖音",
      });
    }
    if (isDouyinLogin && loginData) {
      try {
        // 与开发者服务端交互，进行登录
        await this.loginToDeveloperServer(loginData.code);
        isDeveloperServerLogin = true;
      } catch (err) {
        console.error(err);
        tt.showToast({
          title: "授权登录失败",
          icon: "fail",
        });
      }
    }
    return isDouyinLogin;
  }

  /**
   * @description: 请求开发者服务端，做code2session
   * @param {string} code tt.login返回的code
   * @return {*}
   */
  async loginToDeveloperServer(code) {
    try {
      tt.showLoading({
        title: "正在登录开发者服务端",
      });
      const res = await http.post("/api/apps/login", { code });
      this._token = res.data.token;
      this._openid = res.data.openid;
      this._unionid = res.data.unionid;
      tt.setStorageSync("token", res.data.token);
      tt.setStorageSync("openid", res.data.openid);
      tt.setStorageSync("unionid", res.data.unionid);
    } catch (err) {
      console.log(err);
    } finally {
      tt.hideLoading({});
    }
  }

  /**
   * @description: 登出开发者服务端
   * @return {*}
   */
  async logout() {
    await http.post("/api/apps/logout", {
      token: this.getToken(),
    });
    isDeveloperServerLogin = false;
    tt.removeStorageSync("token");
    tt.removeStorageSync("openid");
    tt.removeStorageSync("unionid");
    tt.removeStorageSync("phoneNumberLogin");
    tt.removeStorageSync("customLogin");
  }

  /**
   * @description: 返回是否登录抖音主端
   * @return {*}
   */
  isDouyinLogin() {
    return isDouyinLogin;
  }

  /**
   * @description: 是否登录开发者服务端
   * @return {*}
   */
  isDeveloperServerLogin() {
    return isDeveloperServerLogin;
  }

  /**
   * @description: 获取localStorage中的token
   * @return {string}
   */
  getToken() {
    return this._token || tt.getStorageSync("token");
  }

  // openid和unionid由开发者服务端下发，此处只是为了前端做展示；
  // 在实际情况中不建议开发者下发openid和unionid
  /**
   * @description: 获取localStorage中的openid
   * @return {string}
   */
  getOpenid() {
    return this._openid || tt.getStorageSync("openid");
  }

  /**
   * @description: 获取localStorage中的unionid
   * @return {string}
   */
  getUnionid() {
    return this._unionid || tt.getStorageSync("unionid");
  }
}
export const loginController = new LoginController();
