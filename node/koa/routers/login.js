
    var Router = require('koa-router');
    var path = require('path');
    var sendfile = require('koa-sendfile');
    var commonSer = require(path.resolve('koa/server/common.js'));
    var server = require(path.resolve('koa/server/' + path.basename(__filename)));
    var config = require(path.resolve('plugins/read-config.js'));
    module.exports = function(config){

        var router = new Router();
        router.get('/login', function *(){      //获取登陆页面
            var $self = this;
            var username = this.cookies.get('username');
            var password = this.cookies.get('password');
            var readmemberMe = this.cookies.get('readmemberMe');
            if(username&&password&&readmemberMe=="true"){
                var user = {username:username,password:password};
                yield (server().login(user)
                    .then((parsedBody) =>{
                        var responseText = JSON.parse(parsedBody);
                        if(responseText.code == 0){
                            var token = responseText.data;
                            $self.body = responseText;
                            $self.cookies.set('token', token, {maxAge : 1000 * 60 * 60 * 24 * 7});
                            $self.cookies.set('username', user.username, {maxAge : 1000 * 60 * 60 * 24 * 7});
                            $self.cookies.set('password', user.password, {maxAge : 1000 * 60 * 60 * 24 * 7});
                            $self.redirect('/index');
                        } else if(responseText.code == 1){
                            $self.body = responseText;
                        }
                    }).catch((error) =>{
                        if(error.error && error.error.code && error.error.code == 'ETIMEDOUT'){//登录超时
                            $self.body = {'msg' : '请求错误！', errno : 3};
                            $self.status = 408;
                        }
                    }));
            }else{
                yield (sendfile(this, path.resolve('login.html')));
                if(!this.status){
                    this.throw(404);
                }
            }

        }).post('/login', function*(){     //获取登录数据
            var user = this.request.body;
            var $self = this;
            yield (server().login(user)
                .then((parsedBody) =>{
                    var responseText = JSON.parse(parsedBody);
                    if(responseText.code == 0){
                        var token = responseText.data;
                        $self.body = responseText;
                        $self.cookies.set('token', token, {maxAge : 1000 * 60 * 60 * 24 * 7});
                        if(user.readmemberMe=='true'){
                            $self.cookies.set('username', user.username, {maxAge : 1000 * 60 * 60 * 24 * 7});
                            $self.cookies.set('password', user.password, {maxAge : 1000 * 60 * 60 * 24 * 7});
                            $self.cookies.set('readmemberMe', true, {maxAge : 1000 * 60 * 60 * 24 * 7});
                        }
                    } else if(responseText.code == 1){
                        $self.body = responseText;
                    }
                }).catch((error) =>{
                    if(error.error && error.error.code && error.error.code == 'ETIMEDOUT'){//登录超时
                        $self.body = {'msg' : '请求错误！', errno : 3};
                        $self.status = 408;
                    }
                }));
        }).get("/islogin", function*(){
            var token = this.cookies.get('token');
            var isToken = {"token" : token};
            var $self = this;
            yield (commonSer().islogin(isToken)
                .then((parsedBody) =>{
                    var responseText = JSON.parse(parsedBody);
                    $self.body = responseText;
                }).catch((error) =>{
                    if(error.error && error.error.code && error.error.code == 'ETIMEDOUT'){//登录超时
                        $self.body = {'msg' : '请求错误！', errno : 3};
                        $self.status = 408;
                    }
                }))
        })

        return router;
    };
