'use strict';

const request = require('request')
const parseString = require('xml2js').parseString;

module.exports = class Light_Switch_Handler{
    constructor() {}

    static get_desc(){return 'Zeptrion Light Switch'}
    static get_role(){return 'light.switch'}

    static create_state(channel_obj, channel_id, adapter){
        let trans = {
            obj: channel_obj,
            channel_id: channel_id,
            adapter: adapter
        }
        let common = {
            name: 'Switch',
            def:   false,
            type:  "boolean",
            read:  true,
            write: true,
            role: 'switch',
            desc:  "Zeptrion Light Switch State On/Off",
            mobile: {
                admin: {
                    visible: true,
                    name: 'Switch',
                    type: 'Light'
                }
            }
        }
        adapter.createState(channel_obj.native.device, channel_obj.native.id, 'state-switch', common, channel_obj.native, function(err, state_id){
            if(err){
                adapter.log.error(err);
                return
            }
            Light_Switch_Handler.update_current_zeptrion_state(this.obj, state_id, this.adapter)
        }.bind(trans))
    }

    static update_current_zeptrion_state(channel_obj, state_id, adapter){
        let trans = {
            obj: channel_obj,
            adapter: adapter
        }
        var url = 'http://' + channel_obj.native.addr + ":" + channel_obj.native.port + '/zrap/chscan/' + channel_obj.native.id
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
                    this.adapter.setState(state_id, {val: state, ack: true});
                }
            }.bind(this))
        }.bind(trans))
    }

    static state_change_ack_false(state_id, new_state, obj, adapter){
        let command = {cmd:'off'}
        if(new_state.val === true){
            command = {cmd:'on'}
        }
        let url = "http://" + obj.native.addr + ":" + obj.native.port + "/zrap/chctrl/" + obj.native.id
        request.post({url:url, form: command}, function(err, res, body){
            if(err){
                adapter.log.error(err);
                return
            }
        })
    }

    static websocket_changed(channel_obj, value, adapter){
        let state
        if(value === 0 || value === '0'){
            state = false
        }else{
            state = true
        }
        let state_name = channel_obj._id + '.state-switch'
        adapter.setState(state_name, {val: state, ack: true});
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