import {z} from 'zod'

export const createUserSchema=z.object({
    fullName:z.string(),
    email:z.email(),
    role:z.enum(['production-manager','sales-rep','admin']),
    password:z.string()
})

export const loginUserSchema=z.object({
    email:z.email(),
    password:z.string()
})


