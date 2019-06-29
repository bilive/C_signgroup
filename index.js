"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_1 = __importStar(require("../../plugin"));
class SignGroup extends plugin_1.default {
    constructor() {
        super();
        this.name = '应援团签到';
        this.description = '在已加入的应援团签到';
        this.version = '0.0.1';
        this.author = 'lzghzr';
        this._signGroupList = new Map();
    }
    async load({ defaultOptions, whiteList }) {
        defaultOptions.newUserData['signGroup'] = false;
        defaultOptions.info['signGroup'] = {
            description: '应援团签到',
            tip: '在已加入的应援团签到',
            type: 'boolean'
        };
        whiteList.add('signGroup');
        this.loaded = true;
    }
    async start({ users }) {
        this._signGroup(users);
    }
    async loop({ cstMin, cstHour, cstString, users }) {
        if (cstString === '00:10')
            this._signGroupList.clear();
        if (cstMin === 30 && cstHour % 8 === 4)
            this._signGroup(users);
    }
    _signGroup(users) {
        users.forEach(async (user, uid) => {
            if (this._signGroupList.get(uid) || !user.userData['signGroup'])
                return;
            const group = {
                uri: `https://api.live.bilibili.com/link_group/v1/member/my_groups?${plugin_1.AppClient.signQueryBase(user.tokenQuery)}`,
                json: true,
                headers: user.headers
            };
            const linkGroup = await plugin_1.tools.XHR(group, 'Android');
            if (linkGroup !== undefined && linkGroup.response.statusCode === 200) {
                if (linkGroup.body.code === 0) {
                    const listLength = linkGroup.body.data.list.length;
                    if (listLength === 0 || listLength === this._signGroupList.get(uid))
                        return;
                    let ok = 0;
                    for (const groupInfo of linkGroup.body.data.list) {
                        const sign = {
                            uri: `https://api.live.bilibili.com/link_setting/v1/link_setting/sign_in?\
${plugin_1.AppClient.signQueryBase(`${user.tokenQuery}&group_id=${groupInfo.group_id}&owner_id=${groupInfo.owner_uid}`)}`,
                            json: true,
                            headers: user.headers
                        };
                        const signGroup = await plugin_1.tools.XHR(sign, 'Android');
                        if (signGroup !== undefined && signGroup.response.statusCode === 200) {
                            ok++;
                            if (signGroup.body.data.add_num > 0)
                                plugin_1.tools.Log(user.nickname, '应援团签到', `在${groupInfo.group_name}签到获得 ${signGroup.body.data.add_num} 点亲密度`);
                            else
                                plugin_1.tools.Log(user.nickname, '应援团签到', `已在${groupInfo.group_name}签到过`);
                        }
                        else
                            plugin_1.tools.Log(user.nickname, '应援团签到', '网络错误');
                        await plugin_1.tools.Sleep(3000);
                    }
                    this._signGroupList.set(uid, ok);
                }
                else
                    plugin_1.tools.Log(user.nickname, '应援团签到', '获取列表', linkGroup.body);
            }
            else
                plugin_1.tools.Log(user.nickname, '应援团签到', '获取列表', '网络错误');
        });
    }
}
exports.default = new SignGroup();
