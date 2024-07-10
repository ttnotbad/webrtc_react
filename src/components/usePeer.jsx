import { useEffect, useRef, useState } from 'react'

let iceServers = {
    iceServers: [{
        urls: 'turn:120.79.136.163:3478',
        username: 'ddssingsong',
        credential: '123456'
    }]
};
function usePeer(props) {
    const remoteAudioRef = useRef(null)
    let localAudioRef = useRef(null)
    const [peer, setPeer] = useState(null)
    const from = props.user
    const localId = props.toId
    const socket = new WebSocket(`wss://120.79.136.163:8502/api/ws/${from}/0`)

    // 创建本端端点
    const createPeer = () => {
        const rtcPeer = new RTCPeerConnection(iceServers)
        setPeer(rtcPeer)
    }

    const createLocalMedia = (callbcak) => {
        if (peer === null) {
            return
        }
        if (window.navigator.mediaDevices === undefined) {
            window.navigator.mediaDevices = {}
        }
        const mediaConstraints = {
            video: false,
            audio: true
        }
        window.navigator.mediaDevices.getUserMedia(mediaConstraints).then((stream) => {
            const localMediaStream = stream
            stream.getTracks().forEach(item => {
                peer.addTrack(item, localMediaStream)
            })
            callbcak(localMediaStream)
        }).catch((err) => {
            console.log(err)
        })
    }

    const sendMsg = async (operation, msg, webSocket) => {
        let result = {
            eventName: operation,
            data: msg
        };
        await webSocket.send(JSON.stringify(result));
    }

    const sendSdp = (operation, data, webSocket) => {
        let result = {
            eventName: operation,
            data: data
        };
        webSocket.send(JSON.stringify(result));
    }

    const sendMsgCandidate = (operation, data, webSocket) => {
        let result = {
            eventName: operation,
            data: data
        };
        webSocket.send(JSON.stringify(result));
    }

    // 挂断
    const hangUp = () => {
        // peer.getSenders().forEach(function (sender) {
        //     console.log(sender)
        //     sender.track.stop();
        // });

        // // 关闭所有的Transceivers
        // peer.getTransceivers().forEach(function (transceiver) {
        //     console.log(transceiver)
        //     transceiver.stop();
        // });

        // 关闭信令通道，结束通信
        peer.close();
        // localAudioRef.getTracks().forEach(track => track.stop())
        setPeer(null)
        localAudioRef = null
    }

    const createSocket = () => {
        socket.onopen = function () {
            window.setInterval(function () {
                const ping = { 'eventName': 'ping' }
                socket.send(JSON.stringify(ping))
            }, 30000)
        }
        let timeout = null, time = null
        socket.onmessage = (evt) => {
            const evtData = JSON.parse(evt.data)
            const evtName = evtData.eventName
            const room = evtData.data.room;
            const to = evtData.data.inviteID;

            // eslint-disable-next-line default-case
            switch (evtName) {
                case '__login_success':
                    createLocalMedia(stream => {
                        localAudioRef.current.srcObject = stream
                        localAudioRef.current.play()
                    }) // 打开本地音频流

                    time = setInterval(() => {
                        socket.send(JSON.stringify({ eventName: '__ready', data: { userID: localId } }))
                    }, 1000);
                    timeout = setTimeout(() => {
                        clearInterval(time)
                        clearTimeout(timeout)
                    }, 30000);

                    break;
                case '__invite':
                    if (time !== null) {
                        clearInterval(time)
                        time = null
                    }

                    // 收到邀请
                    sendMsg('__ring', { toID: to, fromID: from, room }, socket)
                    // 加入房间
                    sendMsg('__join', { userID: from, room }, socket)
                    // 收集 绑定 候选人

                    peer.onicecandidate = (event) => {
                        if (event.candidate === null) {
                            return
                        }
                        sendMsgCandidate('__ice_candidate', { fromID: from, userID: to, candidate: event.candidate.candidate, sdpMid: event.candidate.sdpMid, sdpMLineIndex: event.candidate.sdpMLineIndex }, socket)
                    }
                    break;
                case "__ice_candidate":
                    // 加入成功

                    // 交换候选人
                    let iceCandidate = new RTCIceCandidate(evtData.data);
                    peer.addIceCandidate(iceCandidate)
                    break;
                case "__offer":
                    // 保存 offer 并创建answer
                    const fromID = evtData.data.fromID
                    const userID = evtData.data.userID

                    peer.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: evtData.data.sdp })).then(() => {
                        peer.createAnswer({ iceRestart: true, offerToReceiveAudio: true }).then(evt => {
                            // 创建本端映射
                            peer.setLocalDescription(evt)
                            // 发送answer
                            sendSdp('__answer', { "fromID": userID, "userID": fromID, "sdp": evt.sdp }, socket);
                        })
                    })

                    // 打开对端视频
                    peer.ontrack = (evt) => {
                        remoteAudioRef.current.srcObject = evt.streams[0]
                        let play = () => {
                            remoteAudioRef.current.play().catch(err => {
                                console.log(err)
                            })
                            play()
                        }
                    }
                    break;
                case "__answer":
                    // 创建offer
                    break;
                case '__leave':
                    // 离开
                    hangUp()
                    if (time !== null) {
                        clearInterval(time)
                        time = null
                    }
                    break;
                case '__cancel':
                    if (time !== null) {
                        clearInterval(time)
                        time = null
                    }
                    break;
            }
            timeout = setTimeout(() => {
                clearInterval(time)
                clearTimeout(timeout)
            }, 30000);
        }
    }

    useEffect(() => {
        createSocket()
        // createLocalMedia()
    })

    // 创建Peer 
    useEffect(() => {
        createPeer()
    }, [])


    return <div style={{ padding: 10 }}>
        <div>
            <video playsInline style={{ position: 'absolute' }} ref={localAudioRef} autoPlay />
        </div>
        <div>
            <video playsInline style={{ width: '80vw', height: '80vh', border: '1px solid black' }} ref={remoteAudioRef} autoPlay />
        </div>
    </div>
}

export default usePeer