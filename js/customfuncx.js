/**
 * 
 * graph初始化后，开始注册自定义的一些方法，通过这些方法控制graph中的cell原件的展示属性。
 * 
 * 
 */

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
 * graph操作相关的内容都放到graphAction对象
 * 
 */

window.graphAction = {
    //0：当前空闲没有操作
    //1：列车进路
    //2：调车进路
    //3：引导进路
    //4：进路取消
    //5：总人解
    //6: 道岔总定

    status: 0,
    //当前命令stamp
    actionMark: null,
    //当前触发命令按钮路径
    clickPath: [],
    //操作开始时间，超过失效
    startTime: null,
    //计时函数
    startCounting() {
        this.startTime = Date.now()
        let actionMark = Math.random()
        this.actionMark = actionMark
        let temporaryid = setInterval(() => {
            if (this.actionMark != actionMark) {
                clearInterval(temporaryid)
                $('#countingdown').html('空闲')
                return
            }
            console.log(Math.floor(15000 - (Date.now() - this.startTime)))
            $('#countingdown').html('操作剩余时间：' + Math.ceil((15000 - (Date.now() - this.startTime)) / 1000) + 's')
        }, 1000);
        setTimeout(i => {
            if (this.actionMark != actionMark) return
            this.resetStatus()
        }, 15000)
    },
    //重置状态
    resetStatus() {
        this.startTime = null
        this.status = 0
        this.actionMark = Math.random()
        this.clickPath = []
    },
    //发送命令重置状态
    commitAction() {
        console.log('执行命令：', this.status, this.clickPath)


        switch (this.status) {
            case 1:
                this.status = 0x05
                break
            case 2:
                this.status = 0x05
                break
            case 3:
                this.status = 0xCA
                break
            case 4:
                this.status = 0x1A
                break
            case 5:
                this.status = 0xD5
                break
            case 6:
                this.status = 0x25
                this.clickPath.push(0x01)
                break
            case 7:
                this.status = 0x25
                this.clickPath.push(0x02)
                break
            case 8:
                this.status = 0x25
                this.clickPath.push(0x03)
                break
            case 9:
                this.status = 0x25
                this.clickPath.push(0x04)
                break
            case 10:
                this.status = 0x25
                this.clickPath.push(0x05)
                break
            case 11:
                this.status = 0x25
                this.clickPath.push(0x06)
                break
            case 12:
                this.status = 0x45
                break
            case 13:
                this.status = 0x5A
                break
            case 14:
                this.status = 0xAA
                break
            case 15:
                this.status = 0XB5
                this.clickPath.push(0x01)
                break
            case 16:
                this.status = 0XB5
                this.clickPath.push(0x02)
                break
        }

        let copy = JSON.parse(JSON.stringify({
            status: this.status,
            clickPath: this.clickPath
        }))



        this.resetStatus()

        if (copy.clickPath[0] == copy.clickPath[1]) {
            return
        }
        console.log(copy)
        window.cefQuery({
            request: JSON.stringify({
                cmd: "commit_action",
                data: copy
            }),
            persistent: false,
            onSuccess: function (response) {
                // def.resolve(response)
            },
            onFailure: function (error_code, error_message) {
                // def.reject(error_message)
            }
        })


    },
   
    //按钮点击处理
    buttonClick(equip, button, e) {

        //空闲时
        if (this.status == 0) {


            //始端列车按钮（LA）
            if (button && button.type && button.type == 'la') {
                console.log('点击始端列车按钮:', equip.uid)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.status = 1
                this.startCounting()
                return
            }
            //始端调车按钮（DA）
            if (button && button.type && button.type == 'da') {
                console.log('点击始端调车按钮:', equip.uid)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.status = 2
                this.startCounting()
                return
            }
            //信号机引导按钮(YA)
            if (button && button.type && button.type == 'ya') {
                console.log('点击信号机引导按钮:', equip.uid)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.status = 3
                this.startCounting()
                //调出键盘
                ikeyboard.options.position.of = e
                ikeyboard.reveal().insertText('')
                return
            }
            //进路取消
            if (equip == 'allcancel') {
                console.log('点击总取消按钮')
                this.status = 4
                this.startCounting()
                return
            }
            //取消引导进路
            if (equip == 'allrelieve') {
                console.log('点击总人解')
                //调出键盘
                ikeyboard.options.position.of = $('#graphactionbtn button:nth-child(4)')
                ikeyboard.reveal().insertText('')
                this.status = 5
                window.graphActionCallback = i => {
                    this.startCounting()
                    window.graphActionCallback = null
                }
                return
            }
            //道岔总定
            if (equip == 'switchdirect') {
                console.log('点击道岔总定按钮')
                this.status = 6
                this.startCounting()
                return
            }
            //道岔总反
            if (equip == 'switchreverse') {
                console.log('点击道岔总反按钮')
                this.status = 7
                this.startCounting()
                return
            }
            //道岔单锁
            if (equip == 'switchlock') {
                console.log('点击道岔单锁按钮')
                this.status = 8
                this.startCounting()
                return
            }
            //道岔解锁
            if (equip == 'switchunlock') {
                console.log('点击道岔解锁按钮')
                this.status = 9
                this.startCounting()
                return
            }
            //道岔单封
            if (equip == 'switchblock') {
                console.log('点击道岔单封按钮')
                this.status = 10
                this.startCounting()
                return
            }
            //道岔解封
            if (equip == 'switchunblock') {
                console.log('点击道岔解封按钮')
                this.status = 11
                this.startCounting()
                return
            }
            //区段故障解锁
            if (equip == 'sectorfaultunlock') {
                console.log('点击区段故障解锁')
                //调出键盘
                ikeyboard.options.position.of = $('#graphactionbtn button:nth-child(5)')
                ikeyboard.reveal().insertText('')
                this.status = 12
                window.graphActionCallback = i => {
                    //在区故解时显示全部区段
                    Object.keys(this.switchbelongsector).map(k => {
                        let c = window.parkequip[k.toLowerCase()]
                        c.setVisible(1)
                        window.graph.refresh(c)
                        window.graph.view.getState(c, new mxCellState(graph, c, 'cursor=pointer')).setCursor('pointer')
                    })

                    this.startCounting()
                    window.graphActionCallback = null
                }
                return
            }
            //引导总锁
            if (equip == 'alllock') {
                //调出键盘
                ikeyboard.options.position.of = $('#graphactionbtn button:nth-child(2)')
                ikeyboard.reveal().insertText('')
                this.status = 13
                window.graphActionCallback = i => {
                    console.log('点击引导总锁按钮:', 'BTN')
                    this.clickPath.push('BTN')
                    this.commitAction()
                    window.graphActionCallback = null
                }
                return
            }
            //按钮封闭
            if (equip == 'signalblock') {
                console.log('点击按钮封闭')
                this.status = 14
                this.startCounting()
                return
            }
            //按钮解封
            if (equip == 'signalunblock') {
                console.log('点击按钮解封')
                this.status = 15
                this.startCounting()
                return
            }




        }

        /**
         * 
         * 处理函数
         * 
         */

        //处理列车进路
        if (this.status == 1) {
            if (button && button.type && button.type == 'la' && equip.uid != this.clickPath[0]) {
                console.log('点击终端列车按钮:', equip.uid)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
        }

        //处理调车进路
        if (this.status == 2) {
            if (button && button.type && button.type == 'da' && equip.uid != this.clickPath[0]) {
                console.log('点击终端调车按钮:', equip.uid)
                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
        }

        //引导进路
        if (this.status == 3) {
            if (equip == 'confirmya') {
                this.commitAction()
                return
            }
        }

        //进路取消
        if (this.status == 4) {
            if (button && button.type && (button.type == 'da' || button.type == 'la')) {
                console.log('总取消+列车/调车始端按钮:', equip.uid)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
        }
        //进路取消
        if (this.status == 5) {


            //取消引导进路

            if (button && button.type && (button.type == 'la' || button.type == 'ya')) {
                console.log('总人解+引导信号机始端按钮:', equip.uid)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }

            //进路人解

            if (button && button.type && (button.type == 'la' || button.type == 'da')) {
                console.log('总人解+列车/调车始端按钮:', equip.uid)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
        }
        //道岔总定
        if (this.status == 6) {
            if (equip.type == 'ca') {

                console.log('道岔总定:', equip.uid, button)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
        }
        //道岔总反
        if (this.status == 7) {
            if (equip.type == 'ca') {
                console.log('道岔总反:', equip.uid)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
        }
        //道岔单锁
        if (this.status == 8) {
            if (equip.type == 'ca') {
                console.log('道岔单锁:', equip.uid)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
        }
        //道岔解锁
        if (this.status == 9) {
            if (equip.type == 'ca') {
                console.log('道岔解锁:', equip.uid)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
        }
        //道岔单封
        if (this.status == 10) {
            if (equip.type == 'ca') {
                console.log('道岔单封:', equip.uid)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
        }
        //道岔解封
        if (this.status == 11) {
            if (equip.type == 'ca') {
                console.log('道岔解封:', equip.uid)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
        }
        //区段故障解锁
        if (this.status == 12) {
            if (equip.type == 'wc' || equip.type == 'cq') {
                console.log('区段故障解锁:', equip.uid)
                //隐藏cq股道
                //在区故解时显示全部区段
                Object.keys(this.switchbelongsector).map(k => {
                    let c = window.parkequip[k.toLowerCase()]
                    c.setVisible(0)
                    window.graph.refresh(c)
                })

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
        }
        //按钮封闭
        if (this.status == 14) {
            if (button && button.type && (button.type == 'da' || button.type == 'la')) {
                console.log('按钮封闭:', equip.uid)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
        }
        //按钮解封
        if (this.status == 15) {
            if (button && button.type && (button.type == 'da' || button.type == 'la')) {
                console.log('按钮解封:', equip.uid)

                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
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

}, 1000);





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

    if (['DATA_SDI', 'DATA_SDCI'].includes(state['data_type'])) {

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

let defualtxmldoc = 'station.xml'
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

    window.equipcellindex = {}
    let equipindex = ["1 = SZC = LA", "2 = SZC = YA", "3 = SZC = YZSA", "4 = XC = LA", "5 = XC = YA", "6 = XC = YZSA", "7 = SZR = LA", "8 = SZR = YA", "9 = SZR = YZSA", "10 = XR = LA", "11 = XR = YA", "12 = XR = YZSA", "13 = D12 = LA", "14 = D12 = YA", "15 = D12 = YZSA", "16 = D14 = LA", "17 = D14 = YA", "18 = D14 = YZSA", "19 = XRZA = LA", "20 = XRZA = YA", "21 = XRZA = YZSA", "22 = XCZA = LA", "23 = XCZA = YA", "24 = XCZA = YZSA", "25 = S2 = LA", "26 = S4 = LA", "27 = S6 = LA", "28 = S8 = LA", "29 = S10 = LA", "30 = S12 = LA", "31 = S14 = LA", "32 = S3 = LA", "33 = S5 = LA", "34 = S7 = LA", "35 = S9 = LA", "36 = S11 = LA", "37 = S13 = LA", "38 = S15 = LA", "39 = SC = LA", "40 = SR = LA", "41 = S25 = LA", "42 = S24 = LA", "43 = S23 = LA", "44 = S16 = LA", "45 = D12 = DA", "46 = D14 = DA", "47 = S2 = DA", "48 = S4 = DA", "49 = S6 = DA", "50 = S8 = DA", "51 = S10 = DA", "52 = S12 = DA", "53 = S14 = DA", "54 = S3 = DA", "55 = S5 = DA", "56 = S7 = DA", "57 = S9 = DA", "58 = S11 = DA", "59 = S13 = DA", "60 = S15 = DA", "61 = SC = DA", "62 = SR = DA", "63 = S25 = DA", "64 = S24 = DA", "65 = S23 = DA", "66 = S16 = DA", "67 = D5A = DA", "68 = D7A = DA", "69 = D9A = DA", "70 = D11A = DA", "71 = D13A = DA", "72 = D15A = DA", "73 = D6A = DA", "74 = D8A = DA", "75 = D10A = DA", "76 = D12A = DA", "77 = D14A = DA", "78 = D16A = DA", "79 = D5B = DA", "80 = D7B = DA", "81 = D9B = DA", "82 = D11B = DA", "83 = D13B = DA", "84 = D15B = DA", "85 = D6B = DA", "86 = D8B = DA", "87 = D10B = DA", "88 = D12B = DA", "89 = D14B = DA", "90 = D16B = DA", "91 = D2 = DA", "92 = D4 = DA", "93 = D6 = DA", "94 = D8 = DA", "95 = D10 = DA", "96 = D16 = DA", "97 = D18 = DA", "98 = D20 = DA", "99 = D22 = DA", "100 = D24 = DA", "101 = D26 = DA", "102 = D16BZA = DA", "103 = D5BZA = DA", "104 = D6BZA = DA", "105 = D7BZA = DA", "106 = D8BZA = DA", "107 = D9BZA = DA", "108 = D10BZA = DA", "109 = D11BZA = DA", "110 = D12BZA = DA", "111 = D13BZA = DA", "112 = D14BZA = DA", "113 = D15BZA = DA", "114 = JT14 = DA", "115 = JT16 = DA", "116 = JT18 = DA", "117 = JT12 = DA", "118 = JT2 = DA", "119 = JT6 = DA", "120 = JT8 = DA", "121 = JT10 = DA", "122 = JT4 = DA", "123 = 2 = CA", "124 = 2DG = CQ", "125 = 4 = CA", "126 = 4DG = CQ", "127 = 6 = CA", "128 = 6_12DG = CQ", "129 = 8 = CA", "130 = 8_10DG = CQ", "131 = 10 = CA", "132 = 12 = CA", "133 = 14 = CA", "134 = 14_20DG = CQ", "135 = 16 = CA", "136 = 16_18DG = CQ", "137 = 18 = CA", "138 = 20 = CA", "139 = 22 = CA", "140 = 22_26DG = CQ", "141 = 24 = CA", "142 = 26 = CA", "143 = 28 = CA", "144 = 28DG = CQ", "145 = 30 = CA", "146 = 30_32DG = CQ", "147 = 32 = CA", "148 = 34 = CA", "149 = 34DG = CQ", "150 = 36 = CA", "151 = 36DG = CQ", "152 = 38 = CA", "153 = 38DG = CQ", "154 = 40 = CA", "155 = 40_42DG = CQ", "156 = 42 = CA", "157 = 44 = CA", "158 = 44_48DG = CQ", "159 = 46 = CA", "160 = 48 = CA", "161 = 50 = CA", "162 = 50_52DG = CQ", "163 = 52 = CA", "164 = 54 = CA", "165 = 54_60DG = CQ", "166 = 56 = CA", "167 = 58 = CA", "168 = 60 = CA", "169 = 62 = CA", "170 = 62DG = CQ", "171 = 16AG = WC", "172 = 15AG = WC", "173 = 14AG = WC", "174 = 13AG = WC", "175 = 12AG = WC", "176 = 11AG = WC", "177 = 10AG = WC", "178 = 9AG = WC", "179 = 8AG = WC", "180 = 7AG = WC", "181 = 6AG = WC", "182 = 5AG = WC", "183 = 1G = WC", "184 = 16BG = WC", "185 = 15BG = WC", "186 = 14BG = WC", "187 = 13BG = WC", "188 = 12BG = WC", "189 = 11BG = WC", "190 = 10BG = WC", "191 = 9BG = WC", "192 = 8BG = WC", "193 = 7BG = WC", "194 = 6BG = WC", "195 = 5BG = WC", "196 = D4G = WC", "197 = D2G = WC", "198 = D26WG = WC", "199 = D22G = WC", "200 = T2602G = WC", "201 = T2617G = WC", "202 = 2_34WG = WC", "203 = T2604G = WC", "204 = T2615G = WC", "205 = 4G = GD", "206 = 3G = GD", "207 = 2G = GD", "208 = 23G = GD", "209 = 24G = GD", "210 = 25G = GD", "211 = 场引导总锁 = BTN"]

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


        //给灯加一个底圈
        if (cell.getAttribute('name') == 'light') {
            let referenceposition = cell.geometry,
                newboundary = this.graph.insertVertex(cell.parent, null, '', referenceposition.x, referenceposition.y, 19, 19, "shape=ellipse;whiteSpace=wrap;html=1;aspect=fixed;strokeColor=#3694FF;fillColor=none;cursor=pointer;");
            window.graph.orderCells(1, [newboundary])
        }

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
            cell.getSubCell('label')[0].setAttribute('label', uid)




            equipindex.map(s => {


                let index = s.split(' = ')[0]
                let name = s.split(' = ')[1]
                let ty = s.split(' = ')[2]
                if (name == uid) {

                    if (cell.getSubCell('light').length == 0 && cell.getSubCell('button').length == 0) {
                        equipcellindex[cell.id] = index
                    }


                    cell.getSubCell('light').map(light => {

                        if (light.getAttribute('type') && light.getAttribute('type').toUpperCase() == ty) {
                            equipcellindex[light.id] = index
                        }

                    })
                    cell.getSubCell('button').map(button => {
                        if (button.getAttribute('type') && button.getAttribute('type').toUpperCase() == ty) {
                            equipcellindex[button.id] = index
                        }
                    })

                }


            })


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
        //处理所有edge
        if (cell.edge && cell.target) {
            cell.setVisible(0)
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

    //滚动视图定位到某个cell
    window.graph.scrollCellToVisible(parkequip[36], 1)


    //添加拖拽图标

    let dragcallback = function (graph, evt, cell, x, y) {
        if (!this.findtargetcell) return
        console.log(window.getCellUid(this.findtargetcell))
    }

    mxUtils.makeDraggable(document.querySelector('#dragicons img'), window.graph, dragcallback, document.querySelector('#dragicons img').cloneNode(), -15, -15, false, false, true);





}, function () {
    document.body.innerHTML =
        '<center style="margin-top:10%;">Error loading resource files. Please check browser console.</center>';
});


//keyboard插件初始化

$('#graphactionhidden')
    .keyboard({
        layout: 'qwerty',
        position: {
            of: $('#graphactionhidden'),
            my: 'center top',
            at: 'center top'
        }
    })
    .addTyping();
window.ikeyboard = $('#graphactionhidden').getkeyboard()
$('.ui-keyboard-input').bind('visible hidden beforeClose accepted canceled restricted', function (e, keyboard, el, status) {
    switch (e.type) {
        case 'visible':
            $('.covergraph').show()
            break;
        case 'hidden':
            $('.covergraph').hide()
            break;
        case 'accepted':
            //把点击按钮和部件发送给graphAction处理
            if (window.ikeyboard.getValue()) {

                switch (window.graphAction.status) {
                    case 3:
                        window.graphAction.buttonClick('confirmya')
                        break
                    case 5:
                        window.graphActionCallback()
                        break
                    case 12:
                        window.graphActionCallback()
                        break
                    case 13:
                        window.graphActionCallback()
                        break
                }

            } else {
                window.graphAction.resetStatus()
            }
            break;
        case 'canceled':
            window.graphAction.resetStatus()
            break;
        case 'restricted':
            break;
        case 'beforeClose':
            break;
    }
    $('#graphactionhidden').val('')
});
$('#graphactionbtn button').click(function () {
    switch ($(this).index()) {
        case 1:
            //引导总锁
            window.graphAction.buttonClick('alllock')
            break
        case 2:
            //总取消
            window.graphAction.buttonClick('allcancel')
            break
        case 3:
            //取消引导进路
            window.graphAction.buttonClick('allrelieve')
            break
        case 4:
            //区段故障解锁
            window.graphAction.buttonClick('sectorfaultunlock')
            break
        case 5:
            //道岔总定
            window.graphAction.buttonClick('switchdirect')
            break
        case 6:
            //道岔总反
            window.graphAction.buttonClick('switchreverse')
            break
        case 8:
            //道岔单锁
            window.graphAction.buttonClick('switchlock')
            break
        case 9:
            //道岔解锁
            window.graphAction.buttonClick('switchunlock')
            break
        case 10:
            //道岔解锁
            window.graphAction.buttonClick('signalblock')
            break
        case 11:
            //道岔解锁
            window.graphAction.buttonClick('signalunblock')
            break
        case 12:
            //道岔单封
            window.graphAction.buttonClick('switchblock')
            break
        case 13:
            //道岔解封
            window.graphAction.buttonClick('switchunblock')
            break



    }
})



/**
     * enum CODE_TYPE {
  CODE_TYPE_NONE,
  CODE_TYPE_DAOCHA,             // 道岔
  CODE_TYPE_QUDUAN,             // 区段
  CODE_TYPE_JZXH,               // 进站信号
  CODE_TYPE_CZXH,               // 出站信号
  CODE_TYPE_DCXH,               // 调车信号
  CODE_TYPE_BSD,                // 表示灯
  CODE_TYPE_QFJS,               // 铅封计数
  CODE_TYPE_BJ                  // 报警
};

/ 信号状态
struct SignalStatus {
    BYTE red_blue: 1;             // 红/兰
    BYTE white : 1;               // 白灯
    BYTE yellow : 1;              // 黄灯
    BYTE yellow_twice : 1;        // 双黄
    BYTE green_yellow : 1;        // 绿黄
    BYTE green : 1;               // 绿灯
    BYTE red_white : 1;           // 红黄
    BYTE green_twice : 1;         // 双绿

    BYTE train_btn_flash : 1;     // 列车按钮闪亮
    BYTE ligth_broken_wire : 1;   // 灯丝断丝
    BYTE shunt_btn_light : 1;     // 调车按钮闪亮
    BYTE flash : 1;               // 闪光
    BYTE reversed : 1;            // 0
    BYTE reversed2 : 1;           // 0
    BYTE delay_180s : 1;          // 延时3分钟
    BYTE delay_30s : 1;           // 延时30秒
                                  
    BYTE guaid_10s : 1;           // 引导10s
    BYTE ramp_delay_lock : 1;     // 坡道延时解锁
    BYTE closed : 1;              // 封闭
    BYTE notice : 5;              // 提示信息
};

// 道岔状态
struct TurnoutStatus {
    BYTE pos : 1;                 // 定位
    BYTE pos_reverse : 1;         // 反位
    BYTE hold : 1;                // 占用
    BYTE lock : 1;                // 锁闭
    BYTE lock_s : 1;              // 单锁
    BYTE closed : 1;              // 封闭
    BYTE lock_gt : 1;             // 引导总锁闭
    BYTE preline_blue_belt : 1;   // 预排兰光带
    BYTE lock_protect : 1;        // 防护锁闭
    BYTE reversed : 2;            // 保留
    BYTE notice : 5;              // 提示信息
};

// 区段状态
struct SectionStatus {
    BYTE hold : 1;                // 占用
    BYTE lock : 1;                // 锁闭
    BYTE block : 1;               // 封锁
    BYTE notice : 5;              // 提示信息
};

// 表示灯
struct IndicatorLightStatus {
    BYTE light : 1;               // 亮灯
    BYTE flash : 1;               // 闪灯
    BYTE red : 1;                 // 红灯
    BYTE yellow : 1;              // 黄灯
    BYTE green : 1;               // 绿灯
    BYTE blue : 1;                // 蓝灯
    BYTE white : 1;               // 白灯
    BYTE yellow2 : 1;             // 黄灯
};

// 铅封计数
struct SealCount {
    WORD value;
};

// 报警
struct AlarmStatus {
    BYTE value;
};
     * 
     */

/***
     * 
     * 
     * 设置道岔的状态
     * status:{
    pos : 1,              
    pos_reverse : 1,      
    hold : 1,             
    lock : 1,             
    lock_s : 1,           
    closed : 1,           
    lock_gt : 1,          
    preline_blue_belt : 1,
    lock_protect : 1,     
    reversed : 2,         
    notice : 5,           
}
     * 
     */