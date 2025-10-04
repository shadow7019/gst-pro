import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  CreditCard,
  PlusCircle,
  BarChart3,
  Bot,
  AlertTriangle,
  Info,
  Lightbulb
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import blink from '../blink/client'
import { formatCurrency, formatDate } from '../utils/gstCalculation'

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

interface Expense {
  id: string
  date: string
  description: string
  category: string
  baseAmount: number
  totalAmount: number
  totalGst: number
  createdAt: string
}

interface Income {
  id: string
  date: string
  description: string
  clientName: string
  baseAmount: number
  totalAmount: number
  totalGst: number
  createdAt: string
}

export default function Dashboard() {
  const [gstSummary, setGstSummary] = useState<GSTSummary | null>(null)
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [recentIncome, setRecentIncome] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch expenses
      const expenses = await blink.db.expenses.list({
        orderBy: { createdAt: 'desc' },
        limit: 5
      })
      
      // Fetch income
      const income = await blink.db.income.list({
        orderBy: { createdAt: 'desc' },
        limit: 5
      })
      
      setRecentExpenses(expenses)
      setRecentIncome(income)
      
      // Calculate GST summary
      const allExpenses = await blink.db.expenses.list()
      const allIncome = await blink.db.income.list()
      
      const summary: GSTSummary = {
        totalSales: allIncome.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
        totalPurchases: allExpenses.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
        outputGst: allIncome.reduce((sum, item) => sum + (item.totalGst || 0), 0),
        inputTaxCredit: allExpenses.reduce((sum, item) => sum + (item.totalGst || 0), 0),
        netGstLiability: 0,
        cgstLiability: 0,
        sgstLiability: 0,
        igstLiability: 0
      }
      
      summary.netGstLiability = summary.outputGst - summary.inputTaxCredit
      setGstSummary(summary)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDashboardInsights = () => {
    if (!gstSummary) return []
    
    const insights = []
    
    // GST Liability Alert
    if (gstSummary.netGstLiability > 50000) {
      insights.push({
        type: 'warning',
        title: 'High GST Liability',
        description: `Your current GST liability is ${formatCurrency(gstSummary.netGstLiability)}. Consider advance payment.`,
        action: 'Plan GST Payment'
      })
    }
    
    // ITC Optimization
    if (gstSummary.inputTaxCredit < gstSummary.outputGst * 0.3) {
      insights.push({
        type: 'info',
        title: 'ITC Optimization',
        description: 'You might be missing Input Tax Credit claims. Review your business expenses.',
        action: 'Review Expenses'
      })
    }
    
    // Quarterly Filing Reminder
    const currentDate = new Date()
    const quarterEnd = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3 + 3, 0)
    const daysToQuarterEnd = Math.ceil((quarterEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysToQuarterEnd <= 15 && daysToQuarterEnd > 0) {
      insights.push({
        type: 'info',
        title: 'Quarter End Approaching',
        description: `Quarter ends in ${daysToQuarterEnd} days. Prepare your GST returns.`,
        action: 'View Returns'
      })
    }
    
    return insights
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

  const insights = getDashboardInsights()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your GST and tax information</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gstSummary ? formatCurrency(gstSummary.totalSales) : '₹0.00'}</div>
            <p className="text-xs text-muted-foreground">Revenue with GST</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gstSummary ? formatCurrency(gstSummary.totalPurchases) : '₹0.00'}</div>
            <p className="text-xs text-muted-foreground">Purchases with GST</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net GST Liability</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {gstSummary ? formatCurrency(gstSummary.netGstLiability) : '₹0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Amount to pay</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Input Tax Credit</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {gstSummary ? formatCurrency(gstSummary.inputTaxCredit) : '₹0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Credit available</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Alerts */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Smart Insights
            </CardTitle>
            <CardDescription>AI-powered recommendations for your business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <Alert key={index} className={insight.type === 'warning' ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}>
                  {insight.type === 'warning' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                  <AlertTitle>{insight.title}</AlertTitle>
                  <AlertDescription className="mt-2">
                    {insight.description}
                    <Button variant="link" className="p-0 h-auto font-medium text-sm ml-2">
                      {insight.action} →
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Recent Expenses
            </CardTitle>
            <CardDescription>Last 5 expense entries</CardDescription>
          </CardHeader>
          <CardContent>
            {recentExpenses.length > 0 ? (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(expense.date)} • {expense.category?.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(expense.totalAmount)}</p>
                      <p className="text-sm text-muted-foreground">
                        GST: {formatCurrency(expense.totalGst)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No expenses recorded yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Recent Income
            </CardTitle>
            <CardDescription>Last 5 income entries</CardDescription>
          </CardHeader>
          <CardContent>
            {recentIncome.length > 0 ? (
              <div className="space-y-3">
                {recentIncome.map((incomeItem) => (
                  <div key={incomeItem.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{incomeItem.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(incomeItem.date)} • {incomeItem.clientName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(incomeItem.totalAmount)}</p>
                      <p className="text-sm text-muted-foreground">
                        GST: {formatCurrency(incomeItem.totalGst)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No income recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/expenses">
              <Button variant="outline" className="h-20 w-full flex flex-col items-center justify-center gap-2">
                <PlusCircle className="h-6 w-6" />
                Add Expense
              </Button>
            </Link>
            <Link to="/income">
              <Button variant="outline" className="h-20 w-full flex flex-col items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Add Income
              </Button>
            </Link>
            <Link to="/reports">
              <Button variant="outline" className="h-20 w-full flex flex-col items-center justify-center gap-2">
                <BarChart3 className="h-6 w-6" />
                View Reports
              </Button>
            </Link>
            <Link to="/tax-advisor">
              <Button variant="outline" className="h-20 w-full flex flex-col items-center justify-center gap-2">
                <Bot className="h-6 w-6" />
                Tax Advice
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}