/* global window, console */
(function (win, DEBUG, undefined) {
    'use strict';

    DEBUG = DEBUG && window.console && console.log;

    var VER = '20150626';

    /**
     * 添加inArray工具方法
     *
     * @from jQuery
     * @param elem
     * @param arr
     * @param i
     * @returns {number}
     */
    function inArray(elem, arr, i) {
        var len;

        if (arr) {
            if ([].indexOf) {
                return [].indexOf.call(arr, elem, i);
            }

            len = arr.length;
            i = i ? i < 0 ? Math.max(0, len + i): i: 0;

            for (; i < len; i++) {
                if (i in arr && arr[i] === elem) {
                    return i;
                }
            }
        }
        return -1;
    }

    function emptyFunc() {
        return;
    }

    var delayQueue = [];
    var depend = {};

    /**
     * 用处理计划任务的方式去处理页面中的事物，这些解耦或许会好点？
     * 有的时候我们会添加很多任务，但是不一定要立即执行，有的可能会先添加，然后等待某一个事件添加完成后才全部执行。
     * 但是如果有的数据异常，之前的事情不想做了，那么也可以删除队列。
     */
    var task = {
        __check__   : function (cmd) {
            var protectList = ['__check__', 'exec', 'kill', 'add'];
            if (inArray(cmd, protectList) !== -1) {
                throw Error('THIS METHOD DO NOT ALLOW REWRITE.');
            } else {
                return true;
            }
        },
        exec        : function (cmd, title) {
            if (!this.__check__(cmd)) {
                return false;
            }
            if (cmd in this) {
                for (var i = 0, j = this[cmd].length; i < j; i++) {
                    /**
                     * 有依赖先执行依赖策略
                     */
                    if (depend[cmd] && depend[cmd].mask) {
                        for (var item in depend[cmd]) {
                            if (depend[cmd].hasOwnProperty(item)) {
                                if (inArray(i, depend[cmd][item].mask) !== -1) {
                                    if (depend[cmd][item].host !== undefined) {
                                        if (DEBUG) {
                                            console.log('#任务正在执行：', title);
                                        }
                                        if (task[cmd][depend[cmd][item].host] !== task[cmd][depend[cmd][item].mask]) {
                                            task[cmd][depend[cmd][item].host] && task[cmd][depend[cmd][item].host].call(),
                                            task[cmd][depend[cmd][item].mask] && task[cmd][depend[cmd][item].mask].call(),
                                                task.kill(cmd, depend[cmd][item].mask),
                                                task.kill(cmd, depend[cmd][item].host);
                                        } else {
                                            task[cmd][depend[cmd][item].host] && task[cmd][depend[cmd][item].host].call(), task.kill(cmd, depend[cmd][item].host);
                                        }
                                    }
                                }
                            }
                        }
                    } else if (depend[cmd] && !depend[cmd].mask) {
                        if (depend[cmd].host !== undefined) {
                            if (DEBUG) {
                                console.log('#任务正在执行：', title);
                            }
                            task[cmd][depend[cmd].host] && task[cmd][depend[cmd].host].call(), task.kill(cmd, depend[cmd].host);
                        }
                    } else if (!depend[cmd]) {
                        if (DEBUG) {
                            console.log('#任务正在执行[无依赖]：', title);
                        }
                        this[cmd][i] && this[cmd][i].call(), this.kill(cmd, i--), j--;
                    } else {
                        throw Error('WAITING FOR DEPEND FUNC REG.');
                    }
                }

            }
        },
        add         : function (options) {
            var cmd = options.cmd;
            /**
             * 默认空事件
             * @type {func|Function}
             */
            var func = options.func || emptyFunc;
            /**
             * 默认事件不触发
             */
            var trigger = options.trigger || false;
            var option = options.option;
            var title = options.title || '';

            if (!cmd || !this.__check__(cmd)) {
                return false;
            }
            task[cmd] = task[cmd] || [];
            task[cmd].push(func);
            if (DEBUG) {
                console.log('#任务已添加：', title);
            }
            var exec = function (cmd) {
                if (cmd in task) {
                    task.exec(cmd, title);
                }
            };
            if (option) {
                var format = option.match(/(\w+):(\w+)/ig);
                if (format) {
                    var data = option.split(':');
                    var action = data[0];
                    var assign = data[1];
                    switch (action) {
                        case 'REG':
                            /**
                             * 如果没有注册过就注册，注册过就更新依赖的内容
                             */
                            if (DEBUG) {
                                console.log('#更新依赖：', title);
                            }
                            depend[assign] = depend[assign] || {};
                            if (depend[assign].host && task[cmd][depend[assign].host]) {
                                this.kill(task[cmd], depend[assign].host);
                            }
                            depend[assign].host = inArray(func, task[cmd]);
                            if (trigger === true) {
                                exec(cmd);
                            }
                            break;
                        case 'DEP':
                            /**
                             * 添加任务的时候，如果存在依赖的任务就执行掉。
                             * 否则注册这个事件，但是主题执行的留空
                             */
                            if (DEBUG) {
                                console.log('#调用依赖：', title);
                            }
                            if (depend[assign]) {
                                task[cmd][depend[assign]].call(null);
                                delete depend[assign];
                                /**
                                 * 这里或许需要把关联数组内的函数也全部执行一遍
                                 */
                                if (trigger === true) {
                                    exec(cmd);
                                }
                            } else {
                                depend[assign] = {};
                                depend[assign].mask = depend[assign].mask || [];
                                depend[assign].mask.push(inArray(func, task[cmd]));
                            }
                            break;
                    }
                }
            } else {
                if (trigger === true) {
                    exec(cmd);
                }
            }
        },
        kill        : function (cmd, i) {
            if (!this.__check__(cmd)) {
                return false;
            }
            task[cmd].splice(inArray(task[cmd][i], task[cmd]), 1);
            if (!task[cmd].length) {
                delete task[cmd];
            }
            if (DEBUG) {
                console.log('#删除了一个任务。');
            }
        },
        delay       : function (func, time) {
            if (func) {
                if (!time || isNaN(time)) {
                    time = 1000;
                }
                delayQueue.push([function () {
                    func();
                    task.next();
                }, time]);
            }
            return task;
        },
        next        : function () {
            delayQueue.length && win.setTimeout.apply(null, delayQueue.shift());
            return task;
        },
        start       : function () {
            delayQueue.length && win.setTimeout.apply(null, delayQueue.shift());
            return task;
        },
        _checkQueue : function () {

        },
        version     : VER
    };

    win.task = task;

})(window, false);
