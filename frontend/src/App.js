import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Textarea } from './components/ui/textarea';
import { Toaster } from './components/ui/toaster';
import { toast } from './hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Progress } from './components/ui/progress';
import { 
  PlusCircle, TrendingUp, TrendingDown, Calculator, MessageCircle, 
  FileText, Trash2, IndianRupee, Building, Receipt, Bot, ChartBar,
  DollarSign, CreditCard, AlertTriangle, CheckCircle, Info,
  Download, Upload, Calendar, BarChart3, PieChart, Target,
  Lightbulb, FileCheck, HelpCircle, Settings, Zap
} from 'lucide-react';

// Enhanced backend detection for desktop app
const BACKEND_URL = window.electron 
  ? 'http://127.0.0.1:8001'  // Local backend for desktop app
  : process.env.REACT_APP_BACKEND_URL; // Web backend URL
const API = `${BACKEND_URL}/api`;

const expenseCategories = [
  { value: 'office_rent', label: 'Office Rent', rate: '0%', description: 'Commercial property rent' },
  { value: 'equipment', label: 'Equipment', rate: '18%', description: 'Computers, furniture, machinery' },
  { value: 'travel', label: 'Travel', rate: '5%', description: 'Transportation and lodging' },
  { value: 'meals', label: 'Meals', rate: '5%', description: 'Business meals and entertainment' },
  { value: 'software', label: 'Software', rate: '18%', description: 'Software licenses and subscriptions' },
  { value: 'marketing', label: 'Marketing', rate: '18%', description: 'Advertising and promotion' },
  { value: 'professional_services', label: 'Professional Services', rate: '18%', description: 'Legal, accounting, consulting' },
  { value: 'utilities', label: 'Utilities', rate: '18%', description: 'Electricity, internet, phone' },
  { value: 'office_supplies', label: 'Office Supplies', rate: '18%', description: 'Stationery, printing materials' },
  { value: 'other', label: 'Other', rate: '18%', description: 'Miscellaneous business expenses' }
];

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

// Tax advice prompts for quick access
const quickTaxQueries = [
  { title: 'Optimize Tax Savings', query: 'How can I optimize my tax savings this quarter?' },
  { title: 'GST Filing Help', query: 'What do I need to know about GST filing deadlines?' },
  { title: 'Expense Deductions', query: 'What business expenses can I claim as deductions?' },
  { title: 'Compliance Check', query: 'Am I compliant with current GST regulations?' },
  { title: 'Quarterly Planning', query: 'Help me plan for quarterly tax payments' },
  { title: 'ITC Optimization', query: 'How can I maximize my Input Tax Credit?' }
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [gstSummary, setGstSummary] = useState(null);
  const [taxAdvice, setTaxAdvice] = useState('');
  const [taxQuery, setTaxQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedIncome, setSelectedIncome] = useState(null);
  
  // Form states
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    base_amount: '',
    vendor_name: '',
    vendor_state: '',
    user_state: 'Karnataka',
    invoice_number: ''
  });

  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    base_amount: '',
    client_name: '',
    client_state: '',
    user_state: 'Karnataka',
    invoice_number: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [expensesRes, incomeRes, summaryRes] = await Promise.all([
        axios.get(`${API}/expenses`),
        axios.get(`${API}/income`),
        axios.get(`${API}/gst-summary`)
      ]);
      
      setExpenses(expensesRes.data);
      setIncome(incomeRes.data);
      setGstSummary(summaryRes.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data. Please check your connection.",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.category || !expenseForm.base_amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      await axios.post(`${API}/expenses`, {
        ...expenseForm,
        base_amount: parseFloat(expenseForm.base_amount)
      });
      
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        base_amount: '',
        vendor_name: '',
        vendor_state: '',
        user_state: 'Karnataka',
        invoice_number: ''
      });
      
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive"
      });
      console.error(error);
    }
  };

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    if (!incomeForm.description || !incomeForm.base_amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      await axios.post(`${API}/income`, {
        ...incomeForm,
        base_amount: parseFloat(incomeForm.base_amount)
      });
      
      setIncomeForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        base_amount: '',
        client_name: '',
        client_state: '',
        user_state: 'Karnataka',
        invoice_number: ''
      });
      
      toast({
        title: "Success",
        description: "Income added successfully",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add income. Please try again.",
        variant: "destructive"
      });
      console.error(error);
    }
  };

  const handleTaxAdvice = async (query = taxQuery) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/tax-advice`, {
        query: query,
        user_context: { gst_summary: gstSummary }
      });
      setTaxAdvice(response.data.advice);
      setTaxQuery('');
      
      toast({
        title: "Success",
        description: "Tax advice generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get tax advice. Please try again.",
        variant: "destructive"
      });
      console.error(error);
    }
    setIsLoading(false);
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await axios.delete(`${API}/expenses/${id}`);
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive"
      });
      console.error(error);
    }
  };

  const deleteIncome = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income record?')) return;
    
    try {
      await axios.delete(`${API}/income/${id}`);
      toast({
        title: "Success",
        description: "Income record deleted successfully",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete income record",
        variant: "destructive"
      });
      console.error(error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getGSTTypeDisplay = (gstCalc) => {
    if (gstCalc.is_interstate) {
      return <Badge variant="outline">IGST ({gstCalc.gst_rate}%)</Badge>;
    } else {
      return (
        <div className="flex gap-1">
          <Badge variant="outline" className="text-xs">CGST ({gstCalc.gst_rate/2}%)</Badge>
          <Badge variant="outline" className="text-xs">SGST ({gstCalc.gst_rate/2}%)</Badge>
        </div>
      );
    }
  };

  const getDashboardInsights = () => {
    if (!gstSummary) return [];
    
    const insights = [];
    
    // GST Liability Alert
    if (gstSummary.net_gst_liability > 50000) {
      insights.push({
        type: 'warning',
        title: 'High GST Liability',
        description: `Your current GST liability is ${formatCurrency(gstSummary.net_gst_liability)}. Consider advance payment.`,
        action: 'Plan GST Payment'
      });
    }
    
    // ITC Optimization
    if (gstSummary.input_tax_credit < gstSummary.output_gst * 0.3) {
      insights.push({
        type: 'info',
        title: 'ITC Optimization',
        description: 'You might be missing Input Tax Credit claims. Review your business expenses.',
        action: 'Review Expenses'
      });
    }
    
    // Quarterly Filing Reminder
    const currentDate = new Date();
    const quarterEnd = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3 + 3, 0);
    const daysToQuarterEnd = Math.ceil((quarterEnd - currentDate) / (1000 * 60 * 60 * 24));
    
    if (daysToQuarterEnd <= 15 && daysToQuarterEnd > 0) {
      insights.push({
        type: 'info',
        title: 'Quarter End Approaching',
        description: `Quarter ends in ${daysToQuarterEnd} days. Prepare your GST returns.`,
        action: 'View Returns'
      });
    }
    
    return insights;
  };

  const renderDashboard = () => {
    const insights = getDashboardInsights();
    
    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gstSummary ? formatCurrency(gstSummary.total_sales) : '₹0.00'}</div>
              <p className="text-xs text-muted-foreground">Revenue with GST</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gstSummary ? formatCurrency(gstSummary.total_purchases) : '₹0.00'}</div>
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
                {gstSummary ? formatCurrency(gstSummary.net_gst_liability) : '₹0.00'}
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
                {gstSummary ? formatCurrency(gstSummary.input_tax_credit) : '₹0.00'}
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
                <Receipt className="h-5 w-5" />
                Recent Expenses
              </CardTitle>
              <CardDescription>Last 5 expense entries</CardDescription>
            </CardHeader>
            <CardContent>
              {expenses.length > 0 ? (
                <div className="space-y-3">
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(expense.date)} • {expenseCategories.find(cat => cat.value === expense.category)?.label}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(expense.gst_calculation.total_amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          GST: {formatCurrency(expense.gst_calculation.total_gst)}
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
                <DollarSign className="h-5 w-5" />
                Recent Income
              </CardTitle>
              <CardDescription>Last 5 income entries</CardDescription>
            </CardHeader>
            <CardContent>
              {income.length > 0 ? (
                <div className="space-y-3">
                  {income.slice(0, 5).map((incomeItem) => (
                    <div key={incomeItem.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{incomeItem.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(incomeItem.date)} • {incomeItem.client_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(incomeItem.gst_calculation.total_amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          GST: {formatCurrency(incomeItem.gst_calculation.total_gst)}
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
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" onClick={() => setActiveTab('expenses')} className="h-20 flex flex-col items-center justify-center gap-2">
                <PlusCircle className="h-6 w-6" />
                Add Expense
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('income')} className="h-20 flex flex-col items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Add Income
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('gst-summary')} className="h-20 flex flex-col items-center justify-center gap-2">
                <BarChart3 className="h-6 w-6" />
                View Reports
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('tax-advice')} className="h-20 flex flex-col items-center justify-center gap-2">
                <Bot className="h-6 w-6" />
                Tax Advice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const deleteIncome = async (id) => {
    try {
      await axios.delete(`${API}/income/${id}`);
      toast.success('Income deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete income');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">GST Pro</h1>
                <p className="text-sm text-slate-600">Automated GST & Tax Platform</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">For Freelancers & Gig Workers</p>
              <p className="text-xs text-slate-500">Powered by AI</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/60 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <ChartBar className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="income" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Income
            </TabsTrigger>
            <TabsTrigger value="tax-advisor" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Tax Advisor
            </TabsTrigger>
            <TabsTrigger value="returns" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Returns
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            {gstSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Total Sales</p>
                      <p className="text-2xl font-bold text-green-800">{formatCurrency(gstSummary.total_sales)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Purchases</p>
                      <p className="text-2xl font-bold text-blue-800">{formatCurrency(gstSummary.total_purchases)}</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-blue-600" />
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">Input Tax Credit</p>
                      <p className="text-2xl font-bold text-orange-800">{formatCurrency(gstSummary.input_tax_credit)}</p>
                    </div>
                    <Receipt className="h-8 w-8 text-orange-600" />
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Net GST Liability</p>
                      <p className="text-2xl font-bold text-purple-800">{formatCurrency(gstSummary.net_gst_liability)}</p>
                    </div>
                    <IndianRupee className="h-8 w-8 text-purple-600" />
                  </div>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Expenses */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Recent Expenses
                </h3>
                <div className="space-y-3">
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center py-2 border-b border-slate-100">
                      <div>
                        <p className="font-medium text-slate-800">{expense.description}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(expense.date).toLocaleDateString()} • {expense.category.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-800">{formatCurrency(expense.gst_calculation.total_amount)}</p>
                        <p className="text-sm text-slate-600">GST: {formatCurrency(expense.gst_calculation.total_gst)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent Income */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Recent Income
                </h3>
                <div className="space-y-3">
                  {income.slice(0, 5).map((inc) => (
                    <div key={inc.id} className="flex justify-between items-center py-2 border-b border-slate-100">
                      <div>
                        <p className="font-medium text-slate-800">{inc.description}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(inc.date).toLocaleDateString()} • {inc.client_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-800">{formatCurrency(inc.gst_calculation.total_amount)}</p>
                        <p className="text-sm text-slate-600">GST: {formatCurrency(inc.gst_calculation.total_gst)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Add New Expense
              </h3>
              <form onSubmit={handleExpenseSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    placeholder="Office supplies, software license..."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({...expenseForm, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label} ({cat.rate})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={expenseForm.base_amount}
                    onChange={(e) => setExpenseForm({...expenseForm, base_amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="vendor">Vendor Name</Label>
                  <Input
                    id="vendor"
                    value={expenseForm.vendor_name}
                    onChange={(e) => setExpenseForm({...expenseForm, vendor_name: e.target.value})}
                    placeholder="Vendor name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="vendor_state">Vendor State</Label>
                  <Select value={expenseForm.vendor_state} onValueChange={(value) => setExpenseForm({...expenseForm, vendor_state: value})}>
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
                
                <div className="md:col-span-2 lg:col-span-3">
                  <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              </form>
            </Card>

            {/* Expenses Table */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">All Expenses</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Base Amount</TableHead>
                      <TableHead>GST</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{expense.category.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(expense.gst_calculation.base_amount)}</TableCell>
                        <TableCell>{formatCurrency(expense.gst_calculation.total_gst)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(expense.gst_calculation.total_amount)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteExpense(expense.id)}
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
            </Card>
          </TabsContent>

          {/* Income Tab */}
          <TabsContent value="income" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Add New Income
              </h3>
              <form onSubmit={handleIncomeSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="income_date">Date</Label>
                  <Input
                    id="income_date"
                    type="date"
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm({...incomeForm, date: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="income_description">Description</Label>
                  <Input
                    id="income_description"
                    value={incomeForm.description}
                    onChange={(e) => setIncomeForm({...incomeForm, description: e.target.value})}
                    placeholder="Consulting services, project work..."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="income_amount">Amount (₹)</Label>
                  <Input
                    id="income_amount"
                    type="number"
                    step="0.01"
                    value={incomeForm.base_amount}
                    onChange={(e) => setIncomeForm({...incomeForm, base_amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="client">Client Name</Label>
                  <Input
                    id="client"
                    value={incomeForm.client_name}
                    onChange={(e) => setIncomeForm({...incomeForm, client_name: e.target.value})}
                    placeholder="Client name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="client_state">Client State</Label>
                  <Select value={incomeForm.client_state} onValueChange={(value) => setIncomeForm({...incomeForm, client_state: value})}>
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
                
                <div className="md:col-span-2 lg:col-span-3">
                  <Button type="submit" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Income
                  </Button>
                </div>
              </form>
            </Card>

            {/* Income Table */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">All Income</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Base Amount</TableHead>
                      <TableHead>GST</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {income.map((inc) => (
                      <TableRow key={inc.id}>
                        <TableCell>{new Date(inc.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{inc.description}</TableCell>
                        <TableCell>{inc.client_name}</TableCell>
                        <TableCell>{formatCurrency(inc.gst_calculation.base_amount)}</TableCell>
                        <TableCell>{formatCurrency(inc.gst_calculation.total_gst)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(inc.gst_calculation.total_amount)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteIncome(inc.id)}
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
            </Card>
          </TabsContent>

          {/* Tax Advisor Tab */}
          <TabsContent value="tax-advisor" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                AI Tax Advisor & CA Consultation
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tax_query">Ask your GST or tax question</Label>
                  <Textarea
                    id="tax_query"
                    value={taxQuery}
                    onChange={(e) => setTaxQuery(e.target.value)}
                    placeholder="How can I optimize my GST filings? What deductions can I claim as a freelancer? How to calculate input tax credit?"
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleTaxAdvice}
                  disabled={isLoading || !taxQuery.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {isLoading ? 'Getting Advice...' : 'Get AI Tax Advice'}
                </Button>
              </div>
              
              {taxAdvice && (
                <Card className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI Tax Advisor Response
                  </h4>
                  <div className="prose prose-sm text-slate-700 whitespace-pre-wrap">
                    {taxAdvice}
                  </div>
                </Card>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Tax Tips for Freelancers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800">GST Registration</h4>
                  <p className="text-sm text-green-700 mt-1">Register for GST if your annual turnover exceeds ₹20 lakhs (₹10 lakhs for special states)</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800">Input Tax Credit</h4>
                  <p className="text-sm text-blue-700 mt-1">Claim ITC on business expenses like office rent, equipment, and professional services</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800">ITR-4 Filing</h4>
                  <p className="text-sm text-purple-700 mt-1">File ITR-4 if you're a freelancer with business income under presumptive taxation</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-800">Quarterly Returns</h4>
                  <p className="text-sm text-orange-700 mt-1">File GSTR-1 and GSTR-3B quarterly if turnover is less than ₹1.5 crores</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Returns Tab */}
          <TabsContent value="returns" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                GST Return Generation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 border-2 border-dashed border-slate-300 text-center">
                  <FileText className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <h4 className="font-medium text-slate-700">GSTR-1</h4>
                  <p className="text-sm text-slate-600 mb-3">Outward supplies return</p>
                  <Button variant="outline" className="w-full" disabled>
                    Generate GSTR-1
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">Coming Soon</p>
                </Card>
                
                <Card className="p-4 border-2 border-dashed border-slate-300 text-center">
                  <FileText className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <h4 className="font-medium text-slate-700">GSTR-3B</h4>
                  <p className="text-sm text-slate-600 mb-3">Monthly summary return</p>
                  <Button variant="outline" className="w-full" disabled>
                    Generate GSTR-3B
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">Coming Soon</p>
                </Card>
                
                <Card className="p-4 border-2 border-dashed border-slate-300 text-center">
                  <FileText className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <h4 className="font-medium text-slate-700">ITR-4</h4>
                  <p className="text-sm text-slate-600 mb-3">Presumptive business income</p>
                  <Button variant="outline" className="w-full" disabled>
                    Generate ITR-4
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">Coming Soon</p>
                </Card>
              </div>
            </Card>

            {gstSummary && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">GST Liability Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Total Output GST (Sales)</span>
                    <span className="font-bold text-green-600">{formatCurrency(gstSummary.output_gst)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Total Input Tax Credit</span>
                    <span className="font-bold text-blue-600">-{formatCurrency(gstSummary.input_tax_credit)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-300">
                    <span className="font-bold text-lg">Net GST Liability</span>
                    <span className="font-bold text-xl text-purple-600">{formatCurrency(gstSummary.net_gst_liability)}</span>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-700">CGST Payable</p>
                      <p className="font-bold text-orange-800">{formatCurrency(gstSummary.cgst_liability)}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">SGST Payable</p>
                      <p className="font-bold text-blue-800">{formatCurrency(gstSummary.sgst_liability)}</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700">IGST Payable</p>
                      <p className="font-bold text-purple-800">{formatCurrency(gstSummary.igst_liability)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-md border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-slate-600">
              © 2025 GST Pro - Automated GST & Tax Platform for Freelancers
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Powered by AI • Designed for Indian GST Compliance
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;