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
        this.setLabelText(idiv, `<div  class='trainvessel trainvesseltrain' id="${id}"></div>`)
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

                if (getCellUid(evt.sourceState.cell)) {}

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


    //模拟处理现车
    setTimeout(x => {
        set_globaltrain_state([{
                type: 1, //类型,
                name: 'as1232', //名称
                position: 't2615g', //位置’
                status: 2, //状态
                direction: 1 //方向
            },
            {
                type: 1, //类型,
                name: '1231', //名称
                position: 't2615g', //位置’
                status: 1, //状态
                direction: 0 //方向
            },
            {
                type: 2, //类型,
                name: '1233', //名称
                position: 'd2g', //位置’
                status: 1, //状态
                direction: 1 //方向
            },
        ])
    }, 10)

}, function () {
    document.body.innerHTML =
        '<center style="margin-top:10%;">Error loading resource files. Please check browser console.</center>';
});