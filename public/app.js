import * as connection from './connection.js'
import * as sensors from './sensors.js'

const myIdElement = document.querySelector('code#idText')
const otherIdElement = document.querySelector('textarea#otherId')
const dataChannelSend = document.querySelector('textarea#dataChannelSend')
const dataChannelReceive = document.querySelector('textarea#dataChannelReceive')
const startButton = document.querySelector('button#startButton')
const sendButton = document.querySelector('button#sendButton')
const closeButton = document.querySelector('button#closeButton')
const pointer = document.querySelector('div#pointer')


let myId = localStorage.getItem('myId')
if (!myId) {
    myId = Math.random().toString(36).substring(4, 10)
    localStorage.setItem('myId', myId)
}
connection.setMyId(myId)
myIdElement.textContent = myId
otherIdElement.value = localStorage.getItem('otherId')
if (otherIdElement.value) connection.setOtherId(otherIdElement.value)
otherIdElement.oninput = () => {
    connection.setOtherId(otherIdElement.value)
    localStorage.setItem('otherId', otherIdElement.value)
}


startButton.onclick = () => connection.connect()
sendButton.onclick = () => connection.send(dataChannelSend.value)
closeButton.onclick = () => connection.close()


const kalmanFilterAngleY = new KalmanFilter({ R: 0.005, Q: 0.2 })
const kalmanFilterAngleX = new KalmanFilter({ R: 0.005, Q: 0.2 })

/*const kalmanFilterPositionY = new KalmanFilter({ R: 0.1, Q: 3 })
const kalmanFilterPositionX = new KalmanFilter({ R: 0.1, Q: 3 })
const kalmanFilterPositionZ = new KalmanFilter({ R: 0.1, Q: 3 })*/


connection.onMessage(e => {
    dataChannelReceive.value = e
    try {
        const v = JSON.parse(e)
        if (v && v._x && v._y && v._z) {
            const w = window.innerWidth / 2;
            const h = window.innerHeight / 2;
            //We need some actual math here
            pointer.style.top = `${Math.tan(kalmanFilterAngleY.filter(v._x)) * 3 * h + h}px`
            pointer.style.left = `${Math.tan(kalmanFilterAngleX.filter(v._z)) * 1.6 * w + w}px`
            console.log(v)
        }
        //Getting position from acceleration sensor is a failure
    } catch (e) {
        console.error(e)
    }
})
connection.onClose(() => {
    startButton.disabled = false
    sendButton.disabled = true
    closeButton.disabled = true
    dataChannelSend.disabled = true
})
connection.onOpen(() => {
    startButton.disabled = true
    sendButton.disabled = false
    closeButton.disabled = false
    dataChannelSend.disabled = false
})


sensors.onRotation(e => connection.send(JSON.stringify(e)))