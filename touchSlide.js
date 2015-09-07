// todo:
// 1. 套壳，即添加commonJS/AMD模式：
// (function (name, definition) {
//    if (typeof define === 'function') {
//       define(definition);
//  } else {
//      this[name] = definition();
//    }
//})(fn)
// 2. 无限滑动
// 3. pc端滑屏
// 4. JM lib

(function () {
    // 1. 定义构造函数
    var touchSlide = function (element, options) {
        // 用于缓存每个单屏的data-class元素
        this.cache = {};
        // 存储按下的位置
        this.start = {};
        // 存储上一个单屏的索引
        this.prevIndex = 0;
        // 存储要去的目标位置的索引
        this.targetIndex = 0;
        this.options = this.extend(touchSlide.defaults, options || {});
        // 其实这样:document.querySelectorAll(".item")获取子元素是不好的,放在默认值里面就对了
        this.element = document.querySelector(element);
        this.item = this.element.children;// 也支持 this.element.querySelectorAll("");
        // 初始化
        this.init();
    }
    touchSlide.defaults = {
        threshold: 50,
        duration: 500,
        orientation: "vertical"
    };
    touchSlide.prototype = {
        Constructor: touchSlide,
        init: function () {
            //debugger;
            var that = this;
            //获取整屏的宽高
            var width = this.width = this.element.clientWidth;
            var height = this.height = this.element.clientHeight;
            var scrollHeight = this.element.scrollHeight;

            this.setWH(this.element, width, scrollHeight);
            this.fixture = this.options.orientation === "vertical" ? height : width;

            that.forEach(this.item, function (item, key) {
                // item 就是每个单屏引用 item === that.item[key]
                that.setWH(item, width, height);
                // 便于以后通过索引获取每个单屏里面的data-class
                that.cache[key] = item.querySelectorAll("[data-class]")
            });
            // 绑定事件
            this.bind();
        },
        bind: function () {
            // 1. 绑定按下事件
            // 按下的时候，记录按下的位置值
            // 同时，让总wrap的transition为none
            var that = this;
            var element = this.element;
            element.addEventListener("touchstart", function (event) {
                // event.changedTouches是一个类数组，存储着屏幕上 变化的手指的信息，第一个数组是第一个手指，第二个元素，是第二个手指
                var changedTouches = that.getTouchEvent(event);// 可以使用targetTouches ? 不可以吧
                that.start = {
                    x: changedTouches.pageX,
                    y: changedTouches.pageY
                };

                this.style.transition = "none";
            }, false);
            // 2. 绑定移动事件
            // 移动的时候：
            // 1.将移动的偏移量丢给总wrap，不要缓动
            // 2. targetIndex 就是当前屏的索引，滚动上去的高度就是 当前索引 * 一屏的高度
            element.addEventListener("touchmove", function (event) {
                var changedTouches = that.getTouchEvent(event);
                var distance = that.options.orientation === "vertical" ? changedTouches.pageY - that.start.y : changedTouches.pageX - that.start.x;

                this.style["webkitTransform"] = "translate3d(0," + (distance + (-that.fixture * that.targetIndex)) + "px,0)";
                event.preventDefault = false;
                //console.log(this.style);
            });
            // 3. 绑定松开事件
            // 手指松开的时候，如果最后的位置和开始的位置偏差大于指定的值，那么就跳一屏，这里要计算出向上还是向下
            element.addEventListener("touchend", function (event) {
                var changedTouches = that.getTouchEvent(event);
                var distance = that.options.orientation === "vertical" ? changedTouches.pageY - that.start.y : changedTouches.pageX - that.start.x;
                // 1 . 给wrap添加transition过渡
                this.style["webkitTransition"] = that.options.duration + "ms";

                // 2. 判断方向,获取要去的目标位置的索引
                // 首先存储位置
                that.prevIndex = that.targetIndex;
                // 向下滑：
                if (distance > that.options.threshold) {
                    that.targetIndex--;
                    if (that.targetIndex < 0) {
                        that.targetIndex = 0;
                    }
                }
                // 向上滑
                else if (distance < -that.options.threshold) {
                    that.targetIndex++;
                    if (that.targetIndex > that.item.length - 1) {
                        that.targetIndex = that.item.length - 1;
                    }
                }
                this.style["webkitTransform"] = "translate3d(0 , " + (-that.fixture * that.targetIndex) + "px , 0)";
            });
            // 4. 绑定transitionEnd事件
            // 当单屏运动结束后，让里面每个需要运动的元素依次显示
            element.addEventListener("webkitTransitionEnd", function (event) {
                // 移除上一屏中的，data-class里面的值
                that.forEach(that.cache[that.prevIndex], function (item, key) {
                    item.className = item.className.replace(item.dataset["class"], "");
                    item.style["webkitAnimationDelay"] = 0;
                });
                that.forEach(that.cache[that.targetIndex], function (item, key) {
                    item.className += " " + item.dataset["class"] + " ";
                    item.style["webkitAnimationDelay"] = (+item.dataset["delay"] || 0) / 1000 + "s";
                });
            }, false);
        },
        setWH: function (element, width, height) {
            element.style.width = width + "px";
            element.style.height = height + "px";
        },
        getTouchEvent: function (event) {
            return event.changedTouches[0];
        },
        forEach: function (that, fn) {
            return [].forEach.call(that, fn);
        },
        /**
         * 将多个对象合并为一个对象，并返回合并后的对象
         *  target1 , target2 .....
         * @returns {Object}
         */
        extend: function () {
            var target = {};
            for (var i = 0, len = arguments.length; i < len; i += 1) {
                var source = arguments[i];
                for (var j in source) {
                    target[j] = source[j];
                }
            }
            return target;
        }
    }
    return window.touchSlide = touchSlide;
}());


