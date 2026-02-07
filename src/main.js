import './style.css'
import { mountGame } from './game'

const app = document.querySelector('#app')
mountGame(app, { caseId: 1 })
