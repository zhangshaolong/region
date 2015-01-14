/**
 * @file 地域选择器；
 * 支持3种展示地域层级的方式：
 *      line（下一级在父级的下方，每个数据占据1行显示）、
 *      float（下一级在父类的右方显示，按照左浮动展示下一级数据）、
 *      block（下一级数据作为隐藏状态，鼠标hover父级时，会以左浮动方式展示）
 * 支持传入扁平数据或者层级数据
 * 支持对数据集的适配
 * 支持配置不同层级的数据的展示方式（line可以无限设置，
 *      float下一级自动设置为block，且block数据不再进行下级数据解析）
 * 支持自动对截断的文本进行title提示
 * 支持block的提示位置自适应
 * @author：张少龙（zhangshaolongjj@163.com）
 */
var Region = function () {
    /**
     * 默认读取的数据集字段
     * @const
     * @type {object}
     */
    var DEFAULT_MAP_KEYS = {
        pid: 'pid',
        id: 'id',
        text: 'text',
        child: 'child'
    };
    /**
     * 类型标记与处理器的对应关系
     * @const
     * @type {object}
     */
    var BULIDER_HANDLER_MAP = {
        'line': lineBuilder,
        'float': floatBuilder,
        'block': blockBuilder
    };
    /**
     * 把数组转换成map存储，方便为地域组件设置value
     * @private
     * @param {Array.<string>} arr 
     * @method
     * @return {object} key=value的map
     */
    var array2Map = function (arr) {
        var map = {};
        for (var i=0,len=arr.length; i<len; i++) {
            map[arr[i]] = arr[i];
        }
        return map;
    };
    /**
     * 创建某种类型的地域节点
     * 有三种类型，下级向下延伸、下级向右延伸、下级隐藏
     * @private
     * @param {dom} container 放置创建地域节点的容器
     * @param {object} model 某个地域的数据
     * @param {string} type 层级数据展示方式：（'line'，'float'，'block'）
     * @param {function} handler 下级数据的类型处理器
     * @param {number} level 当前数据的层级
     * @param {Region} regionInstance 当前Region实例
     * @method
     * @return {dom} 地域名字的dom元素
     */
    var createRegionNodes = function (container, model, type,
            handler, level, regionInstance) {
        var id = model[regionInstance.mapKeys.id];
        var childs = regionInstance
            .indexRelation[id][regionInstance.mapKeys.child];
        container.addClass(type + '-container');
        var lineItem = $('<div class="' + type + '-item">');
        var regionName = $('<div class="region-name">');
        var checkbox = $('<button>')
            .val(id);
        checkbox.addClass('checkbox unchecked');
        var childsContainer = $('<div class="container">');
        regionName.append(checkbox).append(model[regionInstance.mapKeys.text]);
        lineItem.append(regionName).append(childsContainer);
        container.append(lineItem);
        // 为checkbox创建索引
        regionInstance.indexCheckbox[id] = checkbox;
        checkbox.click(function () {
            var state = checkbox.hasClass('checked') ? 'unchecked' : 'checked';
            toggleState(this.value, state, regionInstance);
        });
        if (childs && childs.length) {
            handler(childsContainer, childs, regionInstance, level + 1);
        }
        return regionName;
    };
    /**
     * 处理隐藏类型的鼠标交互事件
     * @private
     * @param {dom} target float类型的地域元素或者包装block地域的容器
     * @param {number} delay 鼠标响应的延迟时间（ms），默认不延迟
     * @param {function} extraOver 鼠标over时需要额外处理的任务
     * @param {function} extraOut 鼠标out时需要额外处理的任务
     * @method
     * @return
     */
    var addMouseEvent = function (target, delay, extraOver, extraOut) {
        target.mouseover(function () {
            target.prop('isHover', true);
            clearTimeout(target.prop('timer'));
            extraOver && extraOver.call(target);
        }).mouseout(function () {
            target.prop('timer',
                setTimeout(function () {
                    target.prop('isHover', false);
                    extraOut && extraOut.call(target);
                }, delay)
            );
        });
    };
    /**
     * 向下延伸构建方法
     * @private
     * @param {dom} container 放置创建地域节点的容器
     * @param {Array.<object>} data 某个节点下一级的ID集
     * @param {Region} regionInstance 当前Region实例
     * @param {number} level 当前数据的层级
     * @method
     * @return
     */
    function lineBuilder(container, ids, regionInstance, level) {
        if (ids && ids.length) {
            var indexData = regionInstance.indexData;
            for (var i=0,len=ids.length; i<len; i++) {
                var regionName = createRegionNodes(container, indexData[ids[i]],
                    'line', builder, level, regionInstance);
                if (level === 0) {
                    regionName.addClass('top-level');
                } else if (i % 2) {
                    regionName.parent().addClass('item-even');
                }
            }
        }
    };
    /**
    * 向右浮动构建方法（float之后只能放置block类型的子集）
     * @private
     * @param {dom} container 放置创建地域节点的容器
     * @param {Array.<object>} data 某个节点下一级的ID集
     * @param {Region} regionInstance 当前Region实例
     * @param {number} level 当前数据的层级
     * @method
     * @return
    */
    function floatBuilder(container, ids, regionInstance, level) {
        container.prev().addClass('float-item');
        if (ids && ids.length) {
            var indexData = regionInstance.indexData;
            for (var i=0,len=ids.length; i<len; i++) {
                createRegionNodes(container, indexData[ids[i]],
                    'float', blockBuilder, level, regionInstance);
            }
            container.append('<div style="clear:both;">');
        }
    };
    /**
     * 隐藏类型构建方法
     * @private
     * @param {dom} container 放置创建地域节点的容器
     * @param {Array.<object>} data 某个节点下一级的ID集
     * @param {Region} regionInstance 当前Region实例
     * @param {number} level 当前数据的层级
     * @method
     * @return
     */
    function blockBuilder(container, ids, regionInstance, level) {
        if (ids && ids.length) {
            var indexData = regionInstance.indexData;
            var prev = container.prev();
            prev.addClass('block-name');
            prev.css('z-index', regionInstance.zIndex--);
            container.css('z-index', regionInstance.zIndex--);
            addMouseEvent(prev, regionInstance.delay, function () {
                this.addClass('region-name-hover');
                this.next().addClass('block-container-hover');
            }, function () {
                if (!this.next().prop('isHover')) {
                    this.removeClass('region-name-hover');
                    this.next().removeClass('block-container-hover');
                }
            });
            addMouseEvent(container, regionInstance.delay, null, function () {
                if(!this.prev().prop('isHover')){
                    this.prev().removeClass('region-name-hover');
                    this.removeClass('block-container-hover');
                }
            });
            for (var i=0,len=ids.length; i<len; i++) {
                createRegionNodes(container, indexData[ids[i]],
                    'block', null, level, regionInstance);
            }
            container.append('<div style="clear:both;">');
        }
    };
    /**
     * 根据不同的展示类型进行指定处理器处理，默认使用向下延伸进行处理
     * @private
     * @param {dom} container 放置创建地域节点的容器
     * @param {Array.<object>} data 某个节点下一级的ID集
     * @param {Region} regionInstance 当前Region实例
     * @param {number} level 当前数据的层级
     * @method
     * @return
     */
    var builder = function (container, ids, regionInstance, level) {
        var childKey = regionInstance.mapKeys.child;
        var indexRelation = regionInstance.indexRelation;
        if (!ids) {
            ids = indexRelation['null'][childKey];
        }
        BULIDER_HANDLER_MAP[regionInstance.layout
            && regionInstance.layout[level] || 'line'](
            container, ids, regionInstance, level);
    };
    /**
     * 设置超长文本的title并设置block类型的定位
     * @private
     * @param {dom} container 放置创建地域节点的容器
     * @method
     * @return
     */
    var repaireEllipsisAndBlockPosition = function (container,
            containerWidth) {
        $('.region-name:visible', container).each(function () {
            if(this.scrollWidth > this.clientWidth){
                this.title = $(this).text();
            }else{
                this.removeAttribute('title');
            }
            var $this = $(this);
            var $next = $this.next();
            if ($this.hasClass('block-name')
                && !$this.hasClass('block-name-hover')) {
                $this.addClass('block-name-hover');
                $next.addClass('block-container-hover');
                repaireEllipsisAndBlockPosition($next, containerWidth);
                if ($next.offset().left + $next.width() > containerWidth) {
                    $next.css('right', '0');
                }
                $this.removeClass('block-name-hover');
                $next.removeClass('block-container-hover');
            }
        });
    };
    
    /**
     * 属性适配器，针对前后端数据字段不一致的时候转换处理
     * @private
     * @param {?obejct} mapKeys 有冲突的属性适配关系对象
     * @param {Region} regionInstance 当前Region实例
     * @method
     * @return
     */
    var setMapKeys = function (mapKeys, regionInstance) {
        var keys = regionInstance.mapKeys = {};
        for (var key in DEFAULT_MAP_KEYS) {
            keys[key] = mapKeys && mapKeys[key]
                || DEFAULT_MAP_KEYS[key];
        }
    };
    /**
     * 设置点击的checkbox下面的子级状态
     * @private
     * @param {dom} checkbox 点击的checkbox
     * @param {string} state 点击某个checkbox后，它的状态
     * @return
     */
    var toggleChilds = function (id, state, regionInstance) {
        var pidKey = regionInstance.mapKeys.pid;
        var childKey = regionInstance.mapKeys.child;
        var indexCheckbox = regionInstance.indexCheckbox;
        var indexRelation = regionInstance.indexRelation;
        var childs = indexRelation[id][childKey];
        indexCheckbox[id].removeClass().addClass('checkbox ' + state);
        if (childs) {
            for (var i=0,len=childs.length; i<len; i++) {
                toggleChilds(childs[i],
                    state, regionInstance);
            }
        }
    };
    /**
     * 设置点击的checkbox所有父级状态
     * @private
     * @param {dom} checkbox 点击的checkbox
     * @param {string} state 点击某个checkbox后，它的状态
     * @return
     */
    var toggleParents = function (id, state, regionInstance) {
        var pidKey = regionInstance.mapKeys.pid;
        var childKey = regionInstance.mapKeys.child;
        var indexCheckbox = regionInstance.indexCheckbox;
        var indexRelation = regionInstance.indexRelation;
        var childs = indexRelation[id][childKey];
        
        var pid = indexRelation[id][pidKey];
        if (pid) {
            var siblings = indexRelation[pid][childKey];
            var isHalf = false;
            for (var i=0,len=siblings.length; i<len; i++) {
                if (!indexCheckbox[siblings[i]].hasClass(state)) {
                    isHalf = true;
                    break;
                }
            }
            var pCheckbox = indexCheckbox[pid];
            if (isHalf) {
                pCheckbox.removeClass().addClass('checkbox halfchecked');
                state = 'halfchecked';
            } else {
                pCheckbox.removeClass().addClass('checkbox ' + state);
            }
            toggleParents(pid, state, regionInstance);
        }
    };
    /**
     * 设置和点击的checkbox相关的其他checkbox的状态
     * @private
     * @param {dom} checkbox 点击的checkbox
     * @return
     */
    var toggleState = function (id, state, regionInstance) {
        toggleChilds(id, state, regionInstance);
        toggleParents(id, state, regionInstance);
    };
    /**
     * 是否扁平数据集
     * @private
     * @param {Array.<obejct>} data 数据集
     * @param {string} pidKey 父id的属性字段
     * @param {string} childKey 下级数据的属性字段
     * @method
     * @return {boolean}
     */
    var isFlatData = function (data, pidKey, childKey) {
        return data[childKey] === undefined || data[pidKey];
    };
    /**
     * 是否层级数据集
     * @private
     * @param {Array.<obejct>} data 数据集
     * @param {string} pidKey 父id的属性字段
     * @param {string} childKey 下级数据的属性字段
     * @method
     * @return {boolean}
     */
    var isLevelData = function (data, pidKey, levelKey) {
        return data[levelKey] !== undefined && data[pidKey] === undefined;
    };
    /**
     * 层级数据集解析
     * @private
     * @param {Array.<obejct>} data 数据集
     * @param {Region} regionInstance 当前Region实例
     * @param {string} pid 父id
     * @param {Array.<string>} child4pid pid的下级ID数据的集合
     * @method
     * @return
     */
    var levelDataProcess = function (data, regionInstance, pid, child4pid) {
        var idKey = regionInstance.mapKeys.id;
        var pidKey = regionInstance.mapKeys.pid;
        var childKey = regionInstance.mapKeys.child;
        var indexData = regionInstance.indexData
            || (regionInstance.indexData = {});
        var indexRelation = regionInstance.indexRelation
            || (regionInstance.indexRelation = {});
        pid = pid === undefined ? null : pid;
        // 添加第一级数据关系，即把pid为null的数据放入到key为'null'的字段上
        if (null === pid) {
            var relationMap = indexRelation['null'] = {};
            child4pid = relationMap[childKey] = [];
        }
        for (var i=0,len=data.length; i<len; i++) {
            var model = data[i];
            var id = model[idKey];
            child4pid && child4pid.push(id);
            var childs = model[childKey];
            var relationMap = indexRelation[id] = {};
            var indexRegionMap = indexData[id] = {};
            for (var key in model) {
                if (childKey !== key && pidKey !== key) {
                    indexRegionMap[key] = model[key];
                }
            }
            relationMap[pidKey] = pid;
            if (childs) {
                var child4id = relationMap[childKey] = [];
                levelDataProcess(childs, regionInstance, id, child4id);
            }
        }
    };
    /**
     * 扁平数据集解析
     * @private
     * @param {Array.<obejct>} data 数据集
     * @param {Region} regionInstance 当前Region实例
     * @method
     * @return
     */
    var flatDataProcess = function (data, regionInstance) {
        var idKey = regionInstance.mapKeys.id;
        var pidKey = regionInstance.mapKeys.pid;
        var childKey = regionInstance.mapKeys.child;
        var indexData = regionInstance.indexData
            || (regionInstance.indexData = {});
        var indexRelation = regionInstance.indexRelation
            || (regionInstance.indexRelation = {});
        for (var i=0,len=data.length; i<len; i++) {
            var model = data[i];
            var id = model[idKey];
            var pid = model[pidKey];
            var relationMap = indexRelation[id] = {};
            var indexRegionMap = indexData[id] = {};
            for (var key in model) {
                if (childKey !== key && pidKey !== key) {
                    indexRegionMap[key] = model[key];
                }
            }
            relationMap[pidKey] = pid;
            var pidMap = indexRelation[pid];
            if (!pidMap) {
                pidMap = indexRelation[pid] = {};
            }
            var pChilds = pidMap[childKey];
            if (!pChilds) {
                pChilds = pidMap[childKey] = [];
            }
            pChilds.push(id);
        }
    };
    /**
     * 地域组件构造器
     * @constructor
     * @param {Object} options 初始化配置参数
     * @param {dom|string|jquery} options.container 地域组件被添加到的节点
     * @param {number} options.delay 鼠标over和out事件的响应延迟时间
     * @param {number} options.zIndex 地域组件的地域层级
     * @param {Array.<string>} options.layout 每一级的展示方式
     * @param {number} options.width 地域组件的宽度
     * @return
     */
    var Region = function (options) {
        this.container = $(options.container);
        this.width = options.width || 800;
        this.delay = options.delay || 0;
        this.zIndex = options.zIndex || 1000;
        this.layout = options.layout;
        // checkbox的索引
        this.indexCheckbox = {};
        // 层级关系的索引
        this.indexRelation = {};
        // 具体数据的索引
        this.indexData = {};
        setMapKeys(options.mapKeys, this);
        this.container.width(this.width);
        this.container.addClass('region-container');
    };
    /**
     * 数据加载并在页面展示，可传入要选中的地域ID数组
     * @public
     * @param {Array.<object>} data 地域的数据集
     *      支持扁平数据和层级数据
     * @param {string|Array.<string>} 设置选中的地域
     */
    Region.prototype.load = function (data, vals) {
        if (!data || !data.length) {
            return ;
        }
        this.analysisData(data);
        this.container.html('');
        var rootLevelData = this.indexRelation['null'];
        builder(this.container, null, this, 0);
        vals && this.setVal(vals);
        repaireEllipsisAndBlockPosition(this.container, this.container.width());
    };
    /**
     * 获取选中的地域ID数组
     * @public
     * @return {Array.<string>} 返回所有选中的地域值
     */
    Region.prototype.getVal = function () {
        var results = [];
        for (var id in this.indexCheckbox) {
            if ($(this.indexCheckbox[id]).hasClass('checked')) {
                results.push(id);
            }
        };
        return results;
    };
    /**
     * 设置地域的值
     * @public
     * @param {string|Array.<string>} 设置选中的地域
     */
    Region.prototype.setVal = function (vals) {
        vals = [].concat(vals);
        var selectedIdMap = array2Map(vals);
        for (var id in this.indexCheckbox) {
            this.indexCheckbox[id].removeClass()
                .addClass('checkbox unchecked');
        }
        for (var id in selectedIdMap) {
            toggleState(id, 'checked', this);
        }
    };
    /**
     * 解析原始数据并进行对应的索引建立
     * @public
     * @param {Array.<object>} data 数据集
     * @param {?string} pid 层级ID，当有pid参数时，data为pid的下级数据
     */
    Region.prototype.analysisData = function (data, pid) {
        var pidKey = this.mapKeys.pid;
        var childKey = this.mapKeys.child;
        if (pid) {
            var child4pid = this.indexRelation[pid][childKey] = [];
        }
        if (isLevelData(data[0], pidKey, childKey)) {
            levelDataProcess(data, this, pid, child4pid);
        } else if(isFlatData(data[0], pidKey, childKey)){
            flatDataProcess(data, this);
        }
    };
    /**
     * 销毁Region对象
     * @public
     */
    Region.prototype.dispose = function () {
        this.container.html('');
    };
    return Region;
}();