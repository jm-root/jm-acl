var assert = require('chai').assert,
    should = require('chai').should();

var argv = require('minimist')(process.argv.slice(2));
var way = argv.O || 'alone';
way = ['alone','union'].indexOf(way)==-1 ? 'alone' : way;

var request;
var server = '';
var service;
if(way==='alone'){//独立运行测试
    var app = require('../app');
    service = app.service;
    request = require('supertest')(app);
}else{//主,测分离
    service = require('../lib')();
    request = require('superagent');
    server = 'http://localhost:3000';
}
var acluri = server + '/acl/v1';

var token = '';
var uid;
describe('api', function () {

    before(function(done) {
        service.sso.signon_noauth({
            account:'admin'
        },function(err,doc){
            uid = doc.id;
            token = doc.token;
            done(err);
        });
    });

    it('GET /orgs',function(done){
        request.get(acluri+'/orgs')
            .query({token:token,page:1})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('GET /orgs/:id',function(done){
        request.get(acluri+'/orgs/56f4b64d728c84c80b7324c6')
            .query({token:token})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('GET /orgs/tree',function(done){
        request.get(acluri+'/orgs/tree')
            .query({token:token})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('GET /orgs/:id/users',function(done){
        request.get(acluri+'/orgs/56f4b64d728c84c80b7324c6/users')
            .query({token:token})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('GET /orgs/:id/roles',function(done){
        request.get(acluri+'/orgs/56f4b64d728c84c80b7324c6/roles')
            .query({token:token})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('GET /orgs/:id/resources',function(done){
        request.get(acluri+'/orgs/56f4b64d728c84c80b7324c6/resources')
            .query({token:token})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('POST /orgs',function(done){
        request.post(acluri+'/orgs')
            .send({ pcode:'root', code:'part1', title:'开发部', description:'开发部'})
            .query({token:token})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('POST /orgs/:id',function(done){
        request.post(acluri+'/orgs/56f4b64d728c84c80b7324c6')
            .send({ description:'主体'})
            .query({token:token})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('POST /orgs/:id/roles',function(done){
        request.post(acluri+'/orgs/56f605784549d790169952aa/roles')
            .send({ code:'guest', title:'访客', description:'普通访问权限'})
            .query({token:token})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('POST /orgs/:id/resources',function(done){
        request.post(acluri+'/orgs/56f605784549d790169952aa/resources')
            .send({ code:'/acl/v1/orgs/tree', title:'获取组织树'})
            .query({token:token})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('DELETE /orgs',function(done){
        request.delete(acluri+'/orgs')
            .query({token:token,id:'56f4b64d728c84c80b7324c6'})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('DELETE /orgs/:id',function(done){
        request.delete(acluri+'/orgs/56f4b64d728c84c80b7324c6')
            .query({token:token})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('GET /user/roles',function(done){
        request.get(acluri+'/user/roles')
            .query({token:token})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('GET /user/permissions',function(done){
        request.get(acluri+'/user/permissions')
            .query({token:token,resource:'/acl/v1/user/roles'})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('GET /roles',function(done){
        request.get(acluri+'/roles')
            .query({orgs:['root']})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('POST /roles',function(done){
        request.post(acluri+'/roles')
            .send({ code:'guest',title:'访客',description:'拥有普通访问权限',orgs:'root'})
            .query({token:token})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('DELETE /roles/:role',function(done){
        request.delete(acluri+'/roles/guest')
            .query({token:token})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('GET /roles/:role/users',function(done){
        request.get(acluri+'/roles/superadmin/users')
            .query({token:token,page:1})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('POST /roles/:user/roles',function(done){
        request.post(acluri+'/roles/'+uid+'/roles')
            .query({token:token,role:'admin'})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('DELETE /roles/:user/roles',function(done){
        request.delete(acluri+'/roles/'+uid+'/roles')
            .query({token:token})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('GET /roles/:role/resources',function(done){
        request.get(acluri+'/roles/admin/resources')
            .query({token:token,page:1,complex:true})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('POST /roles/:role/permissions',function(done){
        request.post(acluri+'/roles/admin/permissions')
            .query({token:token,resource:'/acl/v1/orgs/tree',permissions:'get'})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('DELETE /roles/:role/permissions',function(done){
        request.delete(acluri+'/roles/admin/permissions')
            .query({token:token,resource:'/admin/v1/nav',permissions:'nav_permission_manage'})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

    it('DELETE /roles/:role/resources',function(done){
        request.delete(acluri+'/roles/admin/resources')
            .query({token:token,resource:'/admin/v1/nav'})
            .end(function(err,res){
                if(err) return done(err);
                assert(res.status == 200);
                done();
                console.log(res.text);
            });
    });

});