import mongoose from 'mongoose'

const wappSchema = mongoose.Schema ({
    message: String,
    name: String,
    timestamp: String,
    received: Boolean
})

export default mongoose.model('messages', wappSchema)