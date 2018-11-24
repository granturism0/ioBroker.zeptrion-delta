'use strict';

const request = require('request')
const parseString = require('xml2js').parseString;

module.exports = class Blind_Handler{
    constructor() {}

    static get_desc(){return 'Zeptrion Blind'}
    static get_role(){return 'blind'}

    static create_state(channel_obj, channel_id, adapter){
        let trans = {
            obj: channel_obj,
            channel_id: channel_id,
            adapter: adapter
        }
        // create the command state
        let common1 = {
            name: 'commands',
            def:   '',
            type:  "string",
            read:  true,
            write: true,
            role: 'command',
            desc:  "Zeptrion Blind Commands",
            states: {
                stop: 'stop',
                move_close: 'close',
                move_open: 'open',
                move_close_500: 'move_close',
                move_open_500: 'move_open'
            },
            mobile: {
                admin: {
                    visible: true,
                    name: 'Commands'
                }
            }
        }
        adapter.createState(channel_obj.native.device, channel_obj.native.id, 'state-command', common1, channel_obj.native)
        // create the Scene command states
        let szenes = [1,2,3,4]
        szenes.forEach(function(i) {
            let common2 = {
                name: 'Scene - commands',
                def:   '',
                type:  "string",
                read:  true,
                write: true,
                role: 'command',
                desc:  "Zeptrion Blind Scene Commands",
                states: {},
                mobile: {
                    admin: {
                        visible: true,
                        name: 'Scene - commands'
                    }
                }
            }
            common2.states['recall_s' + i] = 'recall'
            common2.states['store_s' + i] = 'store'
            common2.states['delete_s' + i] = 'delete'
            adapter.createState(channel_obj.native.device, channel_obj.native.id, 'state-scene-command-' + i, common2, channel_obj.native)
        });
    }

    static update_current_zeptrion_state(channel_obj, state_id, adapter){
        let trans = {
            obj: channel_obj,
            adapter: adapter
        }
        var url = 'http://' + channel_obj.native.panel.addr + ":" + channel_obj.native.panel.port + '/zrap/chscan/' + channel_obj.native.id
        request(url, function(err, res, body) {
            if(err){
                adapter.log.error(err);
                return
            }
            parseString(body, function (err, result) {
                if(err){
                    adapter.log.error(err);
                    return
                }
                let id = this.obj.native.id
                if(result && 'chscan' in result && id in result.chscan){
                    let state = result.chscan[id][0].val[0]
                    if(state === 0 || state === '0'){
                        state = false
                    }else{
                        state = true
                    }
                    let state_name = this.obj.native.panel.name + '.' + this.obj.native.id + '.state-switch'
                    this.adapter.setState(state_name, {val: state, ack: true});
                }
            }.bind(this))
        }.bind(trans))
    }

    static state_change_ack_false(state_id, new_state, obj, adapter){
        console.log()
        let state_type = state_id.substr(state_id.lastIndexOf(".") + 1);
        let command = {cmd:new_state.val}
        let url = "http://" + obj.native.addr + ":" + obj.native.port + "/zrap/chctrl/" + obj.native.id
        request.post({url:url, form: command}, function(err, res, body){
            if(err){
                adapter.log.error(err);
                return
            }
        })
    }

    static websocket_changed(channel_obj, value, adapter){

    }

    static change_room_on_device(channel_obj, new_room, adapter){
        console.log(channel_obj._id + " changed to room: " + new_room)
    }

    static change_room_on_device(channel_obj, new_room, adapter){
        let command = {group:new_room}
        let url = "http://" + channel_obj.native.addr + ":" + channel_obj.native.port + "/zrap/chdes/" + channel_obj.native.id
        request.post({url:url, form: command}, function(err, res, body){
            if(err){
                adapter.log.error(err);
                return
            }
        })
    }

    static change_channel_name(channel_obj, adapter){
        let command = {name:channel_obj.common.name}
        let url = "http://" + channel_obj.native.addr + ":" + channel_obj.native.port + "/zrap/chdes/" + channel_obj.native.id
        request.post({url:url, form: command}, function(err, res, body){
            if(err){
                adapter.log.error(err);
                return
            }
        })
    }
}