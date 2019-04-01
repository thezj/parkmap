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

    //生成一个新的train
    generatetrain(name) {
        let train = window.graph.importCells([origintrain]),
            namelabel = train[0].getSubCell('serial')[0]
        this.setLabelText(namelabel, `<div style="color:#000;">${name}</div>`)
        train[0].setVisible(1)
        this.graph.refresh(train[0])
        return train[0]
    }




    //计算股道的中心位置
    calculateroadcenter(cell) {

        let offset = {
                x: this.graph.view.getState(cell).origin.x,
                y: this.graph.view.getState(cell).origin.y
            },

            x = offset.x + cell.geometry.width / 2,
            y = offset.y + cell.geometry.height / 2
        return {
            x,
            y
        }

    }



    //移动cell的中心点到cell的中心的
    movecelltocenter(s, t) {

        let target = this.calculateroadcenter(t),
            cells = this.graph.moveCells([s], target.x - (s.geometry.x + s.geometry.width / 2), target.y - (s.geometry.y + s.geometry.height / 2), false)
        return cells[0]
    }



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

    showcell(c) {
        c.setVisible(1)
        this.graph.refresh(c)
    }

    setTurnoutStatus(uid, status, nofresh) {
        let cell = this.getEquip(uid)
        if (!cell) return
        cell.equipstatus = status
        //获取零件
        let roadentrance = cell.getSubCell('road-entrance'),
            roaddirect = cell.getSubCell('road-direct'),
            roadreverse = cell.getSubCell('road-reverse'),
            reverse = cell.getSubCell('reverse'),
            direct = cell.getSubCell('direct'),
            namelabel = cell.getSubCell('label'),
            boundary = cell.getSubCell('boundary')

        /**
         * 
         * 初始化所有零件
         * 
         */
        //初始化零件的闪烁状态为不闪烁
        cell.twinkle = false
        //重置显示颜色
        let allparts = [reverse, direct, roadreverse, roaddirect, roadentrance]
        allparts.map(a => {
            a.map(i => i.setVisible(1) + this.setFillColor(i, '#3694FF', nofresh))
        })
        //重置lable颜色
        namelabel.map(i => this.setLabelText(i, `<div style="background:none;color:#fff;">${uid}</div>`, nofresh))
        //加边框显示
        if (!boundary.length) {
            //获取direct的坐标作为参考,创建一个圆形边框
            let referenceposition = cell.getSubCell('reverse')[0].geometry
            let boundaryvalue = cell.getSubCell('reverse')[0].value.cloneNode(true)
            boundaryvalue.setAttribute('name', 'boundary')
            let newboundary = this.graph.insertVertex(cell, null, '', referenceposition.x - 4, referenceposition.y - 8, 30, 30, "shape=ellipse;whiteSpace=wrap;html=1;aspect=fixed;strokeColor=red;fillColor=none;cursor=pointer;");
            newboundary.value = boundaryvalue
            newboundary.specialname = 'lock'
            boundary.push(newboundary)
        }
        //隐藏边框
        if (boundary.length) {
            boundary.map(i => {
                i.setVisible(0)
            })
        }

        /**
         * 
         * 开始设置零件样式
         * 
         */

        //绿色稳定显示：表示道岔此时处于定位位置；
        if (status.pos) {
            direct.map(i => {
                this.setFillColor(i, '#0f0', nofresh)
            })
            namelabel.map(i => this.setLabelText(i, `<div style="color:#0f0;">${uid}</div>`, nofresh))
        } else {
            direct.map(i => {
                i.setVisible(0)
            })
        }

        //黄色稳定显示：表示道岔此时处于反位位置；
        if (status.pos_reverse) {
            reverse.map(i => {
                this.setFillColor(i, '#ff0', nofresh)
            })
            namelabel.map(i => this.setLabelText(i, `<div style="color:#ff0;">${uid}</div>`, nofresh))
        } else {
            reverse.map(i => {
                i.setVisible(0)
            })
        }

        let ay = [reverse, direct]
        ay.map(ip => {
            ip.map(i => {
                window.globalintervalcell.delete(i)
            })
        })
        //红色闪烁显示：表示道岔已失去表示超过允许失去表示的规定时间（非特殊道岔，一般情况为30秒），此时道岔处于挤岔报警状态，
        if (status.pos == 1 && status.pos_reverse == 1) {
            let a = [reverse, direct]
            a.map(ip => {
                ip.map(i => {
                    this.setFillColor(i, '#f00', nofresh)
                    window.globalintervalcell.add(i)

                })
            })
            namelabel.map(i => this.setLabelText(i, `<div style="color:#f00;">${uid}</div>`, nofresh))
        }


        //黑色稳定显示：表示道岔刚失去表示
        if (status.pos == 0 && status.pos_reverse == 0) {
            let a = [reverse, direct]
            a.map(ip => {
                ip.map(i => {
                    i.setVisible(0)
                })
            })
            namelabel.map(i => this.setLabelText(i, `<div style="color:#f00;">${uid}</div>`, nofresh))
        }

        //白色光带：道岔所在的轨道区段处于空闲锁闭状态
        if (status.hold == 0 && status.lock == 1) {
            let a = [roadentrance]

            if (status.pos == 1 && status.pos_reverse == 0) {
                a.push(roaddirect, direct)
            }

            if (status.pos == 0 && status.pos_reverse == 1) {
                a.push(roadreverse, reverse)
            }

            a.map(ip => {
                ip.map(i => {
                    this.setFillColor(i, '#fff', nofresh)
                })
            })
        }

        //红色光带：道岔所在的轨道区段处于占用或轨道电路故障；
        if (status.hold == 1) {
            let a = [roadentrance]

            if (status.pos == 1 && status.pos_reverse == 0) {
                a.push(roaddirect, direct)
            }

            if (status.pos == 0 && status.pos_reverse == 1) {
                a.push(roadreverse, reverse)
            }

            a.map(ip => {
                ip.map(i => {
                    this.setFillColor(i, '#f00', nofresh)
                })
            })
        }

        if (status.closed) {
            namelabel.map(i => this.setLabelText(i, '<div style="border:1px solid #f00">' + i.getAttribute('label') + '</div>', nofresh))
        }

        if (status.lock_s || status.lock_protect || status.lock_gt) {
            boundary.map(i => {
                i.setVisible(1)
            })
        }


        if (!nofresh) {
            this.graph.refresh(cell)

            if (cell.children && cell.children.length) {
                cell.children.map(c => {
                    if (window.graph.view.getState(c)) window.graph.view.getState(c).setCursor('pointer')
                })
            }
        }

    }


    //设置供电分区
    setSectorStatus(uid, status, nofresh) {
        let cell = this.getEquip(uid)
        if (!cell) return
        cell.equipstatus = status
        //获取零件
        let road = cell.getSubCell('road'),
            namelabel = cell.getSubCell('label')

        /**
         * 
         * 初始化所有零件
         * 
         */
        //初始化零件的闪烁状态为不闪烁
        cell.twinkle = false

        //重置显示颜色
        let allparts = [road]
        allparts.map(a => {
            //空闲蓝色
            a.map(i => i.setVisible(1) + this.setFillColor(i, '#3694FF', nofresh))
        })
        //重置lable颜色
        namelabel.map(i => this.setLabelText(i, `<div style="background:none;color:#fff;">${uid}</div>`, nofresh))


        /**
         * 
         * 开始设置零件样式
         * 
         */


        //白色光带：道岔所在的轨道区段处于空闲锁闭状态
        if (status.hold == 0 && status.lock == 1) {
            road.map(i => {
                this.setFillColor(i, '#fff', nofresh)
            })
        }


        //红色光带：表示区段为占用状态或区段轨道电路故障；
        if (status.hold == 1) {
            road.map(i => {
                this.setFillColor(i, '#f00', nofresh)
            })
        }

        //在原有区段状态上下增加粉红色线框的光带：表示区段被人工设置为轨道分路不良标记。
        if (status.badness == 1) {
            road.map(i => {
                this.setStrokeColor(i, '#ff9393', nofresh)
            })
        }

        if (!nofresh) {
            this.graph.refresh(cell)

            if (cell.children && cell.children.length) {
                cell.children.map(c => {
                    if (window.graph.view.getState(c)) window.graph.view.getState(c).setCursor('pointer')
                })
            }
        }
    }

    setSignalStatus(uid, status, nofresh) {
        let cell = this.getEquip(uid)
        if (!cell) return
        cell.equipstatus = status
        //获取零件
        let light = cell.getSubCell('light'),
            button = cell.getSubCell('button'),
            namelabel = cell.getSubCell('label'),
            boundary = cell.getSubCell('boundary')

        /**
         * 
         * 初始化所有零件
         * 
         */
        //初始化零件的闪烁状态为不闪烁
        cell.twinkle = false
        //重置显示颜色
        light.map(i => i.setVisible(1) + this.setFillColor(i, '#000', nofresh))
        //重置lable颜色
        namelabel.map(i => this.setLabelText(i, `<div style="background:none;color:#fff;">${uid}</div>`, nofresh))

        //加边框显示
        if (!boundary.length) {

            //获取调车灯坐标作为参考,创建一个叉
            let lightda = light.find(i => i.getAttribute('type') == 'da')
            if (lightda) {
                let referenceposition = lightda.geometry
                let boundaryvalue = lightda.value.cloneNode(true)
                boundaryvalue.setAttribute('name', 'boundary')
                let newboundary = this.graph.insertVertex(cell, null, '', referenceposition.x + 3, referenceposition.y + 3, 14, 14, "shape=umlDestroy;whiteSpace=wrap;html=1;aspect=fixed;strokeColor=red;fillColor=none;cursor=pointer;");
                newboundary.value = boundaryvalue
                boundary.push(newboundary)
            }
            //方框
            if (lightda) {
                let referenceposition = lightda.geometry
                let boundaryvalue = lightda.value.cloneNode(true)
                boundaryvalue.setAttribute('name', 'boundary')
                let newboundary = this.graph.insertVertex(cell, null, '', referenceposition.x, referenceposition.y, 19, 19, "whiteSpace=wrap;html=1;aspect=fixed;strokeColor=red;fillColor=none;cursor=pointer;");
                newboundary.value = boundaryvalue
                newboundary.specialname = 'rect'
                boundary.push(newboundary)
            }

            //获取列车信号坐标作为参考,创建一个叉
            lightda = light.find(i => i.getAttribute('type') != 'da')
            if (lightda) {
                let referenceposition = lightda.geometry
                let boundaryvalue = lightda.value.cloneNode(true)
                boundaryvalue.setAttribute('name', 'boundary')
                let newboundary = this.graph.insertVertex(cell, null, '', referenceposition.x + 3, referenceposition.y + 3, 14, 14, "shape=umlDestroy;whiteSpace=wrap;html=1;aspect=fixed;strokeColor=red;fillColor=none;cursor=pointer;");
                newboundary.value = boundaryvalue
                boundary.push(newboundary)
            }
            //方框
            if (lightda) {
                let referenceposition = lightda.geometry
                let boundaryvalue = lightda.value.cloneNode(true)
                boundaryvalue.setAttribute('name', 'boundary')
                let newboundary = this.graph.insertVertex(cell, null, '', referenceposition.x, referenceposition.y, 19, 19, "whiteSpace=wrap;html=1;aspect=fixed;strokeColor=red;fillColor=none;cursor=pointer;");
                newboundary.value = boundaryvalue
                newboundary.specialname = 'rect'
                boundary.push(newboundary)
            }


            //获取列车信号按钮坐标作为参考,创建一个叉
            lightda = button.find(i => i.getAttribute('type') == 'la')
            if (lightda) {
                let referenceposition = lightda.geometry
                let boundaryvalue = lightda.value.cloneNode(true)
                boundaryvalue.setAttribute('name', 'boundary')
                let newboundary = this.graph.insertVertex(cell, null, '', referenceposition.x, referenceposition.y, 14, 14, "shape=umlDestroy;whiteSpace=wrap;html=1;aspect=fixed;strokeColor=red;fillColor=none;cursor=pointer;");
                newboundary.value = boundaryvalue
                boundary.push(newboundary)
            }

            //获取引导按钮坐标作为参考,创建一个叉
            lightda = button.find(i => i.getAttribute('type') == 'ya')
            if (lightda) {
                let referenceposition = lightda.geometry
                let boundaryvalue = lightda.value.cloneNode(true)
                boundaryvalue.setAttribute('name', 'boundary')
                let newboundary = this.graph.insertVertex(cell, null, '', referenceposition.x, referenceposition.y, 14, 14, "shape=umlDestroy;whiteSpace=wrap;html=1;aspect=fixed;strokeColor=red;fillColor=none;cursor=pointer;");
                newboundary.value = boundaryvalue
                boundary.push(newboundary)
            }



        }
        // 隐藏边框
        if (boundary.length) {
            boundary.map(i => {
                i.setVisible(0)
            })
        }

        /**
         * 
         * 开始设置零件样式
         * 
         */

        if (status.red_blue) {


            let lightda = light.find(i => i.getAttribute('type') == 'da')
            let light0 = light.find(i => i.getAttribute('type') != 'da')


            if (lightda) this.setFillColor(lightda, '#f00', nofresh)

            if ((/^D\d*/i).test(status.name)) {
                if (lightda) this.setFillColor(lightda, '#00f', nofresh)
                if (light0) this.setFillColor(light0, '#00f', nofresh)
                if (status.name.toLowerCase() == 'd16') {
                    if (lightda) this.setFillColor(lightda, '#f00', nofresh)
                    if (light0) this.setFillColor(light0, '#f00', nofresh)
                }

            }

        }

        if (status.white) {

            let lightda = light.find(i => i.getAttribute('type') == 'da')
            if (lightda) this.setFillColor(lightda, '#fff', nofresh)

        }

        if (status.yellow) {

            let buttonla = button.find(i => i.getAttribute('type') == 'la')
            let light0 = light.find(i => i.getAttribute('type') != 'da')
            if (buttonla) this.setFillColor(light0, '#ff0', nofresh)

        }

        if (status.yellow_twice) {

        }

        if (status.green_yellow) {

        }

        if (status.green) {

            let buttonla = button.find(i => i.getAttribute('type') == 'la')
            let light0 = light.find(i => i.getAttribute('type') != 'da')
            if (buttonla) this.setFillColor(light0, '#0f0', nofresh)


        }

        if (status.red_white) {

            let lightda = light.find(i => i.getAttribute('type') == 'da')
            let light0 = light.find(i => i.getAttribute('type') != 'da')
            if (lightda) this.setFillColor(lightda, '#f00', nofresh)
            if (light0) this.setFillColor(light0, '#ff0', nofresh)
        }

        if (status.green_twice) {

        }

        if (true) {
            let buttonla = button.find(i => i.getAttribute('type') == 'la')
            let lightda = light.find(i => i.getAttribute('type') == 'da')
            let light0 = light.find(i => i.getAttribute('type') != 'da')
            window.globalintervalcell.delete(buttonla)
            window.globalintervalcell.delete(lightda)
            window.globalintervalcell.delete(light0)
        }

        if (status.train_btn_flash) {
            let buttonla = button.find(i => i.getAttribute('type') == 'la')
            if (buttonla) window.globalintervalcell.add(buttonla)
        }

        if (status.ligth_broken_wire) {

            let lightda = light.find(i => i.getAttribute('type') == 'da')
            if (lightda) window.globalintervalcell.add(lightda)

        }

        if (status.shunt_btn_light) {
            let lightda = light.find(i => i.getAttribute('type') == 'da')
            if (lightda) window.globalintervalcell.add(lightda)
        }

        if (status.flash) {

        }

        if (status.closed) {
            boundary.map(i => {
                if (i.specialname == 'rect') i.setVisible(1)
            })
        }


        if (!nofresh) {
            this.graph.refresh(cell)

            if (cell.children && cell.children.length) {
                cell.children.map(c => {
                    if (window.graph.view.getState(c)) window.graph.view.getState(c).setCursor('pointer')
                })
            }
        }
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

}, 400);/**
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


     

        //隐藏train的图例
        if (cell.getAttribute('type') == 'train') {
            origintrain = cell
            cell.setVisible(0)
        }

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

        if (cell.getAttribute('belongsector') && !cell.children) {
            cell.setAttribute('label', cell.getAttribute('belongsector').toUpperCase())
            window.parkequip[cell.getAttribute('belongsector')] = cell
            //默认隐藏
            cell.setVisible(0)
        }

        //给带有name属性的cell添加手势
        if (cell.getAttribute('name')) {
            setTimeout(i => {
                if (window.graph.view.getState(cell)) window.graph.view.getState(cell).setCursor('pointer')
            }, 0)

        }

    }


    //注册graph的鼠标事件处理
    window.graph.addMouseListener({
        mouseDown: function (sender, evt) {

            //过滤鼠标右键
            if (evt.evt.button == 2) return
            //过滤非点击区域
            if (evt.sourceState) {

                if (getCellUid(evt.sourceState.cell)) {
                    //把点击按钮和部件发送给graphAction处理
                    window.graphAction.buttonClick({
                        cell: getEquipCell(evt.sourceState.cell),
                        type: getEquipCell(evt.sourceState.cell).getAttribute('type')
                    }, {
                        name: evt.sourceState.cell.getAttribute('name'),
                        uindex: equipcellindex[evt.sourceState.cell.id] ? equipcellindex[evt.sourceState.cell.id] : equipcellindex[getEquipCell(evt.sourceState.cell).id],
                        type: evt.sourceState.cell.getAttribute('type')
                    }, evt.evt)
                }

                //如果是道岔区段和道岔
                let belongsectors = false,
                    cqid = 0
                for (let i in window.graphAction.switchbelongsector) {
                    if (window.graphAction.switchbelongsector[i].includes(Number(getCellUid(evt.sourceState.cell)))) {
                        belongsectors = true
                        cqid = i
                        break
                    }
                }

                if (belongsectors) {
                    window.graphAction.buttonClick({
                        uid: cqid,
                        type: 'cq'
                    }, {}, evt.evt)
                } else if (evt.sourceState.cell.getAttribute('belongsector')) {
                    window.graphAction.buttonClick({
                        uid: evt.sourceState.cell.getAttribute('belongsector'),
                        type: 'cq'
                    }, {}, evt.evt)
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

