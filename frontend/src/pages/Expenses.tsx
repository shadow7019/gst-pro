import { useState, useEffect } from 'react'
import { PlusCircle, Trash2, Edit } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { toast } from 'sonner'
import blink from '../blink/client'
import { calculateGst, expenseCategories, indianStates, formatCurrency, formatDate } from '../utils/gstCalculations'

interface Expense {
  id: string
  userId: string
  date: string
  description: string
  category: string
  baseAmount: number
  vendorName: string
  vendorState: string
  userState: string
  invoiceNumber: string
  gstRate: number
  cgst: number
  sgst: number
  igst: number
  totalGst: number
  totalAmount: number
  isInterstate: boolean
  createdAt: string
  updatedAt: string
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    baseAmount: '',
    vendorName: '',
    vendorState: '',
    userState: 'Karnataka',
    invoiceNumber: ''
  })

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        fetchExpenses()
      }
    })
    return unsubscribe
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const data = await blink.db.expenses.list({
        orderBy: { createdAt: 'desc' }
      })
      setExpenses(data)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to fetch expenses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!expenseForm.description || !expenseForm.category || !expenseForm.baseAmount) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!user) {
      toast.error('Please sign in to add expenses')
      return
    }

    try {
      setSubmitting(true)
      
      const baseAmount = parseFloat(expenseForm.baseAmount)
      const gstCalc = calculateGst(
        baseAmount,
        expenseForm.userState,
        expenseForm.vendorState || expenseForm.userState,
        expenseForm.category
      )
      
      const expenseData = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        date: expenseForm.date,
        description: expenseForm.description,
        category: expenseForm.category,
        baseAmount: baseAmount,
        vendorName: expenseForm.vendorName,
        vendorState: expenseForm.vendorState || expenseForm.userState,
        userState: expenseForm.userState,
        invoiceNumber: expenseForm.invoiceNumber,
        gstRate: gstCalc.gstRate,
        cgst: gstCalc.cgst,
        sgst: gstCalc.sgst,
        igst: gstCalc.igst,
        totalGst: gstCalc.totalGst,
        totalAmount: gstCalc.totalAmount,
        isInterstate: gstCalc.isInterstate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await blink.db.expenses.create(expenseData)
      
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        baseAmount: '',
        vendorName: '',
        vendorState: '',
        userState: 'Karnataka',
        invoiceNumber: ''
      })
      
      toast.success('Expense added successfully')
      fetchExpenses()
    } catch (error) {
      console.error('Error adding expense:', error)
      toast.error('Failed to add expense')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      await blink.db.expenses.delete(id)
      toast.success('Expense deleted successfully')
      fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Failed to delete expense')
    }
  }

  const getGSTTypeDisplay = (expense: Expense) => {
    if (expense.isInterstate) {
      return <Badge variant="outline">IGST ({expense.gstRate}%)</Badge>
    } else {
      return (
        <div className="flex gap-1">
          <Badge variant="outline" className="text-xs">CGST ({expense.gstRate/2}%)</Badge>
          <Badge variant="outline" className="text-xs">SGST ({expense.gstRate/2}%)</Badge>
        </div>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
        <p className="text-gray-600">Track and manage your business expenses with automatic GST calculations</p>
      </div>

      {/* Add Expense Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Add New Expense
          </CardTitle>
          <CardDescription>Enter expense details for automatic GST calculation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                placeholder="Office supplies, software license..."
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({...expenseForm, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label} ({cat.rate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={expenseForm.baseAmount}
                onChange={(e) => setExpenseForm({...expenseForm, baseAmount: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="vendor">Vendor Name</Label>
              <Input
                id="vendor"
                value={expenseForm.vendorName}
                onChange={(e) => setExpenseForm({...expenseForm, vendorName: e.target.value})}
                placeholder="Vendor name"
              />
            </div>
            
            <div>
              <Label htmlFor="vendor_state">Vendor State</Label>
              <Select value={expenseForm.vendorState} onValueChange={(value) => setExpenseForm({...expenseForm, vendorState: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="user_state">Your State</Label>
              <Select value={expenseForm.userState} onValueChange={(value) => setExpenseForm({...expenseForm, userState: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="invoice">Invoice Number</Label>
              <Input
                id="invoice"
                value={expenseForm.invoiceNumber}
                onChange={(e) => setExpenseForm({...expenseForm, invoiceNumber: e.target.value})}
                placeholder="INV-001"
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-3">
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {submitting ? 'Adding...' : 'Add Expense'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
          <CardDescription>Complete list of your business expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Base Amount</TableHead>
                    <TableHead>GST Type</TableHead>
                    <TableHead>GST Amount</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {expenseCategories.find(cat => cat.value === expense.category)?.label || expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{expense.vendorName || '-'}</TableCell>
                      <TableCell>{formatCurrency(expense.baseAmount)}</TableCell>
                      <TableCell>{getGSTTypeDisplay(expense)}</TableCell>
                      <TableCell>{formatCurrency(expense.totalGst)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(expense.totalAmount)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteExpense(expense.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No expenses recorded yet</p>
              <p className="text-sm text-gray-400">Add your first expense using the form above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}