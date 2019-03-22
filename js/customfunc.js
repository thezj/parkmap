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
            a.map(i => i.setVisible(1) + this.setFillColor(i, '#5578b6', nofresh))
        })
        //重置lable颜色
        namelabel.map(i => this.setLabelText(i, `<div style="background:none;color:#fff;">${uid}</div>`, nofresh))

        //隐藏边框
        if (boundary.length) {
            boundary.map(i => {
                i.setVisible(0)
            })
        }
        let ay = [reverse, direct]
        ay.map(ip => {
            ip.map(i => {
                window.globalintervalcell.delete(i)
                this.showcell(1)
            })
        })

        /**
         * 
         * 开始设置零件样式
         * 
         */



        if (status.preline_blue_belt) {
            let a = [roadentrance, roadreverse, roaddirect]
            a.map(ip => {
                ip.map(i => {
                    this.setFillColor(i, '#00f', nofresh)
                })
            })
        }

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

    showcell(c) {
        if (c && c.setVisible) {
            c.setVisible(1)
            this.graph.refresh(c)
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
            a.map(i => i.setVisible(1) + this.setFillColor(i, '#5578b6', nofresh))
        })
        //重置lable颜色
        namelabel.map(i => this.setLabelText(i, `<div style="background:none;color:#fff;">${uid}</div>`, nofresh))


        /**
         * 
         * 开始设置零件样式
         * 
         * 
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

    setLightStatus(uid, status, nofresh) {

        //不在graph上的dom控制

        if (uid == '场引导总锁BTN') {

            if (status.light) {
                $($('#graphactionbtn button')[0]).css({
                    background: "#ffff57"
                })
            } else {
                $($('#graphactionbtn button')[0]).attr('style', '')
            }

            return
        }

        let cell = this.getEquip(uid)
        if (!cell) return
        cell.equipstatus = status
        //获取零件
        let light = cell.getSubCell('light')

        //初始化零件的闪烁状态为不闪烁
        cell.twinkle = false

        // BYTE light : 1;               // 亮灯
        // BYTE flash : 1;               // 闪灯
        // BYTE red : 1;                 // 红灯
        // BYTE yellow : 1;              // 黄灯
        // BYTE green : 1;               // 绿灯
        // BYTE blue : 1;                // 蓝灯
        // BYTE white : 1;               // 白灯
        // BYTE yellow2 : 1;             // 黄灯
        let lighto
        if (light && light.length > 0) {
            lighto = light[0]
        } else {
            lighto = cell
        }
        window.globalintervalcell.delete(lighto)
        this.showcell(lighto)

        if (status.light) {
            this.setFillColor(lighto, '#0f0', nofresh)
        } else {
            this.setFillColor(lighto, '#000', nofresh)
        }

        if (status.yellow2) {
            this.setFillColor(lighto, '#ff0', nofresh)
        }

        if (status.white) {
            this.setFillColor(lighto, '#fff', nofresh)
        }
        if (status.blue) {
            this.setFillColor(lighto, '#00f', nofresh)
        }

        if (status.green) {
            this.setFillColor(lighto, '#0f0', nofresh)
        }

        if (status.yellow) {
            this.setFillColor(lighto, '#ff0', nofresh)
        }

        if (status.red) {
            this.setFillColor(lighto, '#f00', nofresh)
        }

        if (status.flash) {
            window.globalintervalcell.add(lighto)
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
        light.map(i => {
            i.setVisible(1)
            if (!!i.getAttribute('defaultcolor') && !window['cellseparatecolor' + i.id]) {
                window['cellseparatecolor' + i.id] = i.getAttribute('defaultcolor')
            }
            this.setFillColor(i, window['cellseparatecolor' + i.id], nofresh)
            this.setStrokeColor(i, '#5578b6', nofresh)

        })
        //重置lable颜色
        namelabel.map(i => this.setLabelText(i, `<div style="background:none;color:#fff;">${uid}</div>`, nofresh))
        let buttonla = button.find(i => i.getAttribute('type') == 'la')
        let lightda = light.find(i => i.getAttribute('type') == 'da')
        let light0 = light.find(i => i.getAttribute('type') != 'da')
        window.globalintervalcell.delete(buttonla)
        window.globalintervalcell.delete(lightda)
        window.globalintervalcell.delete(light0)
        window.globalintervalcell.delete(namelabel[0])
        this.showcell(namelabel[0])
        this.showcell(buttonla)
        this.showcell(lightda)
        this.showcell(light0)
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
         * / 信号状态
        struct SignalStatus {
    BYTE red_blue: 1;             // 红/兰
    BYTE white : 1;               // 白灯
    BYTE yellow : 1;              // 黄灯
    BYTE yellow_twice : 1;        // 双黄
    BYTE green_yellow : 1;        // 绿黄
    BYTE green : 1;               // 绿灯
    BYTE red_white : 1;           // 红白
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
         * 
         */

        if (status.red_blue) {

            light.find(i => {
                this.setFillColor(i, window['cellseparatecolor' + i.id], nofresh)
                this.setStrokeColor(i, window['cellseparatecolor' + i.id], nofresh)
            })

        }

        if (status.white) {

            let lightda = light.find(i => i.getAttribute('type') == 'da')
            if (lightda) this.setFillColor(lightda, '#fff', nofresh)
            if (lightda) this.setStrokeColor(lightda, '#fff', nofresh)

        }

        if (status.yellow) {

            let buttonla = button.find(i => i.getAttribute('type') == 'la')
            let light0 = light.find(i => i.getAttribute('type') != 'da')
            let light1 = light.find(i => i.getAttribute('type') == 'da')
            if (buttonla) this.setFillColor(light0, '#ff0', nofresh)
            if (buttonla) this.setStrokeColor(light0, '#ff0', nofresh)
            if (buttonla) this.setFillColor(light1, '#000', nofresh)
            if (buttonla) this.setStrokeColor(light1, 'none', nofresh)

        }

        if (status.yellow_twice) {

        }

        if (status.green_yellow) {

        }

        if (status.green) {

            let light0 = light.find(i => i.getAttribute('type') != 'da')
            this.setFillColor(light0, '#0f0', nofresh)
            this.setStrokeColor(light0, '#0f0', nofresh)


        }

        if (status.red_white) {

            let lightda = light.find(i => i.getAttribute('type') == 'da')
            let light0 = light.find(i => i.getAttribute('type') != 'da')
            if (lightda) this.setFillColor(lightda, '#f00', nofresh)
            if (light0) this.setFillColor(light0, '#ff0', nofresh)
            if (lightda) this.setStrokeColor(lightda, '#f00', nofresh)
            if (light0) this.setStrokeColor(light0, '#ff0', nofresh)
        }

        if (status.green_twice) {

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

            window.globalintervalcell.add(namelabel[0])
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
 * 站场操作相关的内容都放到graphAction对象
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
            // console.log(Math.floor(15000 - (Date.now() - this.startTime)))
            $('#countingdown').html('操作剩余时间：<span style="color:red">' + Math.ceil((15000 - (Date.now() - this.startTime)) / 1000) + 's</span>')
        }, 100);
        setTimeout(i => {
            if (this.actionMark != actionMark) return
            this.resetStatus()
        }, 15000)
    },
    //重置状态
    resetStatus() {
        console.log(1111)
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
                this.status = 0x45
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

                // if ($($('#graphactionbtn button')[0]).attr('style').indexOf('back') > -1) {
                //     this.status = 0x7B
                // } else {
                    this.status = 0x7A
                // }
                break

            case 15:
                this.status = 0XB5
                this.clickPath.push(0x01)
                break
            case 16:
                this.status = 0XB5
                this.clickPath.push(0x02)
                break
            case 17:
                this.status = 0X3A
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


        // if (button && button.type && (button.type == 'la' || button.type == 'da')) {
        //     if (!button.uindex) {
        //         return
        //     }

        //     window.cefQuery({
        //         request: JSON.stringify({
        //             cmd: "commit_action",
        //             data: {
        //                 clickPath: [{
        //                     index: Number(button.uindex),
        //                     name: equip.cell.equipstatus.name
        //                 }],
        //                 status: 0x3A
        //             }
        //         }),
        //         persistent: false,
        //         onSuccess: function (response) {
        //             // def.resolve(response)
        //         },
        //         onFailure: function (error_code, error_message) {
        //             // def.reject(error_message)
        //         }
        //     })

        // }


        //空闲时
        if (this.status == 0) {


            //始端列车按钮（LA）
            if (button && button.type && button.type == 'la') {
                console.log('点击始端列车按钮:')

                if (!button.uindex) {
                    return
                }


                //单击非正常关闭信号机
                // if (equip.cell.equipstatus.notice == 21) {
                //     this.status = 17
                //     this.clickPath.push({
                //         index: Number(button.uindex),
                //         name: equip.cell.equipstatus.name
                //     })
                //     this.commitAction()
                //     return
                // }

                document.querySelector('#signalname').innerHTML = ('始列' + equip.cell.equipstatus.name)


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

                if (!button.uindex) {
                    return
                }
                //单击非正常关闭信号机
                // if (equip.cell.equipstatus.notice == 21) {
                //     this.status = 17
                //     this.clickPath.push({
                //         index: Number(button.uindex),
                //         name: equip.cell.equipstatus.name
                //     })
                //     this.commitAction()
                //     return
                // }

                document.querySelector('#signalname').innerHTML = ('始调' + equip.cell.equipstatus.name)
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

                if (!button.uindex) {
                    return
                }
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
                this.status = 13
                window.graphActionCallback = i => {
                    //在区故解时显示全部区段
                    Object.keys(window.switchbelongsector).map(k => {
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
                this.status = 14
                window.graphActionCallback = i => {
                    console.log('点击引导总锁按钮:', 'BTN')
                    this.clickPath.push(211)
                    this.commitAction()
                    window.graphActionCallback = null
                }
                return
            }
            //按钮封闭
            if (equip == 'signalblock') {
                console.log('点击按钮封闭')
                this.status = 15
                this.startCounting()
                return
            }
            //按钮解封
            if (equip == 'signalunblock') {
                console.log('点击按钮解封')
                this.status = 16
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
                if (!button.uindex) {
                    return
                }
                console.log('点击终端列车按钮:', equip.uid)
                document.querySelector('#signalname').innerHTML += ('——终列' + equip.cell.equipstatus.name)
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
                if (!button.uindex) {
                    return
                }
                console.log('点击终端调车按钮:', equip.uid)
                document.querySelector('#signalname').innerHTML += ('——终调' + equip.cell.equipstatus.name)
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
                if (!button.uindex) {
                    return
                }
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

            if (equip.cell && equip.cell.equipstatus.red_white) {
                //取消引导进路
                this.status = 5
                if (button && button.type && (button.type == 'la' || button.type == 'ya')) {
                    console.log('总人解+引导信号机始端按钮:', equip.uid)
                    if (!button.uindex) {
                        return
                    }
                    this.clickPath.push({
                        index: Number(button.uindex),
                        name: equip.cell.equipstatus.name
                    })
                    this.commitAction()
                    return
                }
            } else if (equip.cell) {

                this.status = 12
                if (button && button.type && (button.type == 'la' || button.type == 'da')) {
                    console.log('总人解+列车/调车始端按钮:', equip.uid)
                    if (!button.uindex) {
                        return
                    }
                    this.clickPath.push({
                        index: Number(button.uindex),
                        name: equip.cell.equipstatus.name
                    })
                    this.commitAction()
                    return
                }
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
        if (this.status == 13) {
            console.log(equip, button)
            if (equip.type == 'wc' || equip.type == 'cq') {
                console.log('区段故障解锁:', equip.uid)
                //隐藏cq股道
                //在区故解时显示全部区段
                Object.keys(window.switchbelongsector).map(k => {
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
        if (this.status == 15) {
            if (button && button.type && (button.type == 'da' || button.type == 'la')) {
                console.log('按钮封闭:', equip.uid)
                if (!button.uindex) {
                    return
                }
                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
        }
        //按钮解封
        if (this.status == 16) {
            if (button && button.type && (button.type == 'da' || button.type == 'la')) {
                console.log('按钮解封:', equip.uid)
                if (!button.uindex) {
                    return
                }
                this.clickPath.push({
                    index: Number(button.uindex),
                    name: equip.cell.equipstatus.name
                })
                this.commitAction()
                return
            }
        }
        //清除
        if (equip == 'clearaction') {
            console.log('点击清除')
            this.resetStatus()
            return
        }



    }
}


//存放道岔和区段的对应关系


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
        setTimeout(x => {
            this.graph.refresh(cell)
        }, 30)
    }

}, 1500);





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
                    cellarray = cellarray.concat(loop(cells[i].children))
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
    /**
     * 
     * // 表示灯
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
  CODE_TYPE_BSD,                // 表示灯
  CODE_TYPE_QFJS,               // 铅封计数
  CODE_TYPE_BJ                  // 报警
     */

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
                case 6:
                    controlgraph.setLightStatus(i.name, i, true)
                    break
            }
        })
        model.endUpdate();
        window.graph.refresh()
        window.globalupdata = false
    }
    //处理故障
    if (['DATA_FIR'].includes(state['data_type'])) {

        document.querySelector('#signalname').innerHTML = ''
        /*
        *  故障信息报告帧
        // */
        // struct FIR_NODE {
        //     BYTE op_code;           // 操作号
        //     BYTE notice_code;       // 提示信息代码
        //     WORD equip_code;        // 设备号
        //     BYTE equip_property;    // 设备性质
        //     BYTE revered;           // 预留
        // };
        // state.data.equip_code


        let equip

        for (let i in parkequip) {
            if (parkequip[i].equipstatus && parkequip[i].equipstatus.index == state.data.equip_code) {
                equip = parkequip[i]
            }
        }

        let equiptype = [{
            type: 0x55,
            name: '列车信号'
        }, {
            type: 0xaa,
            name: '调车信号'
        }, {
            type: 0x1F,
            name: '道岔'
        }, {
            type: 0x1E,
            name: '区段'
        }, {
            type: 0x21,
            name: '非进路调车'
        }, {
            type: 0xA5,
            name: '按钮'
        }]

        let et = equiptype.find(p => {
            return p.type == state.data.equip_property
        })

        let equiptypeinfo = [{
            type: 0,
            name: ''
        }, {
            type: 1,
            name: '进路选不出'
        }, {
            type: 2,
            name: '信号不能保持'
        }, {
            type: 3,
            name: '命令不能执行'
        }, {
            type: 4,
            name: '信号不能开放'
        }, {
            type: 5,
            name: '灯丝断丝'
        }, {
            type: 6,
            name: '2灯丝断丝'
        }, {
            type: 6,
            name: '操作错误'
        }, {
            type: 6,
            name: '操作无效'
        }, {
            type: 6,
            name: '不能自动解锁'
        }, {
            type: 0x0a,
            name: '进路不能闭锁'
        }]

        let eti = equiptypeinfo.find(p => {
            return p.type == state.data.notice_code
        })

        console.log(`${et.name}${equip.equipstatus.name}${eti.name}`)

        document.querySelector('#firnode').innerHTML = `${et.name}${equip.equipstatus.name}${eti.name}`

    }
    //处理状态
    if (['DATA_RSR'].includes(state['data_type'])) {
        /*
        *  运行状态报告帧
        // */
        // struct RSR_NODE {
        //     BYTE server_status //主备机;
        //     BYTE control_status 站控非站控;
        // };

        if (state.data.server_status == 0x55) {

        } else if (state.data.server_status == 0xaa) {

        }

        if (state.data.control_status == 0x55) {

            //自律控制绿色
            //非常站控灭灯
            //获取零件
            let nc = new graphx()
            let cell = parkequip['自律控制']
            let light = cell.getSubCell('light')

            let lighto
            if (light && light.length > 0) {
                lighto = light[0]
            } else {
                lighto = cell
            }
            nc.setFillColor(lighto, '#0f0')

            if (1) {
                let cell = parkequip['非常站控']
                let light = cell.getSubCell('light')

                let lighto
                if (light && light.length > 0) {
                    lighto = light[0]
                } else {
                    lighto = cell
                }
                nc.setFillColor(lighto, '#000')
            }




        } else if (state.data.control_status == 0xaa) {

            //自律控制灭灯
            //非常站控红灯
            let nc = new graphx()
            let cell = parkequip['自律控制']
            let light = cell.getSubCell('light')

            let lighto
            if (light && light.length > 0) {
                lighto = light[0]
            } else {
                lighto = cell
            }
            nc.setFillColor(lighto, '#000')

            if (1) {
                let cell = parkequip['非常站控']
                let light = cell.getSubCell('light')

                let lighto
                if (light && light.length > 0) {
                    lighto = light[0]
                } else {
                    lighto = cell
                }
                nc.setFillColor(lighto, '#f00')
            }


        }

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
 * 配置地图文件
 * 
 */
//道岔对应区段的json文件

let loadmap = mapname => {
    $.ajax({
        url: `/${mapname}/stationswitchbelongsector.json`,
        type: "GET",
        dataType: "json",
        success: function (data) {
            window.switchbelongsector = data
        }
    })
    //战场图的xml
    window.defualtxmldoc = `/${mapname}/station.xml`
    //按钮表
    $.ajax({
        url: `/${mapname}/mapbuttonindex.json`,
        type: "GET",
        dataType: "json",
        success: function (data) {
            window.equipindex = data
        }
    })

}

loadmap('gaodalu')

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

        //给灯加一个底圈
        if (cell.getAttribute('name') == 'light' && /^[^\u4e00-\u9fa5]+$/.test(getCellUid(cell))) {
            let referenceposition = cell.geometry,
                newboundary = this.graph.insertVertex(cell.parent, null, '', referenceposition.x, referenceposition.y, 19, 19, "shape=ellipse;whiteSpace=wrap;html=1;aspect=fixed;strokeColor=#3694FF;fillColor=black;cursor=pointer;");
            window.graph.orderCells(1, [newboundary])

            if (getEquipCell(cell)) {
                getEquipCell(cell).children.map(c => {
                    if (c.geometry.width == 6) {
                        window.graph.orderCells(1, [c])
                    }
                })
            }
        }


        //处理道岔
        if (cell.getAttribute('type') == 'ca') {

            //获取正位反位的旋转值
            let originreverse = cell.getSubCell('reverse')[0]
            let origindirect = cell.getSubCell('direct')[0]
            let originroad
            let originrotateroad
            if (Math.abs(graph.getCellStyle(origindirect).rotation) > Math.abs(graph.getCellStyle(originreverse).rotation)) {
                originroad = originreverse
                originrotateroad = origindirect
            } else {
                originroad = origindirect
                originrotateroad = originreverse
            }
            let angle
            if (graph.getCellStyle(originrotateroad).rotation > 0) {
                angle = graph.getCellStyle(originrotateroad).rotation
            } else {
                angle = 360 + graph.getCellStyle(originrotateroad).rotation
            }

            let upon
            let rightward = true
            if (originrotateroad.geometry.y > originroad.geometry.y) {
                upon = false
            } else {
                upon = true
            }

            if ((angle > 0 && angle < 90) || (angle > 180 && angle < 270)) {
                //  \
                if (upon) {
                    rightward = false
                }
            }
            if ((angle > 90 && angle < 180) || (angle > 270 && angle < 360)) {
                //  /
                if (!upon) {
                    rightward = false
                }
            }

            if (cell.getAttribute('uid') == 16) {
                console.log(upon, rightward, angle)
            }



            //获取direct的坐标作为参考,创建一个圆形边框
            let referenceposition = originroad.geometry
            let boundaryvalue = originroad.value.cloneNode(true)
            boundaryvalue.setAttribute('name', 'boundary')
            let newboundary
            if (!rightward) {
                newboundary = this.graph.insertVertex(cell, null, '', referenceposition.x - 15 + referenceposition.width, referenceposition.y - 9, 23, 23, "shape=ellipse;whiteSpace=wrap;html=1;aspect=fixed;strokeColor=red;fillColor=none;cursor=pointer;");
            } else {
                newboundary = this.graph.insertVertex(cell, null, '', referenceposition.x - 6, referenceposition.y - 9, 23, 23, "shape=ellipse;whiteSpace=wrap;html=1;aspect=fixed;strokeColor=red;fillColor=none;cursor=pointer;");
            }
            newboundary.value = boundaryvalue
            newboundary.specialname = 'lock'


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



            //把cell按钮的cellid 和 按钮表的index 对应起来 放到equipcellindex中
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

        //默认隐藏有叉区段的名称lable
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

                // 如果是道岔区段和道岔
                let belongsectors = false,
                    cqid = 0
                for (let i in window.switchbelongsector) {
                    if (window.switchbelongsector[i].includes(Number(getCellUid(evt.sourceState.cell)))) {
                        belongsectors = true
                        cqid = i
                        break
                    }
                }

                if (belongsectors) {
                    window.graphAction.buttonClick({
                        cell: getEquipCell(evt.sourceState.cell),
                        type: 'cq'
                    }, {
                        name: evt.sourceState.cell.getAttribute('name'),
                        uindex: equipcellindex[evt.sourceState.cell.id] ? equipcellindex[evt.sourceState.cell.id] : equipcellindex[getEquipCell(evt.sourceState.cell).id],
                        type: evt.sourceState.cell.getAttribute('type')
                    }, evt.evt)
                } else if (evt.sourceState.cell.getAttribute('belongsector')) {
                    window.graphAction.buttonClick({
                        cell: getEquipCell(evt.sourceState.cell),
                        type: 'cq'
                    }, {
                        name: evt.sourceState.cell.getAttribute('name'),
                        uindex: equipcellindex[evt.sourceState.cell.id] ? equipcellindex[evt.sourceState.cell.id] : equipcellindex[getEquipCell(evt.sourceState.cell).id],
                        type: evt.sourceState.cell.getAttribute('type')
                    }, evt.evt)
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
            if (window.ikeyboard.getValue() == '123') {

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
                    case 14:
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
//底部功能按钮事件处理
$('#graphactionbtn button.actionlevelone').click(function () {
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
        case 7:
            //清除
            window.graphAction.buttonClick('clearaction')
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

//辅助菜单js
$('.assistmenulevel1').on('click', function () {
    $('#graphactionbtnsub1').show()
})
$('.outassistmenu').on('click', function () {
    $('#graphactionbtnsub1').hide()
})


$('.assistbut0').on('mouseenter', function () {
    $('#graphactionbtnsub2').show()
})
$('.assistbut0').on('mouseleave', function () {
    $('#graphactionbtnsub2').hide()
})


$('.assistbut01').on('mouseenter', function () {
    $('#graphactionbtnsub2').show()
    $('#graphactionbtnsub3').show()
    $('#graphactionbtnsub4').hide()
})

$('.assistbut02').on('mouseenter', function () {
    $('#graphactionbtnsub2').show()
    $('#graphactionbtnsub3').hide()
    $('#graphactionbtnsub4').show()

})

$('#graphactionbtnsub4').on('mouseleave', function () {
    $('#graphactionbtnsub2').hide()
})
$('#graphactionbtnsub3').on('mouseleave', function () {
    $('#graphactionbtnsub2').hide()
})

$('#graphactionbtnsub4').on('click', function () {
    $('#graphactionbtnsub2').hide()

})
$('#graphactionbtnsub3').on('click', function () {
    $('#graphactionbtnsub2').hide()
})