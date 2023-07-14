import "../styles/globals.css"
import io from 'socket.io-client'
import { useEffect } from "react"
import { BroadcastChannel } from "broadcast-channel"

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
