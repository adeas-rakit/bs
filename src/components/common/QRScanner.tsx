'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'

interface QRScannerProps {
  onScan: (data: string) => void
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    if (!scannerRef.current || isScanning) return

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false
    )

    scanner.render(
      (decodedText) => {
        onScan(decodedText)
        scanner.clear()
      },
      (error) => {
        console.error(error)
      }
    )

    setIsScanning(true)

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error)
      }
    }
  }, [onScan])

  return (
    <div className="flex flex-col items-center">
      <div id="qr-reader" ref={scannerRef} className="w-full" />
    </div>
  )
}