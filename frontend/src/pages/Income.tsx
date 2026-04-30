import { useState, useEffect } from 'react'
import { PlusCircle, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { toast } from 'sonner'
import blink from '../blink/client'
import { calculateGst, indianStates, formatCurrency, formatDate } from '../utils/gstCalculations'

interface Income {
  id: string
  userId: string
  date: string
  description: string
  baseAmount: number
  clientName: string
  clientState: string
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

interface User {
  id: string
  email?: string
}

export default function Income() {
  const [income, setIncome] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  
  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    baseAmount: '',
    clientName: '',
    clientState: '',
    userState: 'Karnataka',
    invoiceNumber: ''
  })

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        fetchIncome()
      }
    })
    return unsubscribe
  }, [])

  const fetchIncome = async () => {
    try {
      setLoading(true)
      const data = await blink.db.income.list({
        orderBy: { createdAt: 'desc' }
      })
      setIncome(data)
    } catch (error) {
      console.error('Error fetching income:', error)
      toast.error('Failed to fetch income')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!incomeForm.description || !incomeForm.baseAmount) {
      toast.error('Please fill in all required fields')
      return
    }

    const baseAmount = parseFloat(incomeForm.baseAmount)
    if (isNaN(baseAmount) || baseAmount <= 0) {
      toast.error('Please enter a valid amount greater than zero')
      return
    }

    if (incomeForm.description.trim().length > 500) {
      toast.error('Description must not exceed 500 characters')
      return
    }

    if (!user) {
      toast.error('Please sign in to add income')
      return
    }

    try {
      setSubmitting(true)
      
      const gstCalc = calculateGst(
        baseAmount,
        incomeForm.userState,
        incomeForm.clientState || incomeForm.userState
      )
      
      const incomeData = {
        id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        date: incomeForm.date,
        description: incomeForm.description.trim(),
        baseAmount: baseAmount,
        clientName: incomeForm.clientName,
        clientState: incomeForm.clientState || incomeForm.userState,
        userState: incomeForm.userState,
        invoiceNumber: incomeForm.invoiceNumber,
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
      
      await blink.db.income.create(incomeData)
      
      setIncomeForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        baseAmount: '',
        clientName: '',
        clientState: '',
        userState: 'Karnataka',
        invoiceNumber: ''
      })
      
      toast.success('Income added successfully')
      fetchIncome()
    } catch (error) {
      console.error('Error adding income:', error)
      toast.error('Failed to add income')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteIncome = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) return
    
    try {
      await blink.db.income.delete(id)
      toast.success('Income record deleted successfully')
      fetchIncome()
    } catch (error) {
      console.error('Error deleting income:', error)
      toast.error('Failed to delete income record')
    }
  }

  const getGSTTypeDisplay = (incomeItem: Income) => {
    if (incomeItem.isInterstate) {
      return <Badge variant="outline">IGST ({incomeItem.gstRate}%)</Badge>
    } else {
      return (
        <div className="flex gap-1">
          <Badge variant="outline" className="text-xs">CGST ({incomeItem.gstRate/2}%)</Badge>
          <Badge variant="outline" className="text-xs">SGST ({incomeItem.gstRate/2}%)</Badge>
        </div>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Income</h1>
        <p className="text-gray-600">Track your business income and revenue with automatic GST calculations</p>
      </div>

      {/* Add Income Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Add New Income
          </CardTitle>
          <CardDescription>Enter income details for automatic GST calculation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="income_date">Date *</Label>
              <Input
                id="income_date"
                type="date"
                value={incomeForm.date}
                onChange={(e) => setIncomeForm({...incomeForm, date: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="income_description">Description *</Label>
              <Input
                id="income_description"
                value={incomeForm.description}
                onChange={(e) => setIncomeForm({...incomeForm, description: e.target.value})}
                placeholder="Consulting services, project work..."
                maxLength={500}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="income_amount">Amount (₹) *</Label>
              <Input
                id="income_amount"
                type="number"
                step="0.01"
                min="0.01"
                value={incomeForm.baseAmount}
                onChange={(e) => setIncomeForm({...incomeForm, baseAmount: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="client">Client Name</Label>
              <Input
                id="client"
                value={incomeForm.clientName}
                onChange={(e) => setIncomeForm({...incomeForm, clientName: e.target.value})}
                placeholder="Client name"
              />
            </div>
            
            <div>
              <Label htmlFor="client_state">Client State</Label>
              <Select value={incomeForm.clientState} onValueChange={(value) => setIncomeForm({...incomeForm, clientState: value})}>
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
              <Label htmlFor="user_state_income">Your State</Label>
              <Select value={incomeForm.userState} onValueChange={(value) => setIncomeForm({...incomeForm, userState: value})}>
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
              <Label htmlFor="income_invoice">Invoice Number</Label>
              <Input
                id="income_invoice"
                value={incomeForm.invoiceNumber}
                onChange={(e) => setIncomeForm({...incomeForm, invoiceNumber: e.target.value})}
                placeholder="INV-001"
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-3">
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {submitting ? 'Adding...' : 'Add Income'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Income Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Income</CardTitle>
          <CardDescription>Complete list of your business income</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : income.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Base Amount</TableHead>
                    <TableHead>GST Type</TableHead>
                    <TableHead>GST Amount</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {income.map((incomeItem) => (
                    <TableRow key={incomeItem.id}>
                      <TableCell>{formatDate(incomeItem.date)}</TableCell>
                      <TableCell className="font-medium">{incomeItem.description}</TableCell>
                      <TableCell>{incomeItem.clientName || '-'}</TableCell>
                      <TableCell>{formatCurrency(incomeItem.baseAmount)}</TableCell>
                      <TableCell>{getGSTTypeDisplay(incomeItem)}</TableCell>
                      <TableCell>{formatCurrency(incomeItem.totalGst)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(incomeItem.totalAmount)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteIncome(incomeItem.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No income recorded yet</p>
              <p className="text-sm text-gray-400">Add your first income entry using the form above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}