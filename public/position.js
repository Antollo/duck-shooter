import {
    LinearAccelerationSensor
} from '../sensor-polyfills/motion-sensors.js'


if (navigator.permissions) {
    // https://w3c.github.io/orientation-sensor/#model
    Promise.all([navigator.permissions.query({ name: 'accelerometer' }),
    navigator.permissions.query({ name: 'magnetometer' }),
    navigator.permissions.query({ name: 'gyroscope' })])
        .then(results => {
            if (results.every(result => result.state === 'granted')) {
                initSensor()
            } else {
                console.log('Permission to use sensor was denied.')
            }
        }).catch(err => {
            console.log('Integration with Permissions API is not enabled, still try to start app.')
            initSensor()
        })
} else {
    console.log('No Permissions API, still try to start app.')
    initSensor()
}


const position = new THREE.Vector3()
const acceleration = new THREE.Vector3()
const velocity = new THREE.Vector3()
const movement = new THREE.Vector3()
let last, now, dt, x, y, z


let onPositionCb = null

const kalmanFilterPositionX = new KalmanFilter({ R: 0.01, Q: 3 })
const kalmanFilterPositionY = new KalmanFilter({ R: 0.01, Q: 3 })
const kalmanFilterPositionZ = new KalmanFilter({ R: 0.01, Q: 3 })

/*const kalmanFilterVelocityX = new KalmanFilter({ R: 0.01, Q: 3 })
const kalmanFilterVelocityY = new KalmanFilter({ R: 0.01, Q: 3 })
const kalmanFilterVelocityZ = new KalmanFilter({ R: 0.01, Q: 3 })*/

function initSensor() {
    const options = { frequency: 60 }
    console.log(JSON.stringify(options))
    const sensor = new LinearAccelerationSensor(options)
    sensor.onreading = () => {
        last = now
        now = new Date()
        dt = (now.getTime() - last.getTime()) / 1000

        movement.copy(velocity).multiplyScalar(dt)
        position.add(movement)

        acceleration.set(sensor.x, sensor.y, sensor.z)
        /*acceleration.x = Math.abs(acceleration.x) > 0.001 ? acceleration.x : 0
        acceleration.y = Math.abs(acceleration.y) > 0.001 ? acceleration.y : 0
        acceleration.z = Math.abs(acceleration.z) > 0.001 ? acceleration.z : 0*/
        acceleration.x = kalmanFilterPositionX.filter(acceleration.x)
        acceleration.y = kalmanFilterPositionY.filter(acceleration.y)
        acceleration.z = kalmanFilterPositionZ.filter(acceleration.z)
        acceleration.multiplyScalar(dt)
        velocity.add(acceleration)

        position.multiplyScalar(0.9)
        velocity.multiplyScalar(0.9)
        velocity.x = Math.abs(velocity.x) > 0.001 ? velocity.x : 0
        velocity.y = Math.abs(velocity.y) > 0.001 ? velocity.y : 0
        velocity.z = Math.abs(velocity.z) > 0.001 ? velocity.z : 0

        console.log(position)
        if (onPositionCb)
            onPositionCb(position)
    }
    sensor.onerror = (event) => {
        if (event.error.name == 'NotReadableError') {
            console.log('Sensor is not available.')
        }
    }
    last = new Date()
    now = new Date()
    sensor.start()
}

export function onPosition(cb) {
    onPositionCb = cb
}