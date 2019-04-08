/**
 * 
 * graph初始化后，开始注册自定义的一些方法，通过这些方法控制graph中的cell原件的展示属性。
 * 
 * 
 */


class graphx {


    constructor() {
        this.graph = window.graph
    }

    //通过id获取cell
    getEquip(uid) {
        return window.parkequip[uid]
    }

    //生成一个新的div容器
    generatetrain(id, CB) {
        let value = parkequip['TRAIN'].cloneValue()
        value.setAttribute('istrain', 'true')
        let idiv = graph.insertVertex(graph.model.cells[1], null, value, 0, 0, 220, 30, "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#FFFFFF;");
        this.setLabelText(idiv, `<div  style="visibility:hidden" class='trainvessel trainvesseltrain' id="${id}"></div>`)
        parkequip[id] = idiv
        setTimeout(() => {
            CB()
        }, 10);
    }


    //移动cell到某点 
    /**
     * cell的锚点设定为cell中心点
     */
    imovecell(id, position) {
        //vessel

        let target = parkequip[id]

        let goal = parkequip[position],
            GX, GY


        if (switchbelongsector[position]) {

            let longestroad
            switchbelongsector[position].map(cauid => {
                //根据占压和正反位来获取road
                parkequip[cauid].getSubCell('road-reverse').map(road => {
                    if (!longestroad || graph.view.getState(longestroad).cellBounds.width < graph.view.getState(road).cellBounds.width) {
                        longestroad = road
                    }
                })
            })

            //放到岔区的被占压的road中最长的一个上
            GX = graph.view.getState(longestroad).cellBounds.getCenterX()
            GY = graph.view.getState(longestroad).cellBounds.getCenterY()
        } else if (goal.value.getAttribute('type').toLowerCase() == 'wc' || goal.value.getAttribute('type').toLowerCase() == 'gd') {
            let road = goal.getSubCell('road')[0]
            GX = graph.view.getState(road).cellBounds.getCenterX()
            GY = graph.view.getState(road).cellBounds.getCenterY()
        }


        graph.translateCell(target, GX - target.geometry.x - target.geometry.width / 2, GY - target.geometry.y - target.geometry.height - 7)
        if (!window.ishidevessel) {
            window.graph.orderCells(1, [target])
        }
    }


    setTrainStatus(alls, status, cindex) {

        //为每个车创建容器
        let vesselid = status.name

        let CB = () => {
            //生成列车
            let train
            if (status.direction) {
                train = $(`<div class='trainbk' id='train${status.name}'>${status.name}</div>`)
            } else {
                train = $(`<div class='trainbk trainbkleft' id='train${status.name}'>${status.name}</div>`)
            }
            //目标位置是否有车
            let hasTrain = alls.find((x, xi) => {
                //当前train后出现，且位置都相同则判定目标位置已经有车
                if (cindex > xi && x.position.toUpperCase() == status.position.toUpperCase()) {
                    return true
                } else {
                    return false
                }
            })
            console.log('目标位置有车', !!hasTrain)
            if (hasTrain) {
                //添加到目标位置的容器
                let doms = $('#V' + hasTrain.name)
                //目标位置车辆方向和当前车辆是否相同
                if (hasTrain.direction != status.direction && hasTrain.direction == 1) {
                    doms.find('.trainbk').before(train)
                } else {
                    doms.find('.trainbk').after(train)
                }


                parkequip['V' + hasTrain.name].value.setAttribute('label', doms.get(0).outerHTML)
            } else {
                let doms = $('#V' + vesselid).append(train)
                parkequip['V' + vesselid].value.setAttribute('label', doms.get(0).outerHTML)
                //添加列车到容器
                this.imovecell('V' + vesselid, status.position.toUpperCase())
            }
        }


        if (!document.querySelector('#V' + vesselid)) {
            this.generatetrain('V' + vesselid, CB)
        } else {
            CB()
        }

    }


    /**
     * 
     * {"index":170,"name":"lQFCount","type":7,"value":0},{"index":171,"name":"rQFCount","type":7,"value":0},{"index":172,"name":"继电器驱采不一致","type":8,"value":205},{"index":173,"name":"熔丝报警","type":8,"value":205},{"index":174,"name":"电源故障报警","type":8,"value":205},{"index":175,"name":"灯丝报警","type":8,"value":205}
     * 
     */

    setAlarmStatus(i) {
        if ($('.alarmplane div p').length < 22) {} else {
            $('.alarmplane div p:first-child').remove()
        }
        $('.alarmplane div').append(`<p>${moment().format('MM-DD HH:mm:ss')} ${i.name}</p>`)
        document.querySelector('.alarmplane').scrollTop = 10000
    }

    setTurnoutStatus(uid, status) {
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

        //重置显示颜色
        let allparts = [reverse, direct, roadreverse, roaddirect, roadentrance]
        allparts.map(a => {
            a.map(i => window.graph.model.setVisible(i, 1) + this.setFillColor(i, '#5578b6'))
        })
        //重置lable颜色
        namelabel.map(i => this.setLabelText(i, `<div style="background:none;color:#fff;">${uid}</div>`))

        //隐藏边框
        if (boundary.length) {
            boundary.map(i => {
                window.graph.model.setVisible(i, 0)
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
            //取消预排蓝光带，改为显示挤岔0401
            // let a = [roadentrance, roadreverse, roaddirect]
            // a.map(ip => {
            //     ip.map(i => {
            //         this.setFillColor(i, '#00f')
            //     })
            // })
            //挤岔
            let a = [reverse, direct]
            a.map(ip => {
                ip.map(i => {
                    this.setFillColor(i, '#f00')
                    window.globalintervalcell.add(i)

                })
            })
            namelabel.map(i => this.setLabelText(i, `<div style="color:#f00;">${uid}</div>`))
        }

        //绿色稳定显示：表示道岔此时处于定位位置；
        if (status.pos) {
            direct.map(i => {
                this.setFillColor(i, '#0f0')
            })
            namelabel.map(i => this.setLabelText(i, `<div style="color:#0f0;">${uid}</div>`))
        } else {
            direct.map(i => {
                window.graph.model.setVisible(i, 0)
            })
        }

        //黄色稳定显示：表示道岔此时处于反位位置；
        if (status.pos_reverse) {
            reverse.map(i => {
                this.setFillColor(i, '#ff0')
            })
            namelabel.map(i => this.setLabelText(i, `<div style="color:#ff0;">${uid}</div>`))
        } else {
            reverse.map(i => {
                window.graph.model.setVisible(i, 0)
            })
        }


        //红色闪烁显示：表示道岔已失去表示超过允许失去表示的规定时间（非特殊道岔，一般情况为30秒），此时道岔处于挤岔报警状态，
        if (status.pos == 1 && status.pos_reverse == 1) {
            let a = [reverse, direct]
            a.map(ip => {
                ip.map(i => {
                    this.setFillColor(i, '#f00')
                    window.globalintervalcell.add(i)

                })
            })
            namelabel.map(i => this.setLabelText(i, `<div style="color:#f00;">${uid}</div>`))
        }


        //黑色稳定显示：表示道岔刚失去表示
        if (status.pos == 0 && status.pos_reverse == 0) {
            let a = [reverse, direct]
            a.map(ip => {
                ip.map(i => {
                    window.graph.model.setVisible(i, 0)
                })
            })
            namelabel.map(i => this.setLabelText(i, `<div style="color:#f00;">${uid}</div>`))
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
                    this.setFillColor(i, '#fff')
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
                    this.setFillColor(i, '#f00')
                })
            })
        }

        if (status.closed) {
            namelabel.map(i => this.setLabelText(i, '<div style="border:1px solid #f00">' + i.getAttribute('label') + '</div>'))
        }

        if (status.lock_s || status.lock_protect || status.lock_gt) {
            boundary.map(i => {
                window.graph.model.setVisible(i, 1)
            })
        }


        if (status.notice != 0) {

            switch (status.notice) {
                case 1:
                    alarmwarninglistadd(uid + '单锁不能动')
                    break
                case 2:
                    alarmwarninglistadd(uid + '锁闭不能动')
                    break
                case 15:
                    alarmwarninglistadd(uid + '区段道岔有封闭')
                    break
                case 16:
                    alarmwarninglistadd(uid + '注意超限不满足')
                    break
                case 17:
                    alarmwarninglistadd(uid + '校核错')
                    break
                case 18:
                    alarmwarninglistadd(uid + '有车移动')
                    break
                case 19:
                    alarmwarninglistadd(uid + '不能正常解锁')
                    break
                case 20:
                    alarmwarninglistadd(uid + '紧急关闭')
                    break
                case 21:
                    alarmwarninglistadd(uid + '没锁闭')
                    break
                case 22:
                    alarmwarninglistadd(uid + '要求防护道岔不到位')
                    break
                case 23:
                    alarmwarninglistadd(uid + '不在要求位置')
                    break
                case 24:
                    alarmwarninglistadd(uid + '要求防护道岔不能动')
                    break
                case 25:
                    alarmwarninglistadd(uid + '超限不满足')
                    break
                case 26:
                    alarmwarninglistadd(uid + '不能动')
                    break
                case 27:
                    alarmwarninglistadd(uid + '封闭')
                    break
                case 28:
                    alarmwarninglistadd(uid + '锁闭')
                    break
                case 29:
                    alarmwarninglistadd(uid + '在进路中')
                    break
                case 30:
                    alarmwarninglistadd(uid + '有车占用')
                    break
                case 31:
                    alarmwarninglistadd(uid + 'SFJ失效')
                    break
            }
        }



    }

    showcell(c) {
        if (c && c.setVisible) {
            window.graph.model.setVisible(c, 1)
        }
    }

    setSectorStatus(uid, status) {
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


        //重置显示颜色
        let allparts = [road]
        allparts.map(a => {
            //空闲蓝色
            a.map(i => window.graph.model.setVisible(i, 1) + this.setFillColor(i, '#5578b6'))
        })
        //重置lable颜色
        namelabel.map(i => this.setLabelText(i, `<div style="background:none;color:#fff;">${uid}</div>`))


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
                this.setFillColor(i, '#fff')
            })
        }


        //红色光带：表示区段为占用状态或区段轨道电路故障；
        if (status.hold == 1) {
            road.map(i => {
                this.setFillColor(i, '#f00')
            })
        }

        //在原有区段状态上下增加粉红色线框的光带：表示区段被人工设置为轨道分路不良标记。
        if (status.badness == 1) {
            road.map(i => {
                this.setStrokeColor(i, '#ff9393')
            })
        }


        if (status.notice != 0) {

            switch (status.notice) {
                case 22:
                    alarmwarninglistadd(uid + '照查不满足')
                    break
                case 23:
                    alarmwarninglistadd(uid + '机务段不同意')
                    break
                case 24:
                    alarmwarninglistadd(uid + '事故无驱吸起')
                    break
                case 25:
                    alarmwarninglistadd(uid + '照查错误')
                    break
                case 26:
                    alarmwarninglistadd(uid + '开通条件不满足')
                    break
                case 27:
                    alarmwarninglistadd(uid + '在进路中')
                    break
                case 28:
                    alarmwarninglistadd(uid + '不能正常解锁')
                    break
                case 29:
                    alarmwarninglistadd(uid + '占用')
                    break
                case 30:
                    alarmwarninglistadd(uid + '照查敌对')
                    break
                case 31:
                    alarmwarninglistadd(uid + '较核错')
                    break
            }
        }



    }

    setLightStatus(uid, status) {

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
            this.setFillColor(lighto, '#0f0')
        } else {
            this.setFillColor(lighto, '#000')
        }

        if (status.yellow2) {
            this.setFillColor(lighto, '#ff0')
        }

        if (status.white) {
            this.setFillColor(lighto, '#fff')
        }
        if (status.blue) {
            this.setFillColor(lighto, '#00f')
        }

        if (status.green) {
            this.setFillColor(lighto, '#0f0')
        }

        if (status.yellow) {
            this.setFillColor(lighto, '#ff0')
        }

        if (status.red) {
            this.setFillColor(lighto, '#f00')
        }

        if (status.flash) {
            window.globalintervalcell.add(lighto)
        }


    }

    setSignalStatus(uid, status) {
        let cell = this.getEquip(uid)
        if (!cell) return
        cell.equipstatus = status
        //获取零件
        let light = cell.getSubCell('light'),
            button = cell.getSubCell('button'),
            namelabel = cell.getSubCell('label'),
            boundary = cell.getSubCell('boundary')
        boundary = boundary.concat(cell.getSubCell('fork'))

        /**
         * 
         * 初始化所有零件
         * 
         */

        //重置显示颜色
        light.map(i => {
            if (!!i.getAttribute('defaultcolor') && !window['cellseparatecolor' + i.id]) {
                window['cellseparatecolor' + i.id] = i.getAttribute('defaultcolor')
            }
            this.setFillColor(i, window['cellseparatecolor' + i.id])
            this.setStrokeColor(i, '#5578b6')

        })
        //重置lable颜色
        namelabel.map(i => this.setLabelText(i, `<div style="background:none;color:#fff;">${uid}</div>`))
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
                boundaryvalue.setAttribute('name', 'fork')
                let newboundary = this.graph.insertVertex(lightda.parent, null, '', referenceposition.x + 3, referenceposition.y + 3, 14, 14, "shape=umlDestroy;whiteSpace=wrap;strokeWidth=2;html=1;aspect=fixed;strokeColor=red;fillColor=none;cursor=pointer;");
                newboundary.value = boundaryvalue
                boundary.push(newboundary)
            }
            //方框
            if (lightda) {
                let referenceposition = lightda.geometry
                let boundaryvalue = lightda.value.cloneNode(true)
                boundaryvalue.setAttribute('name', 'boundary')
                //是否有两个灯
                let newboundary
                if (light.length == 2) {
                    //是否在左边
                    let lightnone = light.find(i => i.getAttribute('type') != 'da')
                    if (lightda.geometry.x > lightnone.geometry.x) {
                        newboundary = this.graph.insertVertex(lightda.parent, null, '', referenceposition.x - 21, referenceposition.y, 42, 19, "whiteSpace=wrap;html=1;aspect=fixed;strokeWidth=2;strokeColor=red;fillColor=none;cursor=pointer;");

                    } else {
                        newboundary = this.graph.insertVertex(lightda.parent, null, '', referenceposition.x, referenceposition.y, 42, 19, "whiteSpace=wrap;html=1;aspect=fixed;strokeWidth=2;strokeColor=red;fillColor=none;cursor=pointer;");
                    }
                } else {
                    newboundary = this.graph.insertVertex(lightda.parent, null, '', referenceposition.x, referenceposition.y, 19, 19, "whiteSpace=wrap;html=1;aspect=fixed;strokeWidth=2;strokeColor=red;fillColor=none;cursor=pointer;");
                }
                newboundary.value = boundaryvalue
                newboundary.specialname = 'rect'
                boundary.push(newboundary)
            }

            //获取列车信号坐标作为参考,创建一个叉
            lightda = light.find(i => i.getAttribute('type') != 'da')
            if (lightda) {
                let referenceposition = lightda.geometry
                let boundaryvalue = lightda.value.cloneNode(true)
                boundaryvalue.setAttribute('name', 'fork')
                let newboundary = this.graph.insertVertex(lightda.parent, null, '', referenceposition.x + 3, referenceposition.y + 3, 14, 14, "shape=umlDestroy;whiteSpace=wrap;html=1;strokeWidth=2;aspect=fixed;strokeColor=red;fillColor=none;cursor=pointer;");
                newboundary.value = boundaryvalue
                boundary.push(newboundary)
            }



            //获取列车信号按钮坐标作为参考,创建一个叉
            lightda = button.find(i => i.getAttribute('type') == 'la')
            if (lightda) {
                let referenceposition = lightda.geometry
                let boundaryvalue = lightda.value.cloneNode(true)
                boundaryvalue.setAttribute('name', 'fork')
                let newboundary = this.graph.insertVertex(lightda.parent, null, '', referenceposition.x, referenceposition.y, 14, 14, "shape=umlDestroy;whiteSpace=wrap;html=1;aspect=fixed;strokeWidth=2;strokeColor=red;fillColor=none;cursor=pointer;");
                newboundary.value = boundaryvalue
                boundary.push(newboundary)
            }

            //获取引导按钮坐标作为参考,创建一个叉
            lightda = button.find(i => i.getAttribute('type') == 'ya')
            if (lightda) {
                let referenceposition = lightda.geometry
                let boundaryvalue = lightda.value.cloneNode(true)
                boundaryvalue.setAttribute('name', 'fork')
                let newboundary = this.graph.insertVertex(lightda.parent, null, '', referenceposition.x, referenceposition.y, 14, 14, "shape=umlDestroy;whiteSpace=wrap;html=1;aspect=fixed;strokeWidth=2;strokeColor=red;fillColor=none;cursor=pointer;");
                newboundary.value = boundaryvalue
                boundary.push(newboundary)
            }



        }
        // 隐藏边框
        if (boundary.length) {
            boundary.map(i => {
                this.setStrokeColor(i, 'red')
                window.graph.model.setVisible(i, 0)
            })
        }

        /**
         * 
         * 开始设置零件样式
         * 
         * / 信号状态
         * 
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

        if (status.closed) {


            let buttonla = button.find(i => i.getAttribute('type') == 'la')
            if (buttonla) {
                //有列车按钮就全部按钮红叉
                boundary.map(i => {
                    if (i.value.getAttribute('name') == 'fork' && (i.value.getAttribute('type') == 'la' || i.value.getAttribute('type') == 'ya')) {
                        window.graph.model.setVisible(i, 1)
                    }
                })
            } else {
                //没有列车就就把车灯红框
                boundary.map(i => {
                    if (i.value.getAttribute('name') == 'boundary' && (i.value.getAttribute('type') == 'da' || !i.value.getAttribute('type'))) {
                        window.graph.model.setVisible(i, 1)
                    }
                })
            }


        }

        //信号机方框显示 0,1,2,3

        if (status.da_start == 1 && status.da_start == 0) {
            boundary.map(i => {
                if (i.value.getAttribute('name') == 'boundary' && (i.value.getAttribute('type') == 'da' || !i.value.getAttribute('type'))) {
                    window.graph.model.setVisible(i, 1)
                    this.setStrokeColor(i, 'white')
                }
            })
        }
        if (status.da_start == 0 && status.da_start == 1) {
            boundary.map(i => {
                if (i.value.getAttribute('name') == 'boundary' && (i.value.getAttribute('type') == 'da' || !i.value.getAttribute('type'))) {
                    window.graph.model.setVisible(i, 1)
                    this.setStrokeColor(i, '#ffff00')
                }
            })
        }
        if (status.da_start == 1 && status.da_start == 1) {
            boundary.map(i => {
                if (i.value.getAttribute('name') == 'boundary' && (i.value.getAttribute('type') == 'da' || !i.value.getAttribute('type'))) {
                    window.graph.model.setVisible(i, 1)
                    this.setStrokeColor(i, '#00ff00')
                }
            })
        }



        if (status.red_blue) {

            light.find(i => {
                this.setFillColor(i, window['cellseparatecolor' + i.id])
                this.setStrokeColor(i, window['cellseparatecolor' + i.id])
            })

        }

        if (status.white) {

            let lightda = light.find(i => i.getAttribute('type') == 'da')
            if (lightda) this.setFillColor(lightda, '#fff')
            if (lightda) this.setStrokeColor(lightda, '#fff')

        }

        if (status.yellow) {

            let buttonla = button.find(i => i.getAttribute('type') == 'la')
            let light0 = light.find(i => i.getAttribute('type') != 'da')
            let light1 = light.find(i => i.getAttribute('type') == 'da')
            if (buttonla) this.setFillColor(light0, '#ff0')
            if (buttonla) this.setStrokeColor(light0, '#ff0')
            if (buttonla) this.setFillColor(light1, '#000')
            if (buttonla) this.setStrokeColor(light1, 'none')

        }

        if (status.yellow_twice) {

        }

        if (status.green_yellow) {

        }

        if (status.green) {

            let light0 = light.find(i => i.getAttribute('type') != 'da')
            this.setFillColor(light0, '#0f0')
            this.setStrokeColor(light0, '#0f0')


        }

        if (status.red_white) {

            let lightda = light.find(i => i.getAttribute('type') == 'da')
            let light0 = light.find(i => i.getAttribute('type') != 'da')
            if (lightda) this.setFillColor(lightda, '#f00')
            if (light0) this.setFillColor(light0, '#ff0')
            if (lightda) this.setStrokeColor(lightda, '#f00')
            if (light0) this.setStrokeColor(light0, '#ff0')
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


        if (status.notice != 0) {

            switch (status.notice) {
                case 1:
                    alarmwarninglistadd(uid + '调始')
                    break
                case 2:
                    alarmwarninglistadd(uid + '调终')
                    break
                case 3:
                    alarmwarninglistadd(uid + '列始')
                    break
                case 4:
                    alarmwarninglistadd(uid + '列终')
                    break
                case 5:
                    alarmwarninglistadd(uid + '变更')
                    break
                case 6:
                    alarmwarninglistadd(uid + '重开')
                    break
                case 7:
                    alarmwarninglistadd(uid + '引导')
                    break
                case 8:
                    alarmwarninglistadd(uid + '通过')
                    break
                case 9:
                    alarmwarninglistadd(uid + '调车取消')
                    break
                case 10:
                    alarmwarninglistadd(uid + '列车取消')
                    break
                case 11:
                    alarmwarninglistadd(uid + '调车人解')
                    break
                case 12:
                    alarmwarninglistadd(uid + '列车人解')
                    break
                case 17:
                    alarmwarninglistadd(uid + '红灯断丝')
                    break
                case 18:
                    alarmwarninglistadd(uid + '灯丝断丝')
                    break
                case 19:
                    alarmwarninglistadd(uid + '有车移动')
                    break
                case 20:
                    alarmwarninglistadd(uid + '有迎面解锁可能')
                    break
                case 21:
                    alarmwarninglistadd(uid + '非正常关闭')
                    break
                case 22:
                    alarmwarninglistadd(uid + '不能取消')
                    break
                case 23:
                    alarmwarninglistadd(uid + '不能通过')
                    break
                case 24:
                    alarmwarninglistadd(uid + '不能引导')
                    break
                case 25:
                    alarmwarninglistadd(uid + '不是列终')
                    break
                case 26:
                    alarmwarninglistadd(uid + '不是列始')
                    break
                case 27:
                    alarmwarninglistadd(uid + '不是调终')
                    break
                case 28:
                    alarmwarninglistadd(uid + '不是调始')
                    break
                case 29:
                    alarmwarninglistadd(uid + '不构成进路')
                    break
                case 30:
                    alarmwarninglistadd(uid + '不能开放')
                    break
                case 31:
                    alarmwarninglistadd(uid + '无驱开放')
                    break

            }
        }


    }

    //换label的文字html
    setLabelText(cell, code) {
        cell.value.setAttribute('label', code)
    }


    //换cell的背景颜色
    setFillColor(cell, color) {
        let s = cell.style
        s += 'fillColor=' + color + ';'
        graph.model.setStyle(cell, s)
    }

    //换cell的边框颜色
    setStrokeColor(cell, color) {
        let s = cell.style
        s += 'strokeColor=' + color + ';'
        graph.model.setStyle(cell, s)
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
        console.log('前端发出命令', copy)
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
        //通信中断后不可操作
        if (window.sysblackout) {
            return
        }

        //空闲时
        if (this.status == 0) {


            //始端列车按钮（LA）
            if (button && button.type && button.type == 'la') {
                console.log('点击始端列车按钮:')

                if (!button.uindex) {
                    return
                }


                if (equip.cell.equipstatus.signal_square == 2) {
                    window.cefQuery({
                        request: JSON.stringify({
                            cmd: "commit_action",
                            data: {
                                clickPath: [{
                                    index: Number(button.uindex),
                                    name: equip.cell.equipstatus.name
                                }],
                                status: 0x3A
                            }
                        }),
                        persistent: false,
                        onSuccess: function (response) {
                            // def.resolve(response)
                        },
                        onFailure: function (error_code, error_message) {
                            // def.reject(error_message)
                        }
                    })
                    return
                }


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

                if (equip.cell.equipstatus.signal_square == 1) {
                    window.cefQuery({
                        request: JSON.stringify({
                            cmd: "commit_action",
                            data: {
                                clickPath: [{
                                    index: Number(button.uindex),
                                    name: equip.cell.equipstatus.name
                                }],
                                status: 0x3A
                            }
                        }),
                        persistent: false,
                        onSuccess: function (response) {
                            // def.resolve(response)
                        },
                        onFailure: function (error_code, error_message) {
                            // def.reject(error_message)
                        }
                    })
                    return
                }

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
                        if (c) {
                            window.graph.model.setVisible(c, 1)
                            window.graph.view.getState(c, new mxCellState(graph, c, 'cursor=pointer')).setCursor('pointer')
                        }
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
                    let buttonla = equip.cell.getSubCell('button').find(i => i.getAttribute('type') == 'la')
                    this.clickPath.push({
                        index: Number(equipcellindex[buttonla.id]),
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
                console.log('区段故障解锁:', equip, button)
                //隐藏cq股道
                //在区故解时显示全部区段
                Object.keys(window.switchbelongsector).map(k => {
                    let c = window.parkequip[k.toLowerCase()]
                    window.graph.model.setVisible(c, 0)
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



/**
 * 
 * 注册一些全局便利方法
 * 
 */

//闪烁
let globalintervalcellflashkey = 0
window.globalintervalcell = new Set()
window.globalinterval = setInterval(() => {
    if (window.globalupdata || !globalintervalcell.size) {
        return
    }
    graph.getModel().beginUpdate()
    for (let cell of globalintervalcell) {
        //使用mxgraphmodel来对cell进行更新会直接刷新界面，效率更高
        window.graph.model.setVisible(cell, globalintervalcellflashkey)
    }
    graph.getModel().endUpdate()

    globalintervalcellflashkey = !globalintervalcellflashkey
}, 500);

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
        model.beginUpdate()
        state.data.map((i, index) => {
            i.name = i.name.toUpperCase()
            switch (i.type) {
                case 1:
                    controlgraph.setTurnoutStatus(i.name, i)
                    break
                case 2:
                    controlgraph.setSectorStatus(i.name, i)
                    break
                case 3:
                case 4:
                case 5:
                    controlgraph.setSignalStatus(i.name, i)
                    break
                case 6:
                    controlgraph.setLightStatus(i.name, i)
                    break
                case 8:
                    controlgraph.setAlarmStatus(i)
                    break
            }
        })
        model.endUpdate()
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


        alarmwarninglistadd(et.name + equip.equipstatus.name + eti.name)



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

    //通信状态
    if (['DATA_NETINFO'].includes(state['data_type'])) {


        if (state.data.type) {
            if (state.data.status) {
                blackout()
                controlgraph.setAlarmStatus({name:'连锁通信中断'})
            } else {
                blackin()
                controlgraph.setAlarmStatus({name:'连锁通信恢复'})
            }
        } else {
            if (state.data.status) {
                blackout()
                controlgraph.setAlarmStatus({name:'前置机通信中断'})
            } else {
                blackin()
                controlgraph.setAlarmStatus({name:'前置机通信恢复'})
            }
        }

    }

}

//设置现车状态
window.set_globaltrain_state = trainstate => {
    console.log('全部现车状态初始化', trainstate)
    window.deposittrainstate = trainstate
    //移除现有vessel
    $('.trainvesseltrain').html('')
    let controlgraph = new graphx()
    let model = controlgraph.graph.getModel()
    model.beginUpdate();
    trainstate.map((i, index) => {
        controlgraph.setTrainStatus(trainstate, i, index)
    })
    model.endUpdate();
}

//存放全部部件细粒度到包含道岔 区段 和信号机 按钮
window.parkequip = {}

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
    if (location.href.split('?').includes('test')) {
        window.defualtxmldoc = `/${mapname}/station2.xml`
    } else {
        window.defualtxmldoc = `/${mapname}/station.xml`

    }
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
//配置mxConstants
mxConstants.DROP_TARGET_COLOR = '#ff0'
mxConstants.HIGHLIGHT_OPACITY = 70

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






    for (let i in window.graph.getModel().cells) {
        let cell = window.graph.getModel().cells[i]

        //给灯加一个底圈
        if (cell.getAttribute('name') == 'light' && /^[^\u4e00-\u9fa5]+$/.test(getCellUid(cell))) {
            let referenceposition = cell.geometry,
                newboundary = window.graph.insertVertex(cell.parent, null, '', referenceposition.x, referenceposition.y, 19, 19, "shape=ellipse;whiteSpace=wrap;html=1;aspect=fixed;strokeColor=#3694FF;fillColor=black;cursor=pointer;");
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
                newboundary = window.graph.insertVertex(cell, null, '', referenceposition.x - 15 + referenceposition.width, referenceposition.y - 9, 23, 23, "shape=ellipse;whiteSpace=wrap;html=1;aspect=fixed;strokeColor=red;fillColor=none;cursor=pointer;");
            } else {
                newboundary = window.graph.insertVertex(cell, null, '', referenceposition.x - 6, referenceposition.y - 9, 23, 23, "shape=ellipse;whiteSpace=wrap;html=1;aspect=fixed;strokeColor=red;fillColor=none;cursor=pointer;");
            }
            newboundary.value = boundaryvalue
            newboundary.specialname = 'lock'


        }


        //如果发现uid属性则加入全局存放
        if (cell.getAttribute('uid')) {

            //把road放置到最上面，保证添加占线图标后图标在road的label上能显示到最前
            if (cell.getSubCell('road')) {
                graph.orderCells(0, [cell.getSubCell('road')[0]])
            }
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
            window.graph.model.setVisible(cell, 0)
        }

        //给带有name属性的cell添加手势
        if (cell.getAttribute('name')) {
            setTimeout(i => {
                if (window.graph.view.getState(cell)) window.graph.view.getState(cell).setCursor('pointer')
            }, 0)

        }
        //处理所有edge
        if (cell.edge && cell.target) {
            window.graph.model.setVisible(cell, 0)
        }
    }


    //注册graph的鼠标事件处理
    window.graph.addMouseListener({
        mouseDown: function (sender, evt) {

            //过滤鼠标右键
            if (evt.evt.button == 2) {

                if (evt.evt.target && evt.evt.target.className && evt.evt.target.className.indexOf && evt.evt.target.className.indexOf('placedbusyicon') > -1) {
                    //占线板图标右键
                    if (evt.sourceState.cell && getCellUid(evt.sourceState.cell)) {
                        window.busytypedata = getCellUid(evt.sourceState.cell)

                    }
                }
                return
            }
            //过滤非点击区域
            if (evt.sourceState) {

                if (getCellUid(evt.sourceState.cell)) {
                    //把点击按钮和部件发送给graphAction处理
                    let uindex = equipcellindex[evt.sourceState.cell.id] ? equipcellindex[evt.sourceState.cell.id] : equipcellindex[getEquipCell(evt.sourceState.cell).id]
                    if (evt.sourceState.cell.value.getAttribute) {
                        if (evt.sourceState.cell.value.getAttribute('name') == 'fork') {

                            getEquipCell(evt.sourceState.cell).getSubCell('button').map(l => {
                                if (l.value.getAttribute('type').toUpperCase() == evt.sourceState.cell.value.getAttribute('type').toUpperCase()) {
                                    uindex = equipcellindex[l.id]
                                }
                            })

                        }

                        if (evt.sourceState.cell.value.getAttribute('name') == 'boundary') {
                            getEquipCell(evt.sourceState.cell).getSubCell('light').map(l => {
                                if (l.value.getAttribute('type').toUpperCase() == evt.sourceState.cell.value.getAttribute('type').toUpperCase()) {
                                    uindex = equipcellindex[l.id]
                                }
                            })
                        }
                    }

                    window.graphAction.buttonClick({
                        cell: getEquipCell(evt.sourceState.cell),
                        type: getEquipCell(evt.sourceState.cell).getAttribute('type')
                    }, {
                        name: evt.sourceState.cell.getAttribute('name'),
                        uindex,
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

                    let cqindex

                    equipindex.map(s => {
                        let index = s.split(' = ')[0]
                        let name = s.split(' = ')[1]
                        let ty = s.split(' = ')[2]

                        if (name == cqid) {
                            cqindex = index
                        }
                    })
                    window.graphAction.buttonClick({
                        cell: getEquipCell(evt.sourceState.cell),
                        type: 'cq'
                    }, {
                        name: evt.sourceState.cell.getAttribute('name'),
                        uindex: cqindex,
                        type: evt.sourceState.cell.getAttribute('type')
                    }, evt.evt)
                } else if (evt.sourceState.cell.getAttribute('belongsector')) {


                    let cqindex

                    equipindex.map(s => {
                        let index = s.split(' = ')[0]
                        let name = s.split(' = ')[1]
                        let ty = s.split(' = ')[2]

                        if (name.toLowerCase() == evt.sourceState.cell.getAttribute('belongsector').toLowerCase()) {
                            cqindex = index
                        }
                    })

                    window.graphAction.buttonClick({
                        cell: getEquipCell(evt.sourceState.cell),
                        type: 'cq'
                    }, {
                        name: evt.sourceState.cell.getAttribute('name'),
                        uindex: cqindex,
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



    //添加拖拽图标的放下逻辑

    let dragcallback = function (graph, evt, cell, x, y) {
        if (!this.findtargetcell) return
        let equipcell = window.getEquipCell(this.findtargetcell),
            busytype = Number(this.element.dataset.type),
            popid = 'random' + Math.round(Math.random() * 1000)

        //判断是否可以放下
        if (!equipcell || !equipcell.value.getAttribute('type')) {
            return
        }
        let equiptype = equipcell.value.getAttribute('type').toLowerCase()
        if (!['wc', 'gd'].includes(equiptype)) {
            return
        }

        if (!equipcell.busytypes) {
            equipcell.busytypes = {}
        }
        if (!equipcell.busytypes[busytype]) {
            console.log('弹出框占线板', equipcell, busytype)
            //确认放下的回调
            callback = () => {
                pop.close(popid)

                //如果放置位置是wc
                if (equiptype == 'wc') {
                    equipcell.busytypes[busytype] = true

                    //放置图标到roadlabel上
                    let doms = $(equipcell.getSubCell('road')[0].value.getAttribute('label'))
                    if (doms.length == 0) {
                        doms = $(`<div class='trainvessel trainvesselbusy'></div>`)
                    }
                    doms.append($(`<img class='placedbusyicon busytype-${busytype}' style='width:30px; height:30px;' src="${this.element.src}" >`))

                    equipcell.getSubCell('road')[0].value.setAttribute('label', `<div class='trainvessel'>${doms.html()}</div>`)
                    graph.refresh(equipcell)
                }

            }

            //把状态放到equip上

            //弹出确认弹出框
            switch (busytype) {
                case 1:
                    pop.confirm({
                        title: "接触网送电",
                        sizeAdapt: false,
                        content: "请确定是否继续操作",
                        button: [
                            ["success", "确定",
                                callback
                            ],
                            ["default", "取消",
                                function (e) {
                                    pop.close(e)
                                }
                            ]
                        ],
                        buttonSpcl: "",
                        anim: "fadeIn-zoom",
                        width: 350,
                        height: 180,
                        id: popid,
                        place: 5,
                        drag: true,
                        index: true,
                        toClose: false,
                        mask: false,
                        class: false
                    });
                    break
                case 2:
                    pop.confirm({
                        title: "接触网断电",
                        sizeAdapt: false,
                        content: "请确定是否继续操作",
                        button: [
                            ["success", "确定",
                                callback
                            ],
                            ["default", "取消",
                                function (e) {
                                    pop.close(e)
                                }
                            ]
                        ],
                        buttonSpcl: "",
                        anim: "fadeIn-zoom",
                        width: 350,
                        height: 180,
                        id: popid,
                        place: 5,
                        drag: true,
                        index: true,
                        toClose: false,
                        mask: false,
                        class: false
                    });
                    break
            }
        }




    }
    //占线板
    mxUtils.makeDraggable(document.querySelector('#dragicons img:nth-child(1)'), window.graph, dragcallback, document.querySelector('#dragicons img:nth-child(1)').cloneNode(), -15, -15, false, false, true);
    mxUtils.makeDraggable(document.querySelector('#dragicons img:nth-child(2)'), window.graph, dragcallback, document.querySelector('#dragicons img:nth-child(2)').cloneNode(), -15, -15, false, false, true);

    //模拟处理现车
    setTimeout(x => {
        set_globaltrain_state([{
            type: 1, //类型,
            name: 'as1232', //名称
            position: 't2615g', //位置’
            status: 2, //状态
            direction: 1 //方向
        }, {
            type: 1, //类型,
            name: 'as1xxx', //名称
            position: 't2615g', //位置’
            status: 2, //状态
            direction: 0 //方向
        }, {
            type: 1, //类型,
            name: 'asbbb', //名称
            position: 'd2g', //位置’
            status: 2, //状态
            direction: 1 //方向
        }])
    }, 10)

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

$('.supplyelectric').on('click', function () {
    window.open("/indexelectric.html")
})
$('.currenttrain').on('click', function () {
    window.open("/currenttrain.html")
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


//占线板右键移除
$('body').on('click', '.placedbusyicon', function (e) {
    console.log(e)
    if (3 == e.which) {
        alert('这是右键单击事件');
    } else if (1 == e.which) {
        alert('这是左键单击事件');
    }
})

$('.busywire').on('click', function (e) {
    if (e.target.innerText == '占线板') {
        $('#dragicons').show()
        setTimeout(() => {
            $('.placedbusyicon').css({
                'visibility': 'unset'
            })
        }, 10);
        e.target.innerText = '关占线板'

    } else {
        $('#dragicons').hide()
        setTimeout(() => {
            $('.placedbusyicon').css({
                'visibility': 'hidden'
            })
        }, 10);
        e.target.innerText = '占线板'
    }

})

$('.triggertrain').on('click', function (e) {
    if (e.target.innerText == '显示列车') {
        window.ishidevessel = true
        setTimeout(() => {
            $('.trainvesseltrain').css({
                'visibility': 'unset'
            })
        }, 10);
        deposittrainstate.map(train => {
            vessel = parkequip['V' + train.name]
            window.graph.orderCells(0, [vessel])
            graph.refresh(vessel)
        })
        e.target.innerText = '隐藏列车'

    } else {
        window.ishidevessel = false
        setTimeout(() => {
            $('.trainvesseltrain').css({
                'visibility': 'hidden'
            })
        }, 10);
        deposittrainstate.map(train => {
            vessel = parkequip['V' + train.name]
            window.graph.orderCells(1, [vessel])
            graph.refresh(vessel)
        })
        e.target.innerText = '显示列车'
    }

})



//初始化vue

$('.assistbutshunttrain').on('click', function () {
    $('.shunttrain').css({
        'z-index': 999
    })
})
let ishunttrainTdrag = setInterval(() => {
    if ($(".shunttrain").Tdrag) {
        $(".shunttrain").Tdrag();
        clearInterval(ishunttrainTdrag)
    }
}, 100);
window.shunttrainvue = new Vue({
    el: '.shunttrain',
    data: {
        tableDatashunt: [{
            number: '10310',
            begintime: '21:00:00',
            originsector: '22A',
            goalsector: '22B',
            operation: '洗车',
            endtime: '21:00:00',
            instruct: 'D63-D64',
            routes: ['D63-D14-X221', 'D63-D14-X222', 'D63-D14-X22'],
            status: '待执行',
        }],
        tableDatadepart: [{
            number: '10310',
            begintime: '21:00:00',
            originsector: '22A',
            goalsector: '22B',
            instruct: 'D63-D64',
            endtime: '21:00:00',
            routes: ['D63-D14-X122', 'D63-D14-X222', 'D63-D14-X22'],
            type: '发车',
            status: '待执行',
        }]
    },
    methods: {
        arrange(scope) {
            console.log(scope.row)
        },
        cancel(scope) {
            console.log(scope.row)
        },
        shunt(command) {
            console.log(command)
        }
    },
})

//调车弹出层
//pop的倒计时确认
window.popShuntTrain = () => {
    let shunttrainpopcallback = () => {
        //确认调车
        console.log('确认调车', )
        pop.close(popid)
    }
    let shunttrainpopcancel = () => {
        //取消执行
        console.log('取消执行', )
    }
    let popid = 'random' + Math.round(Math.random() * 1000)
    let timecountdown = 10
    let popidinterval = setInterval(() => {
        timecountdown--
        $(`#${popid} .pop-button[type=success]`).html(`确定（${timecountdown}）`)
        if (timecountdown == 0) {
            clearInterval(popidinterval)
            pop.close(popid)
            //执行调车
            shunttrainpopcallback()
        }
    }, 1000);
    pop.alert({
        title: "提醒",
        content: `001车发车计划：SAG至转换轨1的进路不满足执行条件，等待满足立即执行`,
        button: [
            ["success", "确定（10）",
                shunttrainpopcallback
            ],
            ["default", "取消执行",
                function (e) {
                    shunttrainpopcancel()
                    pop.close(e)
                }
            ]
        ],
        buttonSpcl: "",
        sizeAdapt: false,
        anim: "slide-bottom",
        width: 450,
        height: 200,
        id: popid,
        place: 9,
        drag: true,
        index: true,
        mask: false,
        class: false
    });
}

//右键菜单配置

$(document).ready(function () {
    context.init({
        preventDoubleContext: false
    });
    //给不同占线右键添加action
    context.attach('.busytype-2', [{
        text: '移除',
        action: function (e) {
            e.preventDefault()
            if (window.busytypedata) {
                let uid = window.busytypedata
                //去掉cell的label中的图标还有cell的状态
                parkequip[uid].busytypes['2'] = false
                let jdom = $(parkequip[uid].getSubCell('road')[0].value.getAttribute('label'))
                jdom.find('.busytype-2').remove()
                parkequip[uid].getSubCell('road')[0].value.setAttribute('label', `<div class='trainvessel'>${jdom.html()}</div>`)
                graph.refresh(parkequip[uid])
            }

        }
    }]);
    context.attach('.busytype-1', [{
        text: '移除',
        action: function (e) {
            e.preventDefault()
            if (window.busytypedata) {
                let uid = window.busytypedata
                //去掉cell的label中的图标还有cell的状态
                parkequip[uid].busytypes['1'] = false
                let jdom = $(parkequip[uid].getSubCell('road')[0].value.getAttribute('label'))
                jdom.find('.busytype-1').remove()
                parkequip[uid].getSubCell('road')[0].value.setAttribute('label', `<div class='trainvessel'>${jdom.html()}</div>`)
                graph.refresh(parkequip[uid])
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

    $('#firnode').on('mouseover', x => {
        $('#alarmwarninglist').show()
    })
    $('#firnode').on('mouseout', x => {
        $('#alarmwarninglist').hide()
    })
    $('#alarmwarninglist').on('mouseout', x => {
        $('#alarmwarninglist').hide()
    })
    $('#alarmwarninglist').on('mouseover', x => {
        $('#alarmwarninglist').show()
    })
});
//火车不可移动
window.istrainmovable = false

window.alarmwarninglistadd = s => {
    if ($('#alarmwarninglist p').length < 10) {} else {
        $('#alarmwarninglist p:first-child').remove()
    }
    $('#alarmwarninglist').append(`<p>${s}</p>`)
    $('#firnode span').html(s)
    document.querySelector('#alarmwarninglist').scrollTop = 10000
}

window.blackout = () => {
    window.sysblackout = true
    $('head').append($(`<style id='blackoutgrays'>
    .geDiagramContainer {
        filter: grayscale(100%);
        -webkit-filter: grayscale(100%);
        -moz-filter: grayscale(100%);
        -ms-filter: grayscale(100%);
        -o-filter: grayscale(100%);
        filter: progid:DXImageTransform.Microsoft.BasicImage(grayscale=1);
        -webkit-filter: grayscale(1)
    }
    </style>`))


}
window.blackin = () => {
    window.sysblackout = false
    $('#blackoutgrays').remove()
}