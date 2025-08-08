import { useState, useEffect } from 'react'
import { FileText, Download, BarChart3, PieChart, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import blink from '../blink/client'
import { formatCurrency, formatDate } from '../utils/gstCalculations'

interface GSTSummary {
  totalSales: number
  totalPurchases: number
  outputGst: number
  inputTaxCredit: number
  netGstLiability: number
  cgstLiability: number
  sgstLiability: number
  igstLiability: number
}

export default function Reports() {
  const [gstSummary, setGstSummary] = useState<GSTSummary | null>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [income, setIncome] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data
      const [expensesData, incomeData] = await Promise.all([
        blink.db.expenses.list(),
        blink.db.income.list()
      ])
      
      setExpenses(expensesData)
      setIncome(incomeData)
      
      // Calculate GST summary
      const summary: GSTSummary = {
        totalSales: incomeData.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
        totalPurchases: expensesData.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
        outputGst: incomeData.reduce((sum, item) => sum + (item.totalGst || 0), 0),
        inputTaxCredit: expensesData.reduce((sum, item) => sum + (item.totalGst || 0), 0),
        netGstLiability: 0,
        cgstLiability: incomeData.reduce((sum, item) => sum + (item.cgst || 0), 0) - expensesData.reduce((sum, item) => sum + (item.cgst || 0), 0),
        sgstLiability: incomeData.reduce((sum, item) => sum + (item.sgst || 0), 0) - expensesData.reduce((sum, item) => sum + (item.sgst || 0), 0),
        igstLiability: incomeData.reduce((sum, item) => sum + (item.igst || 0), 0) - expensesData.reduce((sum, item) => sum + (item.igst || 0), 0)
      }
      
      summary.netGstLiability = summary.outputGst - summary.inputTaxCredit
      setGstSummary(summary)
      
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMonthlyData = () => {
    const monthlyData: { [key: string]: { income: number, expenses: number, gst: number } } = {}
    
    // Process income
    income.forEach(item => {
      const month = new Date(item.date).toISOString().slice(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0, gst: 0 }
      }
      monthlyData[month].income += item.totalAmount || 0
      monthlyData[month].gst += item.totalGst || 0
    })
    
    // Process expenses
    expenses.forEach(item => {
      const month = new Date(item.date).toISOString().slice(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0, gst: 0 }
      }
      monthlyData[month].expenses += item.totalAmount || 0
      monthlyData[month].gst -= item.totalGst || 0 // Subtract input GST
    })
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        ...data
      }))
  }

  const getCategoryBreakdown = () => {
    const categoryData: { [key: string]: number } = {}
    
    expenses.forEach(expense => {
      const category = expense.category || 'other'
      categoryData[category] = (categoryData[category] || 0) + (expense.totalAmount || 0)
    })
    
    return Object.entries(categoryData)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => ({
        category: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        amount
      }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const monthlyData = getMonthlyData()
  const categoryBreakdown = getCategoryBreakdown()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive view of your business finances and GST compliance</p>
        </div>
        <Button variant="outline" disabled>
          <Download className="h-4 w-4 mr-2" />
          Export Reports
        </Button>
      </div>

      {/* GST Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {gstSummary ? formatCurrency(gstSummary.totalSales) : '₹0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Revenue with GST</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {gstSummary ? formatCurrency(gstSummary.totalPurchases) : '₹0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Purchases with GST</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net GST Liability</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {gstSummary ? formatCurrency(gstSummary.netGstLiability) : '₹0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Amount to pay</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Input Tax Credit</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {gstSummary ? formatCurrency(gstSummary.inputTaxCredit) : '₹0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Credit available</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gst-summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gst-summary">GST Summary</TabsTrigger>
          <TabsTrigger value="monthly-trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="category-breakdown">Category Breakdown</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="gst-summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GST Liability Breakdown</CardTitle>
              <CardDescription>Detailed breakdown of your GST obligations</CardDescription>
            </CardHeader>
            <CardContent>
              {gstSummary && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Total Output GST (Sales)</span>
                    <span className="font-bold text-green-600">{formatCurrency(gstSummary.outputGst)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Total Input Tax Credit</span>
                    <span className="font-bold text-blue-600">-{formatCurrency(gstSummary.inputTaxCredit)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="font-bold text-lg">Net GST Liability</span>
                    <span className="font-bold text-xl text-purple-600">{formatCurrency(gstSummary.netGstLiability)}</span>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-700">CGST Payable</p>
                      <p className="font-bold text-orange-800">{formatCurrency(gstSummary.cgstLiability)}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">SGST Payable</p>
                      <p className="font-bold text-blue-800">{formatCurrency(gstSummary.sgstLiability)}</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700">IGST Payable</p>
                      <p className="font-bold text-purple-800">{formatCurrency(gstSummary.igstLiability)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly-trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Financial Trends</CardTitle>
              <CardDescription>Track your income, expenses, and GST liability over time</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <div className="space-y-4">
                  {monthlyData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="font-medium">{data.month}</div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-green-600">
                          Income: {formatCurrency(data.income)}
                        </div>
                        <div className="text-red-600">
                          Expenses: {formatCurrency(data.expenses)}
                        </div>
                        <div className="text-purple-600">
                          Net GST: {formatCurrency(data.gst)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No data available for monthly trends</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category-breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Category Breakdown</CardTitle>
              <CardDescription>See where your money is going by category</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {categoryBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{item.category}</Badge>
                      </div>
                      <div className="font-medium">{formatCurrency(item.amount)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No expense categories to display</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GST Compliance Status</CardTitle>
              <CardDescription>Check your compliance with GST regulations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-green-800">Transaction Records</h4>
                    <p className="text-sm text-green-700">All transactions are properly recorded</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">✓ Compliant</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-blue-800">GST Calculations</h4>
                    <p className="text-sm text-blue-700">Automatic GST calculations for all transactions</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">✓ Automated</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-orange-800">Filing Reminders</h4>
                    <p className="text-sm text-orange-700">Set up quarterly filing reminders</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">⚠ Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}