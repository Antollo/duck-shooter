const express = require('express')
const app = express()
require('express-ws')(app)
const wsList = new Array()
const port = process.env.PORT || 3000

app.use(express.static(__dirname + '/public'))
app.get('/', (req, res) =>
    res.sendFile(__dirname + '/public/index3.html')
)

app.ws('/ws', (ws, req) => {
    console.log('WS connection established!')
    wsList.push(ws)

    ws.on('close', () => {
        wsList.splice(wsList.indexOf(ws), 1)
        console.log('WS closed')
    })

    ws.on('message', message => {
        console.log(`got ws message: ${message}`)
        wsList.forEach(ws =>
            ws.send(message)
        )
    })
})

app.listen(port, () => console.log(`App listening on port ${port}!`))
