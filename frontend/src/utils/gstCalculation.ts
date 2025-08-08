export interface GSTCalculation {
  baseAmount: number
  gstRate: number
  cgst: number
  sgst: number
  igst: number
  totalGst: number
  totalAmount: number
  isInterstate: boolean
}

export interface ExpenseCategory {
  value: string
  label: string
  rate: number
  description: string
}

export const expenseCategories: ExpenseCategory[] = [
  { value: 'office_rent', label: 'Office Rent', rate: 0, description: 'Commercial property rent' },
  { value: 'equipment', label: 'Equipment', rate: 18, description: 'Computers, furniture, machinery' },
  { value: 'travel', label: 'Travel', rate: 5, description: 'Transportation and lodging' },
  { value: 'meals', label: 'Meals', rate: 5, description: 'Business meals and entertainment' },
  { value: 'software', label: 'Software', rate: 18, description: 'Software licenses and subscriptions' },
  { value: 'marketing', label: 'Marketing', rate: 18, description: 'Advertising and promotion' },
  { value: 'professional_services', label: 'Professional Services', rate: 18, description: 'Legal, accounting, consulting' },
  { value: 'utilities', label: 'Utilities', rate: 18, description: 'Electricity, internet, phone' },
  { value: 'office_supplies', label: 'Office Supplies', rate: 18, description: 'Stationery, printing materials' },
  { value: 'other', label: 'Other', rate: 18, description: 'Miscellaneous business expenses' }
]

export const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
]

export function getGstRateForCategory(category: string): number {
  const categoryData = expenseCategories.find(cat => cat.value === category)
  return categoryData?.rate || 18
}

export function calculateGst(
  baseAmount: number,
  userState: string,
  vendorState: string,
  category?: string,
  isIncome: boolean = false
): GSTCalculation {
  const gstRate = category ? getGstRateForCategory(category) : 18
  const isInterstate = userState.toLowerCase() !== vendorState.toLowerCase()
  
  if (gstRate === 0) {
    return {
      baseAmount,
      gstRate,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalGst: 0,
      totalAmount: baseAmount,
      isInterstate
    }
  }
  
  const totalGst = (baseAmount * gstRate) / 100
  
  if (isInterstate) {
    // Interstate - IGST
    return {
      baseAmount,
      gstRate,
      cgst: 0,
      sgst: 0,
      igst: totalGst,
      totalGst,
      totalAmount: baseAmount + totalGst,
      isInterstate: true
    }
  } else {
    // Intrastate - CGST + SGST
    const cgst = totalGst / 2
    const sgst = totalGst / 2
    return {
      baseAmount,
      gstRate,
      cgst,
      sgst,
      igst: 0,
      totalGst,
      totalAmount: baseAmount + totalGst,
      isInterstate: false
    }
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN')
}
