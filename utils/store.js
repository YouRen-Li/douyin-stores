const TYPE_ARRAY = "[object Array]";
const TYPE_OBJECT = "[object Object]";
const TYPE_FUNCTION = "[object Function]";
// 全局状态存储
function getType(obj) {
  return Object.prototype.toString.call(obj);
}

function setComputed(storeData, value, obj, key) {
  const type = getType(value);
  if (type === TYPE_FUNCTION) {
    Object.defineProperty(obj, key, {
      enumerable: true,
      get: function () {
        return value.call(storeData);
      },
      set: function () {
        console.log("计算属性不支持重新赋值");
      },
    });
  } else if (type === TYPE_OBJECT) {
    Object.keys(value).forEach((subKey) => {
      setComputed(storeData, value[subKey], value, subKey);
    });
  } else if (type === TYPE_ARRAY) {
    value.forEach((item, index) => {
      setComputed(storeData, item, value, index);
    });
  }
}

function deepCopy(data) {
  const type = getType(data);
  if (type === TYPE_OBJECT) {
    const obj = {};
    Object.keys(data).forEach((key) => (obj[key] = deepCopy(data[key])));
    return obj;
  }
  if (type === TYPE_ARRAY) {
    return data.map(deepCopy);
  }
  return data;
}

function getNowPage() {
  const pages = getCurrentPages();
  return pages[pages.length - 1];
}

function setState(vm, data) {
  vm._new_data = vm._new_data || {};
  Object.assign(vm._new_data, data);
  return new Promise((resolve) => {
    Promise.resolve().then(() => {
      if (vm._new_data) {
        const diffState = getDiffState(vm._new_data, vm.data);
        vm._new_data = null;
        vm.setData(diffState, resolve);
      } else {
        resolve();
      }
    });
  });
}

function getDiffState(state, preState) {
  const newState = {};
  stateDiff(deepCopy(state), preState, "", newState);
  return newState;
}

function addDiffState(newState, key, val) {
  if (key !== "") newState[key] = val;
}

function stateDiff(state, preState, path, newState) {
  if (state === preState) return;

  const stateType = getType(state);
  const preStateType = getType(preState);

  if (stateType === TYPE_OBJECT) {
    const stateKeys = Object.keys(state);
    const preStateKeys = Object.keys(preState || {});
    const stateLen = stateKeys.length;
    const preStateLen = preStateKeys.length;

    if (path !== "") {
      if (
        preStateType !== TYPE_OBJECT ||
        stateLen < preStateLen ||
        stateLen === 0 ||
        preStateLen === 0
      ) {
        addDiffState(newState, path, state);
        return;
      }
      preStateKeys.forEach((key) => {
        if (state[key] === undefined) {
          state[key] = null;
          if (!stateKeys.includes(key)) {
            stateKeys.push(key);
          }
        }
      });
    }

    stateKeys.forEach((key) => {
      const subPath = path === "" ? key : `${path}.${key}`;
      stateDiff(state[key], preState[key], subPath, newState);
    });
    return;
  }

  if (stateType === TYPE_ARRAY) {
    if (
      preStateType !== TYPE_ARRAY ||
      state.length < preState.length ||
      state.length === 0 ||
      preState.length === 0
    ) {
      addDiffState(newState, path, state);
      return;
    }

    preState.forEach((_, index) => {
      if (state[index] === undefined) state[index] = null;
    });

    state.forEach((item, index) => {
      stateDiff(item, preState[index], `${path}[${index}]`, newState);
    });
    return;
  }

  addDiffState(newState, path, state);
}

function getVmRoute(vm) {
  return vm.route;
}

function getCurrentRoutes() {
  return getCurrentPages().map((f) => getVmRoute(f));
}

function initRoute(vm) {
  return vm.route || vm.__route__;
}

class Store {
  constructor() {
    this.__vms = [];
    this.__delayTimer = null;
    this.__isReadyComputed = false;
    this.data = {};

    setTimeout(() => {
      this._setComputed();
    }, 0);
  }

  _setComputed() {
    if (!this.__isReadyComputed) {
      this.__isReadyComputed = true;
      setComputed(this.data, this.data, this.data, "");
    }
  }

  bind(vm, key) {
    if (!key) {
      console.error(
        `请设置store在当前组件实例data中的key，如store.bind(this, '$store')`
      );
      return;
    }
    vm.data = vm.data || {};
    vm.data[key] = null;

    this._setComputed();
    setState(vm, { [key]: this.data });

    if (!this.__vms.some((f) => f.vm === vm && f.key === key)) {
      this.__vms.push({ vm, key });
      const rootVm = vm.$page || vm.pageinstance || getNowPage() || {};
      vm.route = initRoute(vm) || initRoute(rootVm);
    }
  }

  unbind(vm) {
    this.__vms = this.__vms.filter((f) => f.vm !== vm);
  }

  update() {
    const currRoutes = getCurrentRoutes();
    const nowVmRoute = currRoutes[currRoutes.length - 1];
    const delayVms = [];

    this.__vms.forEach((f) => {
      const vmRoute = getVmRoute(f.vm);
      if (currRoutes.includes(vmRoute)) {
        if (nowVmRoute === vmRoute) {
          setState(f.vm, { [f.key]: this.data });
        } else {
          delayVms.push(f);
        }
      }
    });

    if (!delayVms.length) return;

    clearTimeout(this.__delayTimer);
    this.__delayTimer = setTimeout(() => {
      delayVms.forEach((f) => setState(f.vm, { [f.key]: this.data }));
    }, 360);
  }
}

// 使用 CommonJS 导出方式，适配小程序
module.exports = {
  Store,
};
