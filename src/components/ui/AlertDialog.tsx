'use client'

import { Fragment, useState, useEffect, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface AlertDialogProps {
  type: 'success' | 'error' | 'warning'
  title: string
  message: string
  onConfirm: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
}

export default function AlertDialog({ type, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Batal' }: AlertDialogProps) {
  const [isOpen, setIsOpen] = useState(true)

  const handleConfirm = () => {
    onConfirm()
    setIsOpen(false)
  }

  const handleCancel = () => {
    if (onCancel) onCancel()
    setIsOpen(false)
  }
  
  const getIcon = () => {
      switch(type) {
          case 'success': return <CheckCircle className="h-12 w-12 text-green-500" />
          case 'error': return <XCircle className="h-12 w-12 text-red-500" />
          case 'warning': return <AlertTriangle className="h-12 w-12 text-yellow-500" />
      }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleCancel}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-center align-middle shadow-xl transition-all">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    {getIcon()}
                </div>
                <Dialog.Title as="h3" className="mt-4 text-lg font-medium leading-6 text-gray-900">
                  {title}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message}
                  </p>
                </div>
                <div className="mt-6 flex justify-center gap-4">
                  {onCancel && <Button variant="outline" onClick={handleCancel}>{cancelText}</Button>}
                  <Button onClick={handleConfirm}>{confirmText}</Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
