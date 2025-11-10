'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface InvitePanelProps {
  classCode: string
  joinPin: string
  className: string
}

export function InvitePanel({ classCode, joinPin, className }: InvitePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrGenerated, setQrGenerated] = useState(false)

  useEffect(() => {
    if (canvasRef.current && classCode) {
      const joinUrl = `${window.location.origin}/join?code=${classCode}`

      QRCode.toCanvas(
        canvasRef.current,
        joinUrl,
        {
          width: 256,
          margin: 2,
          color: {
            dark: '#ea580c', // Orange-600
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) {
            console.error('QR Code generation error:', error)
            toast.error('Failed to generate QR code')
          } else {
            setQrGenerated(true)
          }
        }
      )
    }
  }, [classCode])

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `${className.replace(/\s+/g, '_')}_QR_Code.png`
      link.href = url
      link.click()
      toast.success('QR code downloaded!')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Student Invitation</h2>
        <p className="text-sm text-gray-600 mt-1">
          Share these codes with students to join your class
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <div className="space-y-4">
          <div className="flex flex-col items-center">
            <Label className="mb-2">QR Code</Label>
            <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Students can scan this to auto-fill the class code
            </p>
          </div>

          {qrGenerated && (
            <Button
              onClick={downloadQRCode}
              variant="outline"
              className="w-full"
            >
              Download QR Code
            </Button>
          )}
        </div>

        {/* Codes Section */}
        <div className="space-y-6">
          {/* Class Code */}
          <div className="space-y-2">
            <Label>Class Code</Label>
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-4">
              <p className="text-3xl font-mono font-bold text-center text-orange-600 tracking-widest">
                {classCode}
              </p>
            </div>
            <Button
              onClick={() => copyToClipboard(classCode, 'Class code')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              📋 Copy Class Code
            </Button>
            <p className="text-xs text-gray-500">
              Students will enter this 6-character code
            </p>
          </div>

          {/* Join PIN */}
          <div className="space-y-2">
            <Label>Join PIN</Label>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4">
              <p className="text-3xl font-mono font-bold text-center text-blue-600 tracking-widest">
                {joinPin}
              </p>
            </div>
            <Button
              onClick={() => copyToClipboard(joinPin, 'PIN')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              📋 Copy PIN
            </Button>
            <p className="text-xs text-gray-500">
              4-digit PIN for class security
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
        <p className="text-sm text-amber-800">
          <strong>💡 How to share:</strong> Students can either scan the QR code or manually enter the class code and PIN at{' '}
          <code className="bg-amber-100 px-1 rounded">/join</code>
        </p>
      </div>
    </div>
  )
}
