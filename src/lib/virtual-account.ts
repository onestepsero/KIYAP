const BANKS = ['IBK기업은행', 'KB국민은행', '신한은행', '우리은행', '하나은행']

export function generateVirtualAccount(): { bankName: string; accountNo: string; dueDate: Date } {
  const bankName = BANKS[Math.floor(Math.random() * BANKS.length)]
  const prefix = Math.floor(Math.random() * 900 + 100).toString()
  const middle = Math.floor(Math.random() * 9000000 + 1000000).toString()
  const suffix = Math.floor(Math.random() * 900 + 100).toString()
  const accountNo = `${prefix}-${middle}-${suffix}`

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7)
  dueDate.setHours(23, 59, 59, 999)

  return { bankName, accountNo, dueDate }
}
