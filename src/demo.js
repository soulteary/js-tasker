/**
 * SETTIMEOUT 模拟和服务器交互的接口的延迟，异步执行，等待执行。
 *
 * 1.首先添加一个睡懒觉的任务，这个任务不会主动触发 trigger: false
 *   并且没有任何依赖 option: false
 */
setTimeout(function () {
    var taskContent = {
        title: '1.想要睡懒觉',
        cmd: 'notice',
        trigger: false,
        option: false,
        func: function () {
            console.log('  >>>明天睡懒觉，这个事件被其他的事件触发了。');
        }
    };
    task.add(taskContent);
}, 100);


/**
 * 2.然后添加一个计划起床的任务，这个任务会主动触发 trigger: true,
 *   并且在触发的时候将之前同组没有触发的任务也触发掉
 */
setTimeout(function () {
    var taskContent = {
        title: '2.计划起床',
        cmd: 'notice',
        trigger: true,
        option: false,
        func: function () {
            console.log('  >>>计划有变，早点起床，这个任务会触发所有睡觉相关任务。');
        }
    };
    task.add(taskContent);
}, 300);


/**
 * 3.接着添加一个出门前穿衣服的计划，这个计划有依赖，依赖为getup。
 *   即使trigger: true，如果没有依赖存在，他是不会执行的
 *   注意cmd和option中的事件需要一致，比如都是getup
 */
setTimeout(function () {
    var taskContent = {
        title: '3.声明出门前穿衣服',
        cmd: 'getup',
        trigger: true,
        option: 'DEP:getup',
        func: function () {
            console.log('  >>>出门，但是要先穿上衣服。');
        }
    };
    task.add(taskContent);
}, 500);


/**
 * 4.最后添加一个穿衣服的任务，这个任务注册事件为getup，会执行所有的依赖这个家伙的任务
 */
setTimeout(function () {
    var taskContent = {
        cmd: 'getup',
        func: function () {
            console.log('  >>>起床，穿上衣服。');
        },
        trigger: true,
        option: 'REG:getup',
        title: '4.最后注册起床穿衣服'
    };
    task.add(taskContent);
}, 1500);


/**
 * 5.随便注册一个函数并执行，没有依赖也无所谓
 */
setTimeout(function () {
    var taskContent = {
        cmd: 'nerd',
        trigger: true,
        func: function (e) {
            console.log('  >>>发呆。')
        },
        option: 'REG:nerd',
        title: '5.发呆....'
    };
    task.add(taskContent);
}, 1500);