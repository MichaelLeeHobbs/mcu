// Name: Timers Polyfill
// Description: JS Timer Polyfills
// Warning: EXPERIENTIAL! DO NOT USE!
// Version: 0.1.0
// History: 20200726T1224 - Initial Experiential Release 0.1.0
// based on the work of https://gist.github.com/nbeloglazov/9633318

// (function (context) {
//     with (JavaImporter(java.util.concurrent.Executors, java.util.concurrent.TimeUnit, java.lang.Runnable)) {
//         function TimerTask(fn, delay, timerType, id) {
//             this.id = id
//             delay = Number.isInteger(delay) ? delay : 1
//             this.timerType = timerType === 'setInterval' ? 'setInterval' : 'setTimeout'
//             this.delay = Number.isInteger(delay) ? delay : 1
//             this.scheduled = (new Date()) + this.delay
//             this.complete = false
//             this.isRunning = false
//             this.key = "__TimersGlobals__Runner__" + id
//             $g(this.key, new JavaAdapter(Runnable, {run: fn}))
//         }
//
//         TimerTask.prototype.run = function () {
//             if (this.complete) return true
//             var now = new Date()
//             if (now >= this.scheduled) {
//                 this.isRunning = true
//                 try {
//                     logger.info('Task ' + this.id + ' is running!')
//                     // this.fn()
//                     __TimersGlobals__.executor.schedule($g(this.key), 0, TimeUnit.MILLISECONDS)
//                 } catch (e) {
//                     logger.error('UNCAUGHT ERROR in ' + this.timerType + '!\r\n' + e.message + '\r\n' + e.stack)
//                 }
//                 this.isRunning = false
//                 if (this.timerType === 'setTimeout') this.complete = true
//                 else this.scheduled = now + this.delay
//             }
//         }
//         // var setTimeout, clearTimeout, setInterval, clearInterval;
//
//         // I think if we map __TimeoutIntervalGlobals to the global map this will take care of the issue where they are recreated every time
//         // this works so far in testing
//         __TimersGlobals__ = $g("__TimersGlobals__")
//
//         if (__TimersGlobals__ == null || __TimersGlobals__ == 'undefined') {
//             __TimersGlobals__ = {
//                 tasks: {},
//                 counter: 1,
//                 executor: new java.util.concurrent.Executors.newScheduledThreadPool(1),
//                 timerTaskRunnerHandler: 0
//             }
//
//             function timerTaskRunner() {
//                 __TimersGlobals__ = __TimersGlobals__ || $g("__TimersGlobals__")
//                 logger.info(JSON.stringify(__TimersGlobals__, null, 2))
//                 Object.keys(__TimersGlobals__.tasks).forEach(task => {
//                     var _task = __TimersGlobals__.tasks[task]
//                     //logger.info(task)
//                     // delay, timerType, id, scheduled
//                     //var _task = new TimerTask(undefined, task.delay, task.timerType, task.id, task.scheduled)
//                     logger.info('Running Task ' + _task.id)
//                     logger.info('Running Task ' + _task)
//                     if (_task.complete) delete __TimersGlobals__.tasks[task.id]
//                     else if (!_task.isRunning) _task.run()
//                 })
//             }
//
//             var runnable = new JavaAdapter(Runnable, {run: timerTaskRunner})
//             var timerTaskRunnerInterval = 10
//             __TimersGlobals__.timerTaskRunnerHandler = __TimersGlobals__.executor.scheduleAtFixedRate(runnable, timerTaskRunnerInterval, timerTaskRunnerInterval, TimeUnit.MILLISECONDS)
//             $g("__TimersGlobals__", __TimersGlobals__)
//         }
//
//         context.setTimeout = context.setTimeout || function (fn, delay) {
//             var id = __TimersGlobals__.counter++
//             __TimersGlobals__.tasks[id] = new TimerTask(fn, delay, 'setTimeout', id)
//             $g("__TimersGlobals__", __TimersGlobals__)
//             return id
//         }
//
//         context.clearTimeout = context.clearTimeout || function (id) {
//             delete __TimersGlobals__.tasks[String(id)]
//             $g("__TimersGlobals__", __TimersGlobals__)
//         }
//
//         context.setInterval = context.setInterval || function (fn, delay) {
//             var id = __TimersGlobals__.counter++
//             __TimersGlobals__.tasks[id] = new TimerTask(fn, delay, 'setInterval', id)
//             $g("__TimersGlobals__", __TimersGlobals__)
//             return id
//         }
//
//         context.clearInterval = context.clearInterval || context.clearTimeout
//
//         context.__stopTimerTaskRunner = context.__stopTimerTaskRunner || function () {
//             __TimersGlobals__.timerTaskRunnerHandler.cancel(false)
//             __TimersGlobals__.executor.purge()
//             $g("__TimersGlobals__", undefined)
//         }
//     }
// })(this)


(function (context) {
    with (JavaImporter(java.util.concurrent.Executors, java.util.concurrent.TimeUnit, java.lang.Runnable)) {
        // var setTimeout, clearTimeout, setInterval, clearInterval;

        // I think if we map __TimeoutIntervalGlobals to the global map this will take care of the issue where they are recreated every time
        // this works so far in testing
        if (typeof $g !== "undefined") {
            context.__TimeoutIntervalGlobals = $g("__TimeoutIntervalGlobals")
        }
        if (typeof context.__TimeoutIntervalGlobal !== "undefined") {
            context.__TimeoutIntervalGlobals = {
                ids: {},
                counter: 1,
                executor: new java.util.concurrent.Executors.newScheduledThreadPool(1)
            }
            $g("__TimeoutIntervalGlobals", context.__TimeoutIntervalGlobals)
        }

        context.setTimeout = context.setTimeout || function (fn, delay) {
            var id = context.__TimeoutIntervalGlobals.counter++
            if (typeof fn !== 'function') return id
            if (!Number.isInteger(delay)) delay = 1
            var runnable = new JavaAdapter(Runnable, {run: fn})
            context.__TimeoutIntervalGlobals.ids[id] = context.__TimeoutIntervalGlobals.executor.schedule(runnable, delay, TimeUnit.MILLISECONDS)
            $g("__TimeoutIntervalGlobals", context.__TimeoutIntervalGlobals)
            return id
        }

        context.clearTimeout = context.clearTimeout || function (id) {
            if (!Number.isInteger(id) || context.__TimeoutIntervalGlobals.ids[id] === undefined) return
            context.__TimeoutIntervalGlobals.ids[id].cancel(false)
            context.__TimeoutIntervalGlobals.executor.purge()
            delete context.__TimeoutIntervalGlobals.ids[id]
            $g("__TimeoutIntervalGlobals", context.__TimeoutIntervalGlobals)
        }

        context.setInterval = context.setInterval || function (fn, delay) {
            var id = context.__TimeoutIntervalGlobals.counter++
            if (typeof fn !== 'function') return id
            if (!Number.isInteger(delay)) delay = 1
            var runnable = new JavaAdapter(Runnable, {run: fn})
            context.__TimeoutIntervalGlobals.ids[id] = context.__TimeoutIntervalGlobals.executor.scheduleAtFixedRate(runnable, delay, delay, TimeUnit.MILLISECONDS)
            $g("__TimeoutIntervalGlobals", context.__TimeoutIntervalGlobals)
            return id
        }

        context.clearInterval = context.clearInterval || context.clearTimeout
    }
})(this)

