import "../styles/globals.css"
import io from 'socket.io-client'
import { useEffect } from "react"

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const socketInitialiser = async () => {

      //Check for presence of endpoint
      await fetch('/api/socket')
  
      //Connect to endpoint
      globalThis.ws = io()
  
      globalThis.ws.on('connect', () => {
        console.log('connected')
      })

      globalThis.ws.on('update-item', (msg) => {
        console.log('update',msg)
      })
    }
    socketInitialiser()
  }, [])

  return <Component {...pageProps} />
}
