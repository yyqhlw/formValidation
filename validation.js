 (function(){
    var configHandles = {};
    var emptyFn = function(){};
    var inputObjCache = [];
    //预定义验证
    var roles = {
         'username' : {
              regx : '^[a-zA-Z0-9_]{4,6}$',
              error : 'error',
              success : 'success',
              focus   : 'focus'
         },
         'password' : {
              regx : '^[a-zA-Z0-9_]{6,8}$',
              error : 'error',
              success : 'success',
              focus   : 'focus'
         }
    }
    /*
       自定义验证器缓存
     */
    var checkFns = {}

    /*
       表单验证 提示消息辅助类
     */
    var messageManager = function(c){
        this.config = c;
        this.type = c.tipType || 'around';
        this.msgEle = c.msgEle || null;
        this.position = c.tipPosition || 'right';
        this.defaultClass = c.defaultClass;
        this.errorClass = c.errorClass;
        this.successClass = c.successClass;
        this.ajaxClass = c.ajaxClass;
        this.tipClass = 'form_message';
        this.typeClass = {
          'focus' : 'focus',
          'error' : 'error',
          'success' : 'success',
        }
    }

    messageManager.prototype = {
       constructor : messageManager,
       show:function(type, msg, inputObj){
           var msgEle = this.getMsgEle(inputObj);
           msgEle.innerHTML = msg;
           this.addClass(msgEle, type);
           this.setPosition(msgEle, inputObj);
           msgEle.style.display = 'block';
       },
       setPosition:function(ele, inputObj){
           var offset = this.getOffset(inputObj);
           ele.style.left = offset.left +'px';
           ele.style.top = offset.top+'px';
       },
       hide:function(type, msg, inputObj){
          inputObj.msgElement.style.display = 'none';
       },
       addClass:function(ele, type){
          for(var k in this.typeClass){
             ele.className = ele.className.replace(new RegExp('\\s*'+k), ' ');
          }
          ele.className += ' '+this.typeClass[type];
       },
       //获取要现实信息的ele
       getMsgEle:function(inputObj){
           var msgEle;
           if(this.type == 'around'){
              msgEle = inputObj.msgElement;
              if(!msgEle){
                 
                 msgEle = inputObj.msgElement = this.createMsgElement(inputObj);
                 document.body.appendChild(msgEle);
              }
           }else{
              if(this.msgEle){
                 msgEle = this.msgEle;
              }else{
                 msgEle = document.createElement('div');
              }
           }
           
           return msgEle;
       },
       //获取信息显示位置
       getOffset:function(inputObj){

           var ele=inputObj.ele, left=0, top=0,rect;
           rect = ele.getBoundingClientRect();
           if(this.position == 'right'){
              left = rect.left + ele.offsetWidth;
              top = rect.top;
           }else if(this.position == 'top'){
              left = rect.left;
              top = rect.top - ele.offsetHeight;
           }else if(this.position == 'bottom'){
              left = rect.left;
              top = rect.top + inputObj.ele.offsetHeight;
           }else{
              left = rect.left;
              top = rect.top;
           }
           
           return {
              left : left,
              top : top
           }
       },
       createMsgElement:function(inputObj){
           var ele = document.createElement('div');
           ele.className = this.tipClass +' ' +this.tipClass+'_'+inputObj.selector.slice(1);
           ele.style.cssText = 'display:none;position:absolute;left:0;top:0';
           return ele;
       }
    }

    var f, vaildFrom, inputItems=[];
    //表单验证正式类
    f = vaildFrom = function (config){
        this.init(config);
    }
    

    var c = vaildFrom.defaultConfig = {
       wrapSelector : document.body,
       tipType : 'sider',
       tipVertical : 'right',
       defaultClass : '',
       errorClass : '',
       successClass : ''
    };

    f.prototype = {
      constructor:vaildFrom,
      init:function(config){
          config = config || {};
          uitl.merge(c, config);
          this.inputItems = [];
          this.msgManager = new messageManager(c);
          this.initPropress();
      },
      
      initPropress:function(){
          var n, fn, cfg, result;
          for(n in configHandles){
              fn = configHandles[n];
              cfg = c[n];
              if(cfg){
                  result = fn.call(this, n, cfg);
                  if(result === false){
                    return;
                  }
              }
          }
      },
      submit:function(){
          return this.checkAll();
      },
      checkAll:function(){
            var arr = inputItems;
            var i=0,ln = arr.length,obj, result=true;
            for(;i<ln;i++){
               obj = arr[i];
               if(obj.check() === false){
                   result = false
               }
            }

            return result;
      },
      showMsg:function(type, inputObj){
          var msg = inputObj[type] || '';
          this.msgManager.show(type, msg, inputObj);
      },
      hideMsg:function(type, inputObj){
        this.msgManager.hide(type, inputObj);
      },
      getConfig:function(name){
          return this.c[name] || '';
      }
    }
    f.addItem = function(inpObj){
         inputItems.push(inpObj);
      }
    f.removeItem = function(inpObj){
        var i=0,len=inputItems.length,item;
        for(;i<len;i++){
           if(inputItems[i] === inpObj){
              inputItems.slice(i,1);
              break;
           }
        }
      }
    /*
      通过ele查找注册的验证表单
     */
    f.getItem = function(ele){
       var i=0,len=inputItems.length,item;
        for(;i<len;i++){
           if(inputItems[i].ele === ele){
              return inputItems[i];
           }
        }
    }

    /*
      注册预处理器，善用此处可扩展出组件之类的功能，扩展方便
     */
    f.regConfigHandle = function(name, fn, cover){
          var handle, k;
          if(!name){
            return;
          }
          cover = cover || true;
          fn = fn || emptyFn;
          handle = configHandles[name];

          if(handle){
              if(cover === true){
                 configHandles[name] = fn;
              }else{
                 console.log('有同名的处理器!, 处理器添加失败');
              }
              
          }else{
              configHandles[name] = fn;
          }
    }

    /*
      注册预定义规则, 可覆盖默认设置
     */
    f.regRole = function(name, value){
        if(!value) return;
        if(!roles[name]){
           roles[name] = value;
        }else{
           for(var k in value){
              roles[name][k] = value[k];
           }
        }
        
    }

    /*
      注册自定义验证器
     */
    f.regCheckFn = function(name, fn){
        if(!fn) return;
        checkFns[name] = fn;
    }

    var u = uitl = {};
    u.merge = function(objA, objB){
        objA = objA || {};
        objB = objB || {};
        var k,value;
        for(k in objB){
            objA[k] = objB[k];
        }
    }
    var supperEvent = 'addEventListener' in document;
    u.addEvent = supperEvent ? function(ele, type, fn, scope){
         function anyone(){
              fn.call(scope || ele)
         }

         ele.addEventListener(type, anyone, false)
    } : function(ele, type, fn, scope){
         function anyone(){
              fn.call(scope || ele)
         }
         ele.attach('on'+type, anyone);
    }

    
    //表单项对象
    inputObj = function(config){
         this.selector = '';
         this.regx = '';
         this.noEmpty = false;
         this.role = '';
         this.checkFn = {};
         //取得预定义验证信息
         if(config.role && roles[config.role]){
             uitl.merge(this, roles[config.role]);
         }

         uitl.merge(this, config);
         this.eventFn = {};
         this.type = '';
         this.regx = new RegExp(this.regx);
         this.init();
    }
    inputObj.prototype = {
        init:function(){
           this.getElement();
           this.bindEvent();
        },
        getElement:function(){
            this.ele = document.querySelector(this.selector);
            this.type = this.ele.type;
            this.nodeName = this.ele.nodeName.toLowerCase();
        },
        bindEvent:function(){
            var self = this;
            switch(this.type){
                case 'password' :
                case 'text':
                   uitl.addEvent(this.ele, 'blur', this.check, this);
                   break;
            }

            switch(this.nodeName){
              case 'select' : 
                   uitl.addEvent(this.ele, 'change', this.check, this)
            }

            if(this.focus){
                 var self = this;
                 uitl.addEvent(this.ele, 'focus', function(){
                        this.trigger('focus', self);
                 }, this);
            }
        },
        check:function(){
            var val = this.getValue();
            var name = this.getName();

            //自定义验证
            for(var k in checkFns){
                
                var hd = checkFns[k], v = this[k];
                if(hd && v){
                     var ret = hd.call(this, this, v);

                     if(ret === false){
                         this.trigger('error', this);
                         return false;
                     }else if(ret === true){
                         this.trigger('success', this);
                         return true;
                     }
                }
            }

            if(!this.noEmpty && val == '' && this.nodeName != 'select'){
               return true;
            }

            if(!this.regx.test(val)){
                this.trigger('error', this);
                return false;
            }

            this.trigger('success', this);
            return true;
        },
        getValue:function(){
             var type = this.type, ele = this.ele;
             switch (type){
                 case 'radio':
                 case 'checkbox':
                    var val = this.ele.getAttribute('value');
                    val = val === null ? 'on' : val;
                    return val;
             }

             var nodeName = this.nodeName;
             switch(nodeName){
                case 'button':
                    var val = this.ele.getAttributeNode('value').nodeValue;
                    return val === '' ? undefined : val;
             }
             return ele.value === null ? '' : ele.value;
        },
        getName:function(){
             return this.ele.name;
        },
        on:function(type, fn){
            var self = this;
            if(this.eventFn[type]){
                this.eventFn[type].push(fn)
            }else{
                this.eventFn[type]=[fn]
            }
            
        },
        trigger:function(type, data){
            var callbacks = this.eventFn[type],i,ln,item;

            if(!callbacks)return;

            for(i=0,ln=callbacks.length;i<ln;i++){
                item = callbacks[i];
                item(data);
            }
        }
    }
    /*扩展注册item选项*/
    vaildFrom.regConfigHandle('items', function(name, value){
        var i,ln,val, self = this;
        for(i=0,ln=value.length;i<ln;i++){
            val = value[i];
            var oInp = new inputObj(val);
            f.addItem(oInp);
            oInp.on('focus', function(obj){
               self.showMsg('focus', obj);
            })

            oInp.on('error', function(obj){
               self.showMsg('error', obj);
            })

            oInp.on('success', function(obj){
               self.showMsg('success', obj);
            })
        }
    })

    window.vaildFrom = vaildFrom;
  })();

          