var jm = require('jm-core');

var ERRCODE_ACL = 2000;
jm.ERR.acl = {
    REQUIRE:{
        err: ++ERRCODE_ACL,
        msg: '缺少必填项'
    }
    ,PARAM:{
        err: ++ERRCODE_ACL,
        msg: '参数异常'
    }
    ,SYSTEM:{
        err: ++ERRCODE_ACL,
        msg: '系统错误'
    }
    ,DATA_NOT_EXIST:{
        err: ++ERRCODE_ACL,
        msg: '数据不存在'
    }
    ,DATA_EXIST:{
        err: ++ERRCODE_ACL,
        msg: '数据已存在'
    }
    ,NOT_LOGIN:{
        err: ++ERRCODE_ACL,
        msg: '未登录'
    }
    ,NOT_PERMISSION:{
        err: ++ERRCODE_ACL,
        msg: '没有权限'
    }
};

module.exports = {
    ERR: jm.ERR
};

