(function (win, undefined) {
    "use strict";

    var DEBUG = true;
        DEBUG = DEBUG && window.console && console.log;
    var VER = '20141027';

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
            i = i ? i < 0 ? Math.max(0, len + i) : i : 0;

            for (; i < len; i++) {
                if (i in arr && arr[ i ] === elem) {
                    return i;
                }
            }
        }

        return -1;
    }

    /**
     * 用处理计划任务的方式去处理页面中的事物，这些解耦或许会好点？
     * 有的时候我们会添加很多任务，但是不一定要立即执行，有的可能会先添加，然后等待某一个事件添加完成后才全部执行。
     * 但是如果有的数据异常，之前的事情不想做了，那么也可以删除队列。
     * @type {{depend: {}, __check__: __check__, exec: exec, add: add, kill: kill, version: string}}
     */
    win.task = {
        depend   : {},
        __check__: function (cmd) {
            var protectList = ['__check__', 'exec', 'kill', 'add'];
            if (inArray(cmd, protectList) !== -1) {
                throw Error('THIS METHOD DO NOT ALLOW REWRITE.');
                return false;
            } else {
                return true;
            }
        },
        exec     : function (cmd, title) {
            if (!this.__check__(cmd)) {
                return false;
            }
            if (cmd in this) {
                for (var i = 0, j = this[cmd].length; i < j; i++) {
                    /**
                     * 有依赖先执行依赖策略
                     */
                    if (this.depend[cmd] && this.depend[cmd]['mask']) {
                        $(this.depend[cmd]).each(function (k, v) {
                            if (inArray(i, v['mask']) !== -1) {
                                if (v['host'] !== undefined) {
                                    if (DEBUG) {
                                        console.log('#任务正在执行：', title);
                                    }
                                    if (task[cmd][v['host']] !== task[cmd][v['mask']]) {
                                        task[cmd][v['host']] && task[cmd][v['host']].call(),
                                            task[cmd][v['mask']] && task[cmd][v['mask']].call(),
                                            task.kill(cmd, v['mask']),
                                            task.kill(cmd, v['host']);
                                    } else {
                                        task[cmd][v['host']] && task[cmd][v['host']].call(), task.kill(cmd, v['host']);
                                    }
                                }
                            }
                        });
                    } else if (this.depend[cmd] && !this.depend[cmd]['mask']) {
                        this.depend[cmd]['host']
                        if (this.depend[cmd]['host'] !== undefined) {
                            if (DEBUG) {
                                console.log('#任务正在执行：', title);
                            }
                            task[cmd][this.depend[cmd]['host']] && task[cmd][this.depend[cmd]['host']].call(), task.kill(cmd, this.depend[cmd]['host']);
                        }
                    } else if (!this.depend[cmd]) {
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
        add      : function (options) {
            var cmd = options.cmd;
            /**
             * 默认空事件
             * @type {func|Function}
             */
            var func = options.func || function () {
            };
            /**
             * 默认事件不触发
             * @type {taskContent.trigger|*|boolean}
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
                            this.depend[assign] = this.depend[assign] || {};
                            if (this.depend[assign]['host'] && task[cmd][this.depend[assign]['host']]) {
                                this.kill(task[cmd], this.depend[assign]['host'])
                            }
                            this.depend[assign]['host'] = inArray(func, task[cmd]);
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
                            if (this.depend[assign]) {
                                task[cmd][this.depend[assign]].call(null);
                                delete this.depend[assign];
                                /**
                                 * 这里或许需要把关联数组内的函数也全部执行一遍
                                 */
                                if (trigger === true) {
                                    exec(cmd);
                                }
                            } else {
                                this.depend[assign] = {};
                                this.depend[assign]['mask'] = this.depend[assign]['mask'] || [];
                                this.depend[assign]['mask'].push(inArray(func, task[cmd]));
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
        kill     : function (cmd, i) {
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
        version  : VER
    };
})(window);