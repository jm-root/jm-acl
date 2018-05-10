'use strict'
var _ = require('lodash')
var service = require('./lib')({
  db: require('jm-dao').DB.connect('mongodb://localhost:27017/acl1'),
  mq: require('jm-mq')({url: 'redis://localhost:6379'})
})
setTimeout(function () {

  // service.whatResources(['root','guest']).then(function(ret){
  //     console.log(arguments);
  // }).catch(function(){
  //     console.log(arguments);
  // });
  // service.whatResources(['root','guest'],['get'],function(){
  //     console.log(arguments);
  // });
  // service.roleResources('guest').then(function(ret){
  //     console.log(arguments);
  // }).catch(function(){
  //     console.log(arguments);
  // });
  // service.hasRole('58885d5dd0ee2812e4035ee8',function(){
  //     console.log(arguments);
  // });
  // service.hasRole('58885d5dd0ee2812e4035ee8','root').then(function(){
  //     console.log(arguments);
  // });
  // service.hasSuperRole('58885d5dd0ee2812e4035ee8',function(){
  //     console.log(arguments);
  // });
  // service.hasSuperRole('58885d5dd0ee2812e4035ee8').then(function(){
  //     console.log(arguments);
  // });
  // service.userRoles('58885d5dd0ee2812e4035ee8',function(){
  //     console.log(arguments);
  // });
  // service.userRoles('58885d5dd0ee2812e4035ee8').then(function(){
  //     console.log(arguments);
  // });
  // service.roleUsers('root',function(){
  //     console.log(arguments);
  // });
  // service.roleUsers('root').then(function(){
  //     console.log(arguments);
  // });
  // service.addUserRoles('58885d5dd0ee2812e4035ee8','user',function(){
  //     console.log(arguments);
  // });
  // service.addUserRoles('58885d5dd0ee2812e4035ee8','user').then(function(){
  //     console.log(arguments);
  // });
  // service.isAllowed('58885d5dd0ee2812e4035ee8','/acl/resources','post',function(){
  //     console.log(arguments);
  // });
  // service.isAllowed('58885d5dd0ee2812e4035ee8','/acl/resources','post').then(function(){
  //     console.log(arguments);
  // });
  // service.userResources('57563e1430a23d5239ea2068',function(err,ret){
  //     console.log(ret);
  // });
  // service.userResources('57563e1430a23d5239ea2068', '/acl/roles',function(err,ret){
  //     console.log(ret);
  // });

}, 1000)
