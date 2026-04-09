import { formatCurrency, formatDate } from '@/lib/utils'

interface Payment {
  id: string
  amount: number
  virtualAccountNo: string
  bankName: string
  accountHolder: string
  dueDate: string | Date
  status: string
  paidAt?: string | Date | null
}

export default function VirtualAccountInfo({ payment }: { payment: Payment }) {
  if (payment.status === 'PAID' || payment.status === 'SETTLED') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          결제 완료
        </div>
        <p className="text-sm text-green-600">
          {formatCurrency(payment.amount)} 납부 완료
          {payment.paidAt && ` (${formatDate(payment.paidAt)})`}
        </p>
      </div>
    )
  }

  if (payment.status === 'EXPIRED') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-500">가상계좌 기간이 만료되었습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        가상계좌 정보
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">은행명</span>
          <span className="font-medium">{payment.bankName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">계좌번호</span>
          <span className="font-mono font-bold text-blue-700">{payment.virtualAccountNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">예금주</span>
          <span className="font-medium">{payment.accountHolder}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">납부금액</span>
          <span className="font-bold text-blue-700">{formatCurrency(payment.amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">납부기한</span>
          <span className="font-medium text-red-600">{formatDate(payment.dueDate)}</span>
        </div>
      </div>
    </div>
  )
}
