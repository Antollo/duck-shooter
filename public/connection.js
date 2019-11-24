const config = { 'iceServers': [] }
const peer = new RTCPeerConnection(config)

let me = null
let other = null

let channel = null
let onMessageCb = null
let onOpenCb = null
let onCloseCb = null

peer.ondatachannel = e => {
    channel = e.channel
    channel.onopen = e => {
        console.log('channel opened', e)
        if (onOpenCb)
            onOpenCb()
    }
    channel.onclose = e => {
        console.log('channel closed', e)
        channel = null
        if (onCloseCb)
            onCloseCb()
    }
    channel.onmessage = e => {
        console.log('got message', e)
        if (onMessageCb)
            onMessageCb(e.data)
    }
}

peer.onicecandidate = e => {
    if (!e.candidate) return
    console.log('got ice candidate', e)
    ws.send(JSON.stringify({
        action: 'candidate',
        to: other,
        data: e.candidate
    }))
}

const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`)
ws.onopen = () => console.log('websocket opened')
ws.onclose = () => console.log('websocket closed')
ws.onmessage = e => {
    console.log('websocket message', e.data)
    const data = JSON.parse(e.data)
    if (data.to === me) {
        switch (data.action) {
            case 'candidate':
                peer.addIceCandidate(new RTCIceCandidate(data.data))
                    .then(() => console.log('added ice candidate'))
                    .catch(e => console.log('add ice error', e))
                break
            case 'offer':
                peer.setRemoteDescription(new RTCSessionDescription(data.data))
                    .then(() => peer.createAnswer())
                    .then(sdp => {
                        ws.send(JSON.stringify({
                            action: 'answer',
                            to: other,
                            data: sdp
                        }))
                        peer.setLocalDescription(sdp)
                    })
                    .then(() => console.log('offer handled'))
                    .catch(e => console.log('error handling offer', e))
                break
            case 'answer':
                peer.setRemoteDescription(new RTCSessionDescription(data.data))
                    .then(() => console.log('answer handled'))
                    .catch(e => console.log('error handling answer', e))
                break
        }
    }
}

// trigger connection
export function connect() {
    channel = peer.createDataChannel('main-channel')
    channel.onopen = e => {
        console.log('channel opened', e)
        if (onOpenCb)
            onOpenCb()
    }
    channel.onclose = e => {
        console.log('channel closed', e)
        channel = null
        if (onCloseCb)
            onCloseCb()
    }
    channel.onmessage = e => {
        //console.log('got message', e)
        if (onMessageCb)
            onMessageCb(e.data)
    }

    peer.createOffer()
        .then(sdp => {
            peer.setLocalDescription(sdp)
            ws.send(JSON.stringify({
                action: 'offer',
                to: other,
                data: sdp
            }))
        })
        .catch(e => console.log('error creating and sending offer', e))
}

export function onMessage(cb) {
    onMessageCb = cb
}

export function onOpen(cb) {
    onOpenCb = cb
}

export function onClose(cb) {
    onCloseCb = cb
}

export function send(message) {
    if (channel)
    {
        if(channel.readyState !== 'open')
            close()
        else
        channel.send(message)
    }
}

export function close() {
    if (channel)
    {
        channel.close()
        setTimeout(()=>
        {
            channel = null
            onCloseCb()
        }, 500)
    }
}

export function setMyId(name) {
    me = name
}

export function setOtherId(name) {
    other = name
}

