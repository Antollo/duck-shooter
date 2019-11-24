import {
    RelativeOrientationSensor
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


const quaternion = new THREE.Quaternion()
const euler = new THREE.Euler()
const quaternionRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)

let onRotationCb = null

function initSensor() {
    const options = { frequency: 60 }
    console.log(JSON.stringify(options))
    const sensor = new RelativeOrientationSensor(options)
    sensor.onreading = () => {
        quaternion.fromArray(sensor.quaternion).inverse().multiply(quaternionRot)
        euler.setFromQuaternion(quaternion)
        console.log(euler)
        if (onRotationCb)
            onRotationCb(euler)
    }
    sensor.onerror = (event) => {
        if (event.error.name == 'NotReadableError') {
            console.log('Sensor is not available.')
        }
    }
    sensor.start()
}

export function onRotation(cb) {
    onRotationCb = cb
}