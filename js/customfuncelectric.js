/**
 * 
 * graph初始化后，开始注册自定义的一些方法，通过这些方法控制graph中的cell原件的展示属性。
 * 
 * 
 */
window.graphmode = 'electric'
//原始图例
let origintrain = null

class graphx {
    constructor() {
        this.graph = window.graph
    }

    //通过id获取cell
    getEquip(uid) {
        return window.parkequip[uid]
    }


    //供电分区的分区状态设置
    //设置分区线闪烁
    flashwiresector(wirename, flash) {
        let wires = parkequip[wirename.toUpperCase()]
        if (wires.children) {
            wires.children.map(w => {
                window.globalintervalcell.delete(w)
                this.showcell(w)
                if (flash) {
                    window.globalintervalcell.add(w)
                }
            })
        } else {
            window.globalintervalcell.delete(wires)
            this.showcell(wires)
            if (flash) {
                window.globalintervalcell.add(wires)
            }
        }
    }


    //供电分区的开关状态设置
    //设置edge的终点
    triggerSwitch(uid, status) {
        let switchcell = getsubk([parkequip[uid]])
        if (window['switchopenx' + uid] === undefined) {
            window['switchopenx' + uid] = switchcell.geometry.targetPoint.x
            window['switchopeny' + uid] = switchcell.geometry.targetPoint.y
            //判断switch朝向
            let tx = switchcell.geometry.targetPoint.x,
                ty = switchcell.geometry.targetPoint.y,
                sx = switchcell.geometry.sourcePoint.x,
                sy = switchcell.geometry.sourcePoint.y

            if (Math.abs(ty - sy) > Math.abs(tx - sx) && ty < sy) {
                window['switchdirection' + uid] = 'up'
            } else if (Math.abs(ty - sy) > Math.abs(tx - sx) && ty > sy) {
                window['switchdirection' + uid] = 'down'
            } else if (Math.abs(ty - sy) < Math.abs(tx - sx) && tx < sx) {
                window['switchdirection' + uid] = 'left'
            } else if (Math.abs(ty - sy) < Math.abs(tx - sx) && tx > sx) {
                window['switchdirection' + uid] = 'right'
            }
        }


        if (status) {

            switch (window['switchdirection' + uid]) {
                case 'up':
                    switchcell.geometry.targetPoint.x = switchcell.geometry.sourcePoint.x
                    switchcell.geometry.targetPoint.y = window['switchopeny' + uid] - 24
                    break;
                case 'down':
                    switchcell.geometry.targetPoint.x = switchcell.geometry.sourcePoint.x
                    switchcell.geometry.targetPoint.y = window['switchopeny' + uid] + 24
                    break;
                case 'left':
                    switchcell.geometry.targetPoint.y = switchcell.geometry.sourcePoint.y
                    switchcell.geometry.targetPoint.x = window['switchopenx' + uid] - 24
                    break;
                case 'right':
                    switchcell.geometry.targetPoint.y = switchcell.geometry.sourcePoint.y
                    switchcell.geometry.targetPoint.x = window['switchopenx' + uid] + 24
                    break;
            }



        } else {
            switchcell.geometry.targetPoint.x = window['switchopenx' + uid]
            switchcell.geometry.targetPoint.y = window['switchopeny' + uid]
        }

        this.graph.refresh(switchcell)
    }

    //设置零件闪烁fillcolor
    flashcellcolor(cell, c1, c2) {
        let randomkey = 'randomkey' + Math.floor(Math.random() * 10000000)
        window[randomkey] = 0
        let equip = window.getEquipCell(cell)
        equip.twinkle = true
        let func = i => {
            if (equip.twinkle) {
                if (window[randomkey]) {
                    this.setFillColor(cell, c1, nofresh)
                } else {
                    this.setFillColor(cell, c2, nofresh)
                }
                window[randomkey] = !window[randomkey]
                this.graph.refresh(cell)
                setTimeout(func, 1500)
            }
        }
        func()

    }

    //换label的文字html
    //this.setLabelText(namelabel,`<div style="background:red;color:white;">hahahha</div>`)
    setLabelText(cell, code, nofresh) {
        cell.value.setAttribute('label', code)
        if (!nofresh) {
            this.graph.refresh(cell)
        }
    }


    //换cell的背景颜色
    setFillColor(cell, color, nofresh) {
        let s = cell.style.split(';')
        s = s.map(kv => {
            if (kv.indexOf('fillColor') > -1) {
                kv = 'fillColor=' + color
            }
            return kv
        }).join(';')
        if (s.indexOf('fillColor') == -1) {
            s = s + ';fillColor=' + color
        }
        cell.style = s
        if (!nofresh) {
            this.graph.refresh(cell)
        }
    }

    //换cell的边框颜色
    setStrokeColor(cell, color, nofresh) {
        let s = cell.style.split(';')
        s = s.map(kv => {
            if (kv.indexOf('strokeColor') > -1) {
                kv = 'strokeColor=' + color
            }
            return kv
        }).join(';')
        if (s.indexOf('strokeColor') == -1) {
            s = s + ';strokeColor=' + color
        }
        cell.style = s
        if (!nofresh) {
            this.graph.refresh(cell)
        }
    }
}







/**
 * 
 * 设置全局闪烁
 * 
 */
window.globalintervalcell = new Set()
window.globalinterval = setInterval(() => {
    if (window.globalupdata) {
        return
    }

    for (let cell of globalintervalcell) {
        cell.visible = !cell.visible
        this.graph.refresh(cell)
    }

}, 400);
/**
 * 
 * 拓展一个cell的方法，遍历获取cell下级的cell,通过property的中的name获取
 * 
 * 
 */

mxCell.prototype.getSubCell = function (name) {

    if (this.children) {
        let loop = cells => {
            let cellarray = []
            for (let i = 0; i < cells.length; i++) {
                if (cells[i].children) {
                    cellarray.concat(loop(cells[i].children))
                } else if (cells[i].getAttribute('name') == name) {
                    cellarray.push(cells[i])
                }
            }
            return cellarray
        }
        return loop(this.children)
    } else {
        return null
    }
}


/**
 * 
 * 注册一些全局便利方法
 * 
 */

//设置全局状态

window.set_global_state = state => {

    console.log('全部部件状态初始化', state)

    //1 道岔
    //2 区段
    //345 出站信号 进站信号 调车信号

    let controlgraph = new graphx()
    let model = controlgraph.graph.getModel()

    if (state['data_type'] == 'DATA_SDI') {

        window.globalupdata = true
        model.beginUpdate();
        state.data.map((i, index) => {
            i.name = i.name.toUpperCase()
            switch (i.type) {
                case 1:
                    controlgraph.setTurnoutStatus(i.name, i, true)
                    break
                case 2:
                    controlgraph.setSectorStatus(i.name, i, true)
                    break
                case 3:
                case 4:
                case 5:
                    controlgraph.setSignalStatus(i.name, i, true)
                    break
            }
        })
        model.endUpdate();
        window.graph.refresh()
        window.globalupdata = false
    }
}

//获取cell
window.getCellUid = cell => {

    if (cell.getAttribute('uid')) {
        return cell.getAttribute('uid')
    } else {
        if (cell.parent != null) {
            return getCellUid(cell.parent)
        } else {
            return null
        }
    }

}
window.getEquipCell = cell => {

    if (cell.getAttribute('uid')) {
        return cell
    } else {
        if (cell.parent != null) {
            return getEquipCell(cell.parent)
        } else {
            return null
        }
    }

}
window.getNamedCell = cell => {

    if (cell.getAttribute('name')) {
        return cell
    } else {
        if (cell.parent != null) {
            return getNamedCell(cell.parent)
        } else {
            return null
        }
    }

}

window.getsubk = cells => {
    for (let x = 0; x < cells.length; x++) {
        if (cells[x].children != null) {
            return getsubk(cells[x].children)
        } else if (cells[x].value && cells[x].value.attributes['k']) {
            return cells[x]
        }
    }
}


//存放全部部件细粒度到包含道岔 区段 和信号机 按钮
window.parkequip = {}

//配置mxConstants
mxConstants.DROP_TARGET_COLOR = '#ff0'
mxConstants.HIGHLIGHT_OPACITY = 70




/**
 * 
 * 开始初始化EditorUI
 * 
 */

var editorUiInit = EditorUi.prototype.init;

EditorUi.prototype.init = function () {
    editorUiInit.apply(this, arguments);
    this.actions.get('export').setEnabled(false);
};

// Adds required resources (disables loading of fallback properties, this can only
// be used if we know that all keys are defined in the language specific file)
mxResources.loadDefaultBundle = false;
var bundle = mxResources.getDefaultBundle(RESOURCE_BASE, mxLanguage) ||
    mxResources.getSpecialBundle(RESOURCE_BASE, mxLanguage);

let defualtxmldoc = 'supplywire.xml'

// Fixes possible asynchronous requests
mxUtils.getAll([bundle, STYLE_PATH + '/default.xml', defualtxmldoc], function (xhr) {
    // Adds bundle text to resources
    mxResources.parse(xhr[0].getText());

    // Configures the default graph theme
    var themes = new Object();
    themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement();
    new EditorUi(new Editor(urlParams['chrome'] == '0', themes), document.querySelector('.graphbody'));

    /**
     * 
     * 引入xml后初始化配置和显示特性
     * 
     * 
     */


    window.graph.importGraphModel(xhr[2].getDocumentElement())

    window.graph.setCellsSelectable(false)
    // window.graph.setCellsMovable(false)
    window.graph.setCellsEditable(false)


    //根据当前cell的信息觉得是否可以拖动
    let originmovecell = mxGraph.prototype.moveCells
    window.graph.moveCells = function () {
        if (arguments[0][0].getAttribute('movable') == 'true') {
            return originmovecell.apply(this, arguments)
        } else {
            return false
        }
    }

    let originPreviewShape = mxGraphHandler.prototype.updatePreviewShape
    mxGraphHandler.prototype.updatePreviewShape = function () {

        if (this.cell && this.cell.getAttribute('movable') == 'true') {
            return originPreviewShape.apply(this, arguments)
        }
        return false
    }



    for (let i in window.graph.getModel().cells) {
        let cell = window.graph.getModel().cells[i]





        //如果发现uid属性则加入全局存放
        if (cell.getAttribute('uid')) {
            let uid = cell.getAttribute('uid').toUpperCase()
            cell.setAttribute('uid', uid)
            window.parkequip[cell.getAttribute('uid')] = cell
            //给所有部件的label添加文字
            if (cell.getSubCell('label') && cell.getSubCell('label')[0]) {
                cell.getSubCell('label')[0].setAttribute('label', uid)
            }


        }



    }


    //注册graph的鼠标事件处理
    window.graph.addMouseListener({
        mouseDown: function (sender, evt) {
            //过滤鼠标右键
            if (evt.evt.button == 2) {
                //过滤非点击区域
                if (evt.sourceState) {
                    if (getEquipCell(evt.sourceState.cell)) {
                        if (getEquipCell(evt.sourceState.cell).value.getAttribute('uid').toLowerCase().indexOf('supplysector') > -1 || getEquipCell(evt.sourceState.cell).value.getAttribute('type').toLowerCase() == 'trigger') {
                            window.outage = getEquipCell(evt.sourceState.cell).value.getAttribute('uid').toLowerCase().match(/-?\d/)[0]

                            let cbinterval = setInterval(() => {
                                if (window.context2cb) {
                                    context2cb(evt.evt)
                                    clearInterval(cbinterval)
                                }
                            }, 10);

                        }
                    }


                }
            }

            mxLog.debug('mouseDown');
        },
        mouseMove: function (sender, evt) {
            mxLog.debug('mouseMove');
        },
        mouseUp: function (sender, evt) {

            mxLog.debug('mouseUp');
        }
    })


    window.graph.refresh()
    //xml加载完成

    window.document_load_ready()

    //滚动视图到中心
    window.graph.center()
    window.graph.zoomTo(0.5)

    window.graph.dblClick = function () {}


    // mxUtils.makeDraggable(document.querySelector('#dragicons img'), window.graph, dragcallback, document.querySelector('#dragicons img').cloneNode(), -15, -15, false, false, true);



}, function () {
    document.body.innerHTML =
        '<center style="margin-top:10%;">Error loading resource files. Please check browser console.</center>';
});

//右键菜单配置

$(document).ready(function () {
    context.init({
        preventDoubleContext: false
    });
    //给不同占线右键添加action
    context.attach('svg', [{
        text: '断电信息同步至占线板',
        action: function (e) {
            e.preventDefault()
            if (window.outage) {
                console.log(outage)
            }

        }
    }]);
    $(document).on('mouseover', '.me-codesta', function () {
        $('.finale h1:first').css({
            opacity: 0
        });
        $('.finale h1:last').css({
            opacity: 1
        });
    });
    $(document).on('mouseout', '.me-codesta', function () {
        $('.finale h1:last').css({
            opacity: 0
        });
        $('.finale h1:first').css({
            opacity: 1
        });
    });
});