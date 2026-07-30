import mysql from 'mysql2/promise'
import { criarConfiguracaoBanco } from '../config/database.js'

const pool = mysql.createPool(criarConfiguracaoBanco())

export default pool
