var crypto = require('crypto');
var logger = require('./log4js');
var utils = module.exports;

utils.createFileName = function (data){
    var d = new Date();
    var datas = data + Math.random() + d.getTime().toString();
    var sha256 = crypto.createHash('md5');
    sha256.update(datas);
    return sha256.digest('hex');
};

/**
 * 提取对象属性
 * @param data
 * @param attrs
 */
utils.extractAttrFromObj = function (data,attrs){
    var obj = {};
    for(var i in attrs){
        var name = attrs[i];
        var val = data[name];
        if(val!=undefined||val!=null){
            obj[name] = val;
        }
    }
    return obj;
};

/**
 * 从对象中删除指定属性
 * @param data
 * @param attrs
 * @returns {*}
 */
utils.deleteAttrFromObj = function (data,attrs){
    for(var i in attrs){
        var name = attrs[i];
        delete data[name];
    }
    return data;
};

/**
 * 验证必填字段
 * @param obj
 * @param attrs
 * @return 错误返回字段名,成功返回undefined
 */
utils.requireField = function (obj, attrs){
    attrs = Array.isArray(attrs) ? attrs : attrs.split(',');
    for(var i in attrs){
        var attr = attrs[i];
        var keys = attr.split('.');
        var target = obj;
        for(var j in keys){
            var key = keys[j];
            var temp = target[key];
            if(temp||temp==0&&(typeof temp=='number')){
                target = temp;
            }else{
                logger.info("The lack of field is ['"+key+"']");
                return key;
            }
        }
    }
    return;
};

utils.isIdCardNo = function(num) {
    num = num.toUpperCase(); //身份证号码为15位或者18位，15位时全为数字，18位前17位为数字，最后一位是校验位，可能为数字或字符X。
    if (!(/(^\d{15}$)|(^\d{17}([0-9]|X)$)/.test(num))) {
        //'输入的身份证号长度不对，或者号码不符合规定！\n15位号码应全为数字，18位号码末位可以为数字或X。'
        return false;
    }//校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。
    //下面分别分析出生日期和校验位
    var len, re, arrSplit, dtmBirth, bGoodDay, arrInt, arrCh, nTemp; len = num.length;
    if (len == 15) {
        re = new RegExp(/^(\d{6})(\d{2})(\d{2})(\d{2})(\d{3})$/);
        arrSplit = num.match(re);  //检查生日日期是否正确
        dtmBirth = new Date('19' + arrSplit[2] + '/' + arrSplit[3] + '/' + arrSplit[4]);
        bGoodDay = (dtmBirth.getYear() == Number(arrSplit[2])) && ((dtmBirth.getMonth() + 1) == Number(arrSplit[3])) && (dtmBirth.getDate() == Number(arrSplit[4]));
        if (!bGoodDay) {
            //'输入的身份证号里出生日期不对！'
            return false;
        } else { //将15位身份证转成18位 //校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。
            arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
            arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
            nTemp = 0;
            num = num.substr(0, 6) + '19' + num.substr(6, num.length - 6);
            for(var i = 0; i < 17; i ++) {
                nTemp += num.substr(i, 1) * arrInt[i];
            }
            num += arrCh[nTemp % 11];
            return true;
        }
    }
    if (len == 18) {
        re = new RegExp(/^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/);
        arrSplit = num.match(re);  //检查生日日期是否正确
        dtmBirth = new Date(arrSplit[2] + "/" + arrSplit[3] + "/" + arrSplit[4]);
        bGoodDay = (dtmBirth.getFullYear() == Number(arrSplit[2])) && ((dtmBirth.getMonth() + 1) == Number(arrSplit[3])) && (dtmBirth.getDate() == Number(arrSplit[4]));
        if (!bGoodDay) {
            //'输入的身份证号里出生日期不对！'
            return false;
        }
        else { //检验18位身份证的校验码是否正确。 //校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。
            var valnum;
            arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
            arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
            nTemp = 0;
            for(var i = 0; i < 17; i ++) {
                nTemp += num.substr(i, 1) * arrInt[i];
            }
            valnum = arrCh[nTemp % 11];
            if (valnum != num.substr(17, 1)) {
                //console.log('18位身份证的校验码不正确！应该为：' + valnum);
                return false;
            }
            return true;
        }
    }
    return false;
};

/**
 * 提取身份证信息(性别,生日),注:前提是有效号码
 * @param val
 */
utils.idCardInfo = function(val) {
    var info = {}, birthdayValue;
    if(15==val.length){ //15位身份证号码
        birthdayValue = val.charAt(6)+val.charAt(7);
        if(parseInt(birthdayValue)<10){
            birthdayValue = '20'+birthdayValue;
        }else{
            birthdayValue = '19'+birthdayValue;
        }
        birthdayValue=birthdayValue+'-'+val.charAt(8)+val.charAt(9)+'-'+val.charAt(10)+val.charAt(11);
        if(parseInt(val.charAt(14)/2)*2!=val.charAt(14))
            info.sex ='男';
        else
            info.sex ='女';
        info.birthday =birthdayValue;
    }else if(18==val.length){ //18位身份证号码
        birthdayValue=val.charAt(6)+val.charAt(7)+val.charAt(8)+val.charAt(9)+'-'+val.charAt(10)+val.charAt(11)+'-'+val.charAt(12)+val.charAt(13);
        if(parseInt(val.charAt(16)/2)*2!=val.charAt(16))
            info.sex ='男';
        else
            info.sex ='女';
        info.birthday =birthdayValue;
    }
    return info;
};

/**
 * 获取客户端ip
 * 参考:Nginx 反向代理配置
 * server  {
    listen 80;
    server_name nnn.com;
    location / {
        proxy_pass      http://localhost:8081;
        proxy_redirect off;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_set_header X-NginX-Proxy true;
    }
    access_log  /home/wwwlogs/nnn.com.log  access;
 }
 * @param req
 * @returns {*|string}
 */
utils.getClientIp = function (req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};