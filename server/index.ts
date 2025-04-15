import '../register-alias'
import { config as configEnv } from 'dotenv'
import { startup } from './startup'

configEnv()
startup()
