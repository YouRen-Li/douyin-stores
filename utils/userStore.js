const { Store } = require("./store.js");

class UserStore extends Store {
  constructor() {
    super();

    this.data = {
      userInfo: {
        avatarUrl: "", //头像
        nickName: "登录/注册", //昵称
        phone: "抖音手机号一键注册", //手机号
        gender: 0,  //性别 0：未知、1：男、2：女
      },
    };

    this.initFromStorage();
  }

  initFromStorage() {
    const userInfo = tt.getStorageSync("userInfo");
    if (userInfo) {
      this.data.userInfo = { ...this.data.userInfo, ...userInfo };
    }

    this.update();
  }

  updateUserInfo(newInfo) {
    this.data.userInfo = { ...this.data.userInfo, ...newInfo };

    tt.setStorageSync("userInfo", this.data.userInfo);

    this.update();
  }

  // 作为普通方法提供脱敏手机号
  getMaskedPhone() {
    const phone = this.data.userInfo.phone;
    if (!phone) return "";
    return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
  }

  fetchUserInfo() {
    return new Promise((resolve, reject) => {
      tt.getUserProfile({
        success: (res) => {
          const userInfo = {
            avatarUrl: res.userInfo.avatarUrl,
            nickName: res.userInfo.nickName,
            gender: res.userInfo.gender,
          };
          this.updateUserInfo(userInfo);
          resolve(userInfo);
        },
        fail: reject,
      });
    });
  }

  getCurrentUserInfo() {
    return this.data.userInfo;
  }
}

module.exports = new UserStore();
